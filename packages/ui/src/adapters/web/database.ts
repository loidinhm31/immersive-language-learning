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

    constructor(dbName = "immergo_session_history") {
        super(dbName);

        this.version(1).stores({
            sessions: "id, completedAt, language, fromLanguage, mode, deleted, syncVersion, syncedAt",
            _syncMeta: "key",
            _pendingChanges: "++id, tableName, rowId",
        });
    }
}

// =============================================================================
// Per-user DB management
// =============================================================================

let _db: ImmersiveLangDatabase | null = null;
let _currentUserId: string | null = null;

async function hashUserId(userId: string): Promise<string> {
    const encoded = new TextEncoder().encode(userId);
    const hash = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 12);
}

/**
 * Initialize (or reinitialize) the DB for a specific user.
 * If userId is undefined (standalone mode), uses the legacy "immergo_session_history" name.
 * Calling with the same userId is a no-op.
 */
export async function initDb(userId?: string): Promise<ImmersiveLangDatabase> {
    if (!userId) {
        if (!_db || _currentUserId !== null) {
            if (_db) _db.close();
            _db = new ImmersiveLangDatabase("immergo_session_history");
            _currentUserId = null;
        }
        return _db;
    }
    if (_db && _currentUserId === userId) return _db;
    if (_db) _db.close();
    const prefix = await hashUserId(userId);
    _db = new ImmersiveLangDatabase(`immergo_session_history_${prefix}`);
    _currentUserId = userId;
    return _db;
}

/** Returns the active DB instance. Throws if initDb() has not been called. */
export function getDb(): ImmersiveLangDatabase {
    if (!_db) throw new Error("ImmersiveLangDB not initialized. Call initDb() first.");
    return _db;
}

/** Close and delete the current user's IndexedDB. Used on logout. */
export async function deleteCurrentDb(): Promise<void> {
    if (_db) {
        const name = _db.name;
        _db.close();
        await Dexie.delete(name);
        _db = null;
        _currentUserId = null;
    }
}

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
    const meta = await getDb()._syncMeta.get(key);
    return meta?.value ?? null;
}

/**
 * Helper to set sync metadata
 */
export async function setSyncMeta(key: string, value: string): Promise<void> {
    await getDb()._syncMeta.put({ key, value });
}

/**
 * Helper to delete sync metadata
 */
export async function deleteSyncMeta(key: string): Promise<void> {
    await getDb()._syncMeta.delete(key);
}
