import type { SyncResult, SyncStatus, SyncProgress } from "@immersive-lang/shared";

/**
 * Sync service interface for data synchronization
 * Implemented by platform-specific adapters:
 * - TauriSyncAdapter: Uses Tauri invoke for desktop
 * - IndexedDBSyncAdapter: Direct sync for web via IndexedDB
 */
export interface ISyncService {
    /**
     * Trigger a sync operation
     * Pushes local changes and pulls remote changes
     */
    syncNow(): Promise<SyncResult>;

    /**
     * Trigger a sync operation with progress updates
     * Handles hasMore pagination automatically
     */
    syncWithProgress?(onProgress: (progress: SyncProgress) => void): Promise<SyncResult>;

    /**
     * Get current sync status
     */
    getStatus(): Promise<SyncStatus>;

    /**
     * Reset sync state (for debugging/troubleshooting)
     */
    resetSync(): Promise<void>;
}
