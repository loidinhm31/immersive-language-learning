/**
 * Web Session History Adapter
 *
 * IndexedDB-based implementation of ISessionHistoryService using Dexie.
 */

import Dexie, { type Table } from "dexie";
import type { SessionHistoryEntry } from "@immersive-lang/shared";
import type { ISessionHistoryService, SessionHistoryFilter } from "@immersive-lang/ui/adapters/factory/interfaces";

interface DbSessionHistory {
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

class SessionHistoryDatabase extends Dexie {
    sessions!: Table<DbSessionHistory>;

    constructor() {
        super("immergo_session_history");
        this.version(1).stores({
            sessions: "id, completed_at, language, from_language, mode, deleted, sync_version, synced_at",
        });
    }
}

const db = new SessionHistoryDatabase();

export class WebSessionHistoryAdapter implements ISessionHistoryService {
    private toDbFormat(entry: SessionHistoryEntry): DbSessionHistory {
        return {
            id: entry.id,
            mission_json: entry.mission ? JSON.stringify(entry.mission) : null,
            language: entry.language,
            from_language: entry.fromLanguage,
            mode: entry.mode,
            voice: entry.voice,
            result_json: JSON.stringify(entry.result),
            completed_at: entry.completedAt,
            sync_version: entry.sync_version ?? 1,
            synced_at: entry.synced_at ?? null,
            deleted: entry.deleted ? 1 : 0,
            deleted_at: entry.deleted_at ?? null,
        };
    }

    private fromDbFormat(row: DbSessionHistory): SessionHistoryEntry {
        return {
            id: row.id,
            mission: row.mission_json ? JSON.parse(row.mission_json) : null,
            language: row.language,
            fromLanguage: row.from_language,
            mode: row.mode as SessionHistoryEntry["mode"],
            voice: row.voice,
            result: JSON.parse(row.result_json),
            completedAt: row.completed_at,
            sync_version: row.sync_version,
            synced_at: row.synced_at,
            deleted: row.deleted === 1,
            deleted_at: row.deleted_at,
        };
    }

    async save(entry: SessionHistoryEntry): Promise<void> {
        const dbEntry = this.toDbFormat(entry);
        await db.sessions.put(dbEntry);
    }

    async getAll(filter?: SessionHistoryFilter): Promise<SessionHistoryEntry[]> {
        let collection = db.sessions.where("deleted").equals(0);

        if (filter?.language) {
            collection = collection.and((item) => item.language === filter.language);
        }
        if (filter?.fromLanguage) {
            collection = collection.and((item) => item.from_language === filter.fromLanguage);
        }
        if (filter?.mode) {
            collection = collection.and((item) => item.mode === filter.mode);
        }
        if (filter?.fromDate) {
            collection = collection.and((item) => item.completed_at >= filter.fromDate!);
        }
        if (filter?.toDate) {
            collection = collection.and((item) => item.completed_at <= filter.toDate!);
        }

        let results = await collection.sortBy("completed_at");
        results = results.reverse(); // Most recent first

        if (filter?.offset) {
            results = results.slice(filter.offset);
        }
        if (filter?.limit) {
            results = results.slice(0, filter.limit);
        }

        return results.map((row) => this.fromDbFormat(row));
    }

    async get(id: string): Promise<SessionHistoryEntry | null> {
        const row = await db.sessions.get(id);
        if (!row || row.deleted === 1) {
            return null;
        }
        return this.fromDbFormat(row);
    }

    async delete(id: string): Promise<void> {
        const now = Date.now();
        await db.sessions.update(id, {
            deleted: 1,
            deleted_at: now,
            sync_version: (await db.sessions.get(id))?.sync_version ?? 0 + 1,
            synced_at: null,
        });
    }

    async clear(): Promise<void> {
        const now = Date.now();
        await db.sessions.toCollection().modify({
            deleted: 1,
            deleted_at: now,
            synced_at: null,
        });
    }

    async count(filter?: SessionHistoryFilter): Promise<number> {
        const entries = await this.getAll(filter);
        return entries.length;
    }
}
