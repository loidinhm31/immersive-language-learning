import type { SyncResult, SyncStatus, SyncConfig } from "@immersive-lang/shared";
import { QmSyncClient, fetchHttpClient, createSyncClientConfig, initialCheckpoint } from "@immersive-lang/shared";
import { APP_ID, env } from "@immersive-lang/shared";
import { serviceLogger } from "@immersive-lang/ui/utils";
import type { ISyncService } from "@immersive-lang/ui/adapters/factory/interfaces";
import { IndexedDBSyncStorage } from "./IndexedDBSyncStorage";
import { setSyncMeta, getSyncMeta, SYNC_META_KEYS } from "@immersive-lang/ui/adapters/web";

/**
 * Token provider callback type
 */
type TokenProvider = () => Promise<{
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
}>;

/**
 * Token saver callback type
 */
type TokenSaver = (accessToken: string, refreshToken: string, userId: string) => Promise<void>;

/**
 * IndexedDB sync adapter for web platform
 * Orchestrates sync operations between local IndexedDB and qm-center-server
 */
export class IndexedDBSyncAdapter implements ISyncService {
    private client: QmSyncClient;
    private storage: IndexedDBSyncStorage;
    private getTokens: TokenProvider;
    private saveTokens: TokenSaver;
    private isSyncingFlag = false;

    constructor(config: {
        serverUrl?: string;
        appId?: string;
        apiKey?: string;
        getTokens: TokenProvider;
        saveTokens: TokenSaver;
    }) {
        const serverUrl = config.serverUrl || env.serverUrl;
        const appId = config.appId || env.appId || APP_ID;
        const apiKey = config.apiKey || env.apiKey;

        this.getTokens = config.getTokens;
        this.saveTokens = config.saveTokens;
        this.storage = new IndexedDBSyncStorage();

        // Create QmSyncClient with fetch HTTP client
        this.client = new QmSyncClient(createSyncClientConfig(serverUrl, appId, apiKey), fetchHttpClient);

        serviceLogger.sync(`IndexedDB sync adapter initialized: ${serverUrl}`);
    }

    async configure(config: SyncConfig): Promise<void> {
        if (config.serverUrl) {
            await setSyncMeta(SYNC_META_KEYS.SERVER_URL, config.serverUrl);
            // Re-create client with new URL
            const appId = config.appId || (await getSyncMeta(SYNC_META_KEYS.APP_ID)) || APP_ID;
            const apiKey = config.apiKey || (await getSyncMeta(SYNC_META_KEYS.API_KEY)) || env.apiKey;
            this.client = new QmSyncClient(createSyncClientConfig(config.serverUrl, appId, apiKey), fetchHttpClient);
        }
        if (config.appId) {
            await setSyncMeta(SYNC_META_KEYS.APP_ID, config.appId);
        }
        if (config.apiKey) {
            await setSyncMeta(SYNC_META_KEYS.API_KEY, config.apiKey);
        }
        serviceLogger.sync("Sync configuration updated");
    }

    async syncNow(): Promise<SyncResult> {
        if (this.isSyncingFlag) {
            return {
                pushed: 0,
                pulled: 0,
                conflicts: 0,
                success: false,
                error: "Sync already in progress",
                syncedAt: Date.now(),
            };
        }

        this.isSyncingFlag = true;
        const syncedAt = Date.now();

        try {
            serviceLogger.sync("Starting sync...");

            // Get tokens from auth service
            const tokens = await this.getTokens();
            if (!tokens.accessToken || !tokens.refreshToken) {
                throw new Error("Not authenticated - no tokens available");
            }

            // Set tokens on client
            this.client.setTokens(tokens.accessToken, tokens.refreshToken);

            // Get pending changes
            const pendingChanges = await this.storage.getPendingChanges();
            serviceLogger.sync(`Found ${pendingChanges.length} pending changes`);

            // Get checkpoint
            let checkpoint = await this.storage.getCheckpoint();
            if (!checkpoint) {
                checkpoint = initialCheckpoint();
                serviceLogger.sync("No checkpoint found, using initial checkpoint");
            }

            // Perform delta sync (push + pull in one call)
            const response = await this.client.delta(pendingChanges, checkpoint);

            // Mark pushed records as synced
            if (response.push && response.push.synced > 0) {
                await this.storage.markSynced(pendingChanges.slice(0, response.push.synced));
            }

            // Apply pulled records
            if (response.pull && response.pull.records.length > 0) {
                await this.storage.applyRemoteChanges(response.pull.records);
            }

            // Save new checkpoint
            if (response.pull?.checkpoint) {
                await this.storage.saveCheckpoint(response.pull.checkpoint);
            }

            // Save last sync timestamp
            await this.storage.saveLastSyncAt(syncedAt);

            const result: SyncResult = {
                pushed: response.push?.synced ?? 0,
                pulled: response.pull?.records.length ?? 0,
                conflicts: response.push?.conflicts?.length ?? 0,
                success: true,
                syncedAt,
            };

            serviceLogger.sync(`Sync completed: pushed ${result.pushed}, pulled ${result.pulled}`);
            return result;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown sync error";
            serviceLogger.syncError(`Sync failed: ${errorMsg}`);
            return {
                pushed: 0,
                pulled: 0,
                conflicts: 0,
                success: false,
                error: errorMsg,
                syncedAt,
            };
        } finally {
            this.isSyncingFlag = false;
        }
    }

    async getStatus(): Promise<SyncStatus> {
        const [pendingChanges, lastSyncAt] = await Promise.all([
            this.storage.getPendingChangesCount(),
            this.storage.getLastSyncAt(),
        ]);
        const tokens = await this.getTokens();

        return {
            configured: true,
            authenticated: !!(tokens.accessToken && tokens.refreshToken),
            lastSyncAt: lastSyncAt ?? undefined,
            pendingChanges,
            serverUrl: this.client.config.serverUrl,
            isSyncing: this.isSyncingFlag,
        };
    }

    async resetSync(): Promise<void> {
        // Clear checkpoint and last sync timestamp
        await setSyncMeta(SYNC_META_KEYS.CHECKPOINT, JSON.stringify(initialCheckpoint()));
        await setSyncMeta(SYNC_META_KEYS.LAST_SYNC, "0");
        serviceLogger.sync("Sync state reset");
    }
}
