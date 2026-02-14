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

        // Version 1: Original snake_case schema
        this.version(1).stores({
            sessions: "id, completed_at, language, from_language, mode, deleted, sync_version, synced_at",
            _syncMeta: "key",
            _pendingChanges: "++id, tableName, rowId",
        });

        // Version 2: Migrate to camelCase schema
        this.version(2)
            .stores({
                sessions: "id, completedAt, language, fromLanguage, mode, deleted, syncVersion, syncedAt",
                _syncMeta: "key",
                _pendingChanges: "++id, tableName, rowId",
            })
            .upgrade((tx) => {
                // Migrate existing records from snake_case to camelCase
                return tx
                    .table("sessions")
                    .toCollection()
                    .modify((session: Record<string, unknown>) => {
                        // Map snake_case fields to camelCase
                        if ("mission_json" in session) {
                            session.missionJson = session.mission_json;
                            delete session.mission_json;
                        }
                        if ("from_language" in session) {
                            session.fromLanguage = session.from_language;
                            delete session.from_language;
                        }
                        if ("result_json" in session) {
                            session.resultJson = session.result_json;
                            delete session.result_json;
                        }
                        if ("completed_at" in session) {
                            session.completedAt = session.completed_at;
                            delete session.completed_at;
                        }
                        if ("ielts_result_json" in session) {
                            session.ieltsResultJson = session.ielts_result_json;
                            delete session.ielts_result_json;
                        }
                        if ("ielts_config_json" in session) {
                            session.ieltsConfigJson = session.ielts_config_json;
                            delete session.ielts_config_json;
                        }
                        if ("sync_version" in session) {
                            session.syncVersion = session.sync_version;
                            delete session.sync_version;
                        }
                        if ("synced_at" in session) {
                            session.syncedAt = session.synced_at;
                            delete session.synced_at;
                        }
                        if ("deleted_at" in session) {
                            session.deletedAt = session.deleted_at;
                            delete session.deleted_at;
                        }
                    });
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
