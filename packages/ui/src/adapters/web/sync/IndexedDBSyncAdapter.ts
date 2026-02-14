import type { SyncResult, SyncStatus, SyncProgress } from "@immersive-lang/shared";
import { QmSyncClient, fetchHttpClient, createSyncClientConfig, initialCheckpoint } from "@immersive-lang/shared";
import { APP_ID, env } from "@immersive-lang/shared";
import { serviceLogger } from "@immersive-lang/ui/utils";
import type { ISyncService } from "@immersive-lang/ui/adapters/factory/interfaces";
import { IndexedDBSyncStorage } from "./IndexedDBSyncStorage";
import { setSyncMeta, SYNC_META_KEYS } from "@immersive-lang/ui/adapters/web";

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
 * Sync config provider callback type
 */
type SyncConfigProvider = () => {
    serverUrl: string;
    appId: string;
    apiKey: string;
};

/**
 * IndexedDB sync adapter for web platform
 * Orchestrates sync operations between local IndexedDB and qm-center-server
 */
export class IndexedDBSyncAdapter implements ISyncService {
    private client: QmSyncClient | null = null;
    private storage: IndexedDBSyncStorage;
    private getConfig: SyncConfigProvider;
    private getTokens: TokenProvider;
    private saveTokens: TokenSaver;
    private isSyncingFlag = false;
    private lastConfigHash: string = "";

    constructor(config: { getConfig: SyncConfigProvider; getTokens: TokenProvider; saveTokens: TokenSaver }) {
        this.getConfig = config.getConfig;
        this.getTokens = config.getTokens;
        this.saveTokens = config.saveTokens;
        this.storage = new IndexedDBSyncStorage();

        serviceLogger.sync("IndexedDB sync adapter initialized");
    }

    private getConfigHash(config: { serverUrl: string; appId: string; apiKey: string }): string {
        return `${config.serverUrl}|${config.appId}|${config.apiKey}`;
    }

    private ensureClient(): QmSyncClient {
        const config = this.getConfig();
        const hash = this.getConfigHash(config);

        if (!this.client || hash !== this.lastConfigHash) {
            // Config changed, recreate client
            this.client = new QmSyncClient(
                createSyncClientConfig(config.serverUrl, config.appId, config.apiKey),
                fetchHttpClient,
            );
            this.lastConfigHash = hash;
            serviceLogger.sync(`Sync client created/updated: ${config.serverUrl}`);
        }

        return this.client;
    }

    async syncNow(): Promise<SyncResult> {
        // Call syncWithProgress with a no-op callback for backwards compatibility
        return this.syncWithProgress(() => {});
    }

    async syncWithProgress(onProgress: (progress: SyncProgress) => void): Promise<SyncResult> {
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

            // Ensure client is up-to-date with current config
            const client = this.ensureClient();

            // Get tokens from auth service
            const tokens = await this.getTokens();
            if (!tokens.accessToken || !tokens.refreshToken) {
                throw new Error("Not authenticated - no tokens available");
            }

            // Set tokens on client
            client.setTokens(tokens.accessToken, tokens.refreshToken);

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
            const response = await client.delta(pendingChanges, checkpoint);

            let pushed = 0;
            let pulled = 0;
            let conflicts = 0;

            // Push phase
            if (response.push) {
                pushed = response.push.synced;
                conflicts = response.push.conflicts?.length ?? 0;

                if (pushed > 0) {
                    await this.storage.markSynced(pendingChanges.slice(0, pushed));
                }

                // Emit progress after push phase
                onProgress({
                    phase: "pushing",
                    recordsPushed: pushed,
                    recordsPulled: 0,
                    hasMore: response.pull?.hasMore ?? false,
                    currentPage: 0,
                });
            }

            // Pull phase with hasMore pagination
            if (response.pull) {
                // Collect ALL records from ALL pages first to ensure proper ordering
                const allRecords = [...response.pull.records];
                pulled = allRecords.length;

                // Auto-continue pulling while hasMore is true
                let currentCheckpoint = response.pull.checkpoint;
                let hasMore = response.pull.hasMore;
                let page = 1;

                // Emit progress after initial pull
                onProgress({
                    phase: "pulling",
                    recordsPushed: pushed,
                    recordsPulled: pulled,
                    hasMore,
                    currentPage: page,
                });

                while (hasMore) {
                    page++;
                    serviceLogger.sync(
                        `Pulling more records (page ${page}), checkpoint: ${JSON.stringify(currentCheckpoint)}`,
                    );

                    const pullResponse = await client.pull(currentCheckpoint);

                    // Collect records from this page
                    allRecords.push(...pullResponse.records);
                    pulled += pullResponse.records.length;

                    currentCheckpoint = pullResponse.checkpoint;
                    hasMore = pullResponse.hasMore;

                    // Emit progress after each page
                    onProgress({
                        phase: "pulling",
                        recordsPushed: pushed,
                        recordsPulled: pulled,
                        hasMore,
                        currentPage: page,
                    });
                }

                // Apply ALL changes at once after collecting from all pages
                serviceLogger.sync(`Applying ${allRecords.length} total records from ${page} pages`);
                if (allRecords.length > 0) {
                    await this.storage.applyRemoteChanges(allRecords);
                }

                await this.storage.saveCheckpoint(currentCheckpoint);
            }

            // Save last sync timestamp
            await this.storage.saveLastSyncAt(syncedAt);

            const result: SyncResult = {
                pushed,
                pulled,
                conflicts,
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
        const client = this.ensureClient();
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
            serverUrl: client.config.serverUrl,
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
