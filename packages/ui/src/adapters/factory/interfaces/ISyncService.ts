/**
 * Sync Service Interface
 *
 * Handles offline-first data synchronization between
 * local storage (SQLite/IndexedDB) and remote server.
 */

export interface SyncOptions {
  /**
   * Tables/collections to sync
   */
  tables?: string[];

  /**
   * Force full sync instead of incremental
   */
  fullSync?: boolean;

  /**
   * Callback to get current auth tokens
   */
  getTokens: () => Promise<{ accessToken: string; refreshToken: string } | null>;

  /**
   * Callback when tokens are refreshed during sync
   */
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
}

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  errors: SyncError[];
  lastSyncedAt: number;
}

export interface SyncError {
  table: string;
  recordId: string;
  error: string;
}

export interface ISyncService {
  /**
   * Perform sync with server
   */
  sync(options: SyncOptions): Promise<SyncResult>;

  /**
   * Get pending changes count
   */
  getPendingCount(): Promise<number>;

  /**
   * Get last sync timestamp
   */
  getLastSyncedAt(): Promise<number | null>;

  /**
   * Mark records as needing sync
   */
  markForSync(table: string, ids: string[]): Promise<void>;

  /**
   * Check if sync is in progress
   */
  isSyncing(): boolean;
}
