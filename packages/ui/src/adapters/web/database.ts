import Dexie, { type EntityTable, type Table } from "dexie";

/**
 * Database schema for session history (snake_case to match server)
 */
export interface DbSessionHistory {
    id: string;
    mission_json: string | null;
    language: string;
    from_language: string;
    mode: string;
    voice: string;
    result_json: string;
    completed_at: number;
    sync_version: number;
    synced_at: number | null;
    deleted: number; // 0 or 1
    deleted_at: number | null;
}

/**
 * Sync metadata storage
 */
export interface SyncMeta {
    key: string;
    value: string;
}

/**
 * Pending changes tracking for delete operations
 */
export interface PendingChange {
    id?: number; // Auto-increment
    tableName: string;
    rowId: string;
    operation: "delete";
    version: number;
    timestamp: number;
}

/**
 * Sync metadata keys
 */
export const SYNC_META_KEYS = {
    CHECKPOINT: "sync_checkpoint",
    LAST_SYNC: "last_sync_timestamp",
    SERVER_URL: "server_url",
    APP_ID: "app_id",
    API_KEY: "api_key",
} as const;

/**
 * Main Dexie database for Immergo
 */
class ImmersiveLangDatabase extends Dexie {
    sessions!: EntityTable<DbSessionHistory, "id">;
    _syncMeta!: Table<SyncMeta, string>;
    _pendingChanges!: Table<PendingChange, number>;

    constructor() {
        super("immergo_session_history");

        this.version(1).stores({
            sessions: "id, completed_at, language, from_language, mode, deleted, sync_version, synced_at",
            _syncMeta: "key",
            _pendingChanges: "++id, tableName, rowId",
        });
    }
}

/**
 * Singleton database instance
 */
export const db = new ImmersiveLangDatabase();

/**
 * Generate a unique ID (UUID v4)
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Get current timestamp in milliseconds
 */
export function getCurrentTimestamp(): number {
    return Date.now();
}

/**
 * Helper to get sync metadata
 */
export async function getSyncMeta(key: string): Promise<string | null> {
    const meta = await db._syncMeta.get(key);
    return meta?.value ?? null;
}

/**
 * Helper to set sync metadata
 */
export async function setSyncMeta(key: string, value: string): Promise<void> {
    await db._syncMeta.put({ key, value });
}

/**
 * Helper to delete sync metadata
 */
export async function deleteSyncMeta(key: string): Promise<void> {
    await db._syncMeta.delete(key);
}
