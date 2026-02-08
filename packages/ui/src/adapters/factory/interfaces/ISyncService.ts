import type { SyncResult, SyncStatus, SyncConfig } from "@immersive-lang/shared";

/**
 * Sync service interface for data synchronization
 * Implemented by platform-specific adapters:
 * - TauriSyncAdapter: Uses Tauri invoke for desktop
 * - IndexedDBSyncAdapter: Direct sync for web via IndexedDB
 */
export interface ISyncService {
    /**
     * Configure sync settings (server URL, app ID, API key)
     */
    configure(config: SyncConfig): Promise<void>;

    /**
     * Trigger a sync operation
     * Pushes local changes and pulls remote changes
     */
    syncNow(): Promise<SyncResult>;

    /**
     * Get current sync status
     */
    getStatus(): Promise<SyncStatus>;

    /**
     * Reset sync state (for debugging/troubleshooting)
     */
    resetSync(): Promise<void>;
}
