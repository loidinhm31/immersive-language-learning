import Dexie, { type EntityTable, type Table } from "dexie";

/**
 * Database schema for session history (camelCase to match app conventions)
 */
export interface DbSessionHistory {
    id: string;
    missionJson: string | null;
    language: string;
    fromLanguage: string;
    mode: string;
    voice: string;
    resultJson: string;
    completedAt: number;
    ieltsResultJson?: string | null;
    ieltsConfigJson?: string | null;
    syncVersion: number;
    syncedAt: number | null;
    deleted: number; // 0 or 1
    deletedAt: number | null;
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
            sessions: "id, completedAt, language, fromLanguage, mode, deleted, syncVersion, syncedAt",
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
