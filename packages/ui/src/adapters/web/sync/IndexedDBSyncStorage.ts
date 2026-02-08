import type { Checkpoint, PullRecord, SyncRecord } from "@immersive-lang/shared";
import { db, getCurrentTimestamp, getSyncMeta, setSyncMeta, SYNC_META_KEYS } from "@immersive-lang/ui/adapters/web";

/**
 * IndexedDB storage layer for sync operations
 * Handles pending changes, checkpoints, and applying remote changes
 */
export class IndexedDBSyncStorage {
    /**
     * Get all pending changes that need to be pushed to server
     */
    async getPendingChanges(): Promise<SyncRecord[]> {
        const records: SyncRecord[] = [];

        // Get unsynced session history (where synced_at is null or undefined)
        const sessions = await db.sessions.toArray();
        for (const session of sessions) {
            if (session.synced_at === null || session.synced_at === undefined) {
                records.push({
                    tableName: "session_history",
                    rowId: session.id,
                    data: {
                        mission_json: session.mission_json,
                        language: session.language,
                        from_language: session.from_language,
                        mode: session.mode,
                        voice: session.voice,
                        result_json: session.result_json,
                        completed_at: session.completed_at,
                    },
                    version: session.sync_version,
                    deleted: session.deleted === 1,
                });
            }
        }

        // Get pending deletes from _pendingChanges table
        const pendingDeletes = await db._pendingChanges.toArray();
        for (const change of pendingDeletes) {
            if (change.operation === "delete") {
                records.push({
                    tableName: "session_history",
                    rowId: change.rowId,
                    data: {},
                    version: change.version,
                    deleted: true,
                });
            }
        }

        return records;
    }

    /**
     * Get count of pending changes
     */
    async getPendingChangesCount(): Promise<number> {
        const unsyncedCount = await db.sessions
            .filter((session) => session.synced_at === null || session.synced_at === undefined)
            .count();
        const pendingDeletesCount = await db._pendingChanges.count();
        return unsyncedCount + pendingDeletesCount;
    }

    /**
     * Mark records as synced after successful push
     */
    async markSynced(records: SyncRecord[]): Promise<void> {
        const now = getCurrentTimestamp();

        for (const record of records) {
            if (record.deleted) {
                // Remove from pending changes and hard delete from sessions if needed
                await db._pendingChanges.where({ tableName: record.tableName, rowId: record.rowId }).delete();
            } else {
                // Update synced_at timestamp
                await db.sessions.update(record.rowId, { synced_at: now });
            }
        }
    }

    /**
     * Apply remote changes from server (pull)
     */
    async applyRemoteChanges(records: PullRecord[]): Promise<void> {
        const now = getCurrentTimestamp();

        // Separate by deleted status
        const nonDeleted = records.filter((r) => !r.deleted);
        const deleted = records.filter((r) => r.deleted);

        // Apply creates/updates
        for (const record of nonDeleted) {
            await this.upsertRecord(record, now);
        }

        // Apply deletes
        for (const record of deleted) {
            await this.deleteRecord(record);
        }
    }

    /**
     * Upsert a record (create or update)
     */
    private async upsertRecord(record: PullRecord, now: number): Promise<void> {
        const existing = await db.sessions.get(record.rowId);

        // Convert server format to DB format
        const dbRecord = {
            id: record.rowId,
            mission_json: (record.data.mission_json as string) ?? null,
            language: record.data.language as string,
            from_language: record.data.from_language as string,
            mode: record.data.mode as string,
            voice: record.data.voice as string,
            result_json: record.data.result_json as string,
            completed_at: record.data.completed_at as number,
            sync_version: record.version,
            synced_at: now,
            deleted: 0,
            deleted_at: null,
        };

        if (!existing) {
            // New record - insert
            await db.sessions.add(dbRecord);
        } else {
            // Existing record - check version for conflict resolution
            if (existing.sync_version <= record.version) {
                // Server wins (or same version)
                await db.sessions.put(dbRecord);
            }
            // else: local version is newer, skip (client wins for this conflict)
        }
    }

    /**
     * Delete a record (soft delete or hard delete depending on TTL)
     */
    private async deleteRecord(record: PullRecord): Promise<void> {
        const existing = await db.sessions.get(record.rowId);
        if (!existing) return;

        // Hard delete if past TTL, otherwise soft delete
        const deletedAt = (record.data.deleted_at as number | null) ?? Date.now();
        const TTL = 60 * 24 * 60 * 60 * 1000; // 60 days in ms

        if (Date.now() - deletedAt > TTL) {
            // Hard delete
            await db.sessions.delete(record.rowId);
        } else {
            // Soft delete
            await db.sessions.update(record.rowId, {
                deleted: 1,
                deleted_at: deletedAt,
                sync_version: record.version,
                synced_at: Date.now(),
            });
        }
    }

    /**
     * Get last sync checkpoint
     */
    async getCheckpoint(): Promise<Checkpoint | null> {
        const checkpointStr = await getSyncMeta(SYNC_META_KEYS.CHECKPOINT);
        if (!checkpointStr) return null;
        try {
            return JSON.parse(checkpointStr) as Checkpoint;
        } catch {
            return null;
        }
    }

    /**
     * Save sync checkpoint
     */
    async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
        await setSyncMeta(SYNC_META_KEYS.CHECKPOINT, JSON.stringify(checkpoint));
    }

    /**
     * Get last sync timestamp
     */
    async getLastSyncAt(): Promise<number | null> {
        const lastSyncStr = await getSyncMeta(SYNC_META_KEYS.LAST_SYNC);
        if (!lastSyncStr) return null;
        try {
            return parseInt(lastSyncStr, 10);
        } catch {
            return null;
        }
    }

    /**
     * Save last sync timestamp
     */
    async saveLastSyncAt(timestamp: number): Promise<void> {
        await setSyncMeta(SYNC_META_KEYS.LAST_SYNC, timestamp.toString());
    }
}
