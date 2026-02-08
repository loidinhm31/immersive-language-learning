/**
 * Service Factory
 *
 * Provides lazy singleton instances of platform-specific services.
 * Automatically selects Tauri or Web implementations based on platform.
 */

import { isTauri } from "@immersive-lang/ui/adapters/shared";
import type { IAuthService } from "@immersive-lang/ui/adapters/factory/interfaces";
import type { ISyncService } from "@immersive-lang/ui/adapters/factory/interfaces";
import type { ISessionHistoryService, IStorageService } from "@immersive-lang/ui/adapters";
import { LocalStorageAdapter } from "@immersive-lang/ui/adapters/web";
import { TauriSessionHistoryAdapter } from "@immersive-lang/ui/adapters/tauri";
import { WebSessionHistoryAdapter } from "@immersive-lang/ui/adapters/web";
import { QmServerAuthAdapter } from "@immersive-lang/ui/adapters/shared";
import { TauriSyncAdapter } from "@immersive-lang/ui/adapters/tauri";
import { IndexedDBSyncAdapter } from "@immersive-lang/ui/adapters/web";

// Lazy singleton instances
let authService: IAuthService | null = null;
let syncService: ISyncService | null = null;
let storageService: IStorageService | null = null;
let sessionHistoryService: ISessionHistoryService | null = null;

/**
 * Service Factory for platform-agnostic service access
 */
export const ServiceFactory = {
    /**
     * Get the authentication service
     */
    getAuthService(): IAuthService {
        if (!authService) {
            // Use QmServerAuthAdapter for both platforms (works in Tauri webview too)
            authService = new QmServerAuthAdapter();
        }
        return authService;
    },

    /**
     * Get the sync service
     */
    getSyncService(): ISyncService {
        if (!syncService) {
            if (isTauri()) {
                syncService = new TauriSyncAdapter();
            } else {
                // Get auth service for token management
                const auth = this.getAuthService();
                syncService = new IndexedDBSyncAdapter({
                    getTokens: () => auth.getTokens(),
                    saveTokens: (a, r, u) => auth.saveTokensExternal!(a, r, u),
                });
            }
        }
        return syncService;
    },

    /**
     * Get the storage service
     */
    getStorageService(): IStorageService {
        if (!storageService) {
            if (isTauri()) {
                // TODO: Import and instantiate TauriStorageAdapter
                throw new Error("TauriStorageAdapter not implemented. Add apps/native first.");
            } else {
                storageService = new LocalStorageAdapter();
            }
        }
        return storageService!;
    },

    /**
     * Get the session history service
     */
    getSessionHistoryService(): ISessionHistoryService {
        if (!sessionHistoryService) {
            if (isTauri()) {
                sessionHistoryService = new TauriSessionHistoryAdapter();
            } else {
                sessionHistoryService = new WebSessionHistoryAdapter();
            }
        }
        return sessionHistoryService!;
    },

    /**
     * Reset all service instances (useful for testing)
     */
    reset(): void {
        authService = null;
        syncService = null;
        storageService = null;
        sessionHistoryService = null;
    },

    /**
     * Inject mock services (for testing)
     */
    injectForTesting(services: {
        auth?: IAuthService;
        sync?: ISyncService;
        storage?: IStorageService;
        sessionHistory?: ISessionHistoryService;
    }): void {
        if (services.auth) authService = services.auth;
        if (services.sync) syncService = services.sync;
        if (services.storage) storageService = services.storage;
        if (services.sessionHistory) sessionHistoryService = services.sessionHistory;
    },
};
