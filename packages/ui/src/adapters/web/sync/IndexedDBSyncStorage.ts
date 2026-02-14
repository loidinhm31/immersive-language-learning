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

        // Get unsynced session history (where syncedAt is null or undefined)
        const sessions = await db.sessions.toArray();
        for (const session of sessions) {
            if (session.syncedAt === null || session.syncedAt === undefined) {
                records.push({
                    tableName: "sessionHistory",
                    rowId: session.id,
                    data: {
                        missionJson: session.missionJson,
                        language: session.language,
                        fromLanguage: session.fromLanguage,
                        mode: session.mode,
                        voice: session.voice,
                        resultJson: session.resultJson,
                        completedAt: session.completedAt,
                        ieltsResultJson: session.ieltsResultJson,
                        ieltsConfigJson: session.ieltsConfigJson,
                    },
                    version: session.syncVersion,
                    deleted: session.deleted === 1,
                });
            }
        }

        // Get pending deletes from _pendingChanges table
        const pendingDeletes = await db._pendingChanges.toArray();
        for (const change of pendingDeletes) {
            if (change.operation === "delete") {
                records.push({
                    tableName: "sessionHistory",
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
            .filter((session) => session.syncedAt === null || session.syncedAt === undefined)
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
                // Update syncedAt timestamp
                await db.sessions.update(record.rowId, { syncedAt: now });
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
     * Handles both old snake_case and new camelCase data from server for backwards compatibility
     */
    private async upsertRecord(record: PullRecord, now: number): Promise<void> {
        const existing = await db.sessions.get(record.rowId);
        const data = record.data;

        // Convert server format to DB format (handle both snake_case and camelCase for backwards compat)
        const dbRecord = {
            id: record.rowId,
            missionJson: ((data.missionJson ?? data.mission_json) as string) ?? null,
            language: data.language as string,
            fromLanguage: (data.fromLanguage ?? data.from_language) as string,
            mode: data.mode as string,
            voice: data.voice as string,
            resultJson: (data.resultJson ?? data.result_json) as string,
            completedAt: (data.completedAt ?? data.completed_at) as number,
            ieltsResultJson: ((data.ieltsResultJson ?? data.ielts_result_json) as string) ?? null,
            ieltsConfigJson: ((data.ieltsConfigJson ?? data.ielts_config_json) as string) ?? null,
            syncVersion: record.version,
            syncedAt: now,
            deleted: 0,
            deletedAt: null,
        };

        if (!existing) {
            // New record - insert
            await db.sessions.add(dbRecord);
        } else {
            // Existing record - check version for conflict resolution
            if (existing.syncVersion <= record.version) {
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

        // Hard delete if past TTL, otherwise soft delete (handle both snake_case and camelCase)
        const deletedAt = ((record.data.deletedAt ?? record.data.deleted_at) as number | null) ?? Date.now();
        const TTL = 60 * 24 * 60 * 60 * 1000; // 60 days in ms

        if (Date.now() - deletedAt > TTL) {
            // Hard delete
            await db.sessions.delete(record.rowId);
        } else {
            // Soft delete
            await db.sessions.update(record.rowId, {
                deleted: 1,
                deletedAt: deletedAt,
                syncVersion: record.version,
                syncedAt: Date.now(),
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
