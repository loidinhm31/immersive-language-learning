/**
 * Web Session History Adapter
 *
 * IndexedDB-based implementation of ISessionHistoryService using Dexie.
 * Uses the shared database from database.ts with camelCase field names.
 */

import type { SessionHistoryEntry } from "@immersive-lang/shared";
import type { ISessionHistoryService, SessionHistoryFilter } from "@immersive-lang/ui/adapters/factory/interfaces";
import { getDb, type DbSessionHistory } from "./database";

export class WebSessionHistoryAdapter implements ISessionHistoryService {
    private toDbFormat(entry: SessionHistoryEntry): DbSessionHistory {
        return {
            id: entry.id,
            missionJson: entry.mission ? JSON.stringify(entry.mission) : null,
            language: entry.language,
            fromLanguage: entry.fromLanguage,
            mode: entry.mode,
            voice: entry.voice,
            resultJson: JSON.stringify(entry.result),
            completedAt: entry.completedAt,
            ieltsResultJson: entry.ieltsResult ? JSON.stringify(entry.ieltsResult) : null,
            ieltsConfigJson: entry.ieltsConfig ? JSON.stringify(entry.ieltsConfig) : null,
            syncVersion: entry.syncVersion ?? 1,
            syncedAt: entry.syncedAt ?? null,
            deleted: entry.deleted ? 1 : 0,
            deletedAt: entry.deletedAt ?? null,
        };
    }

    private fromDbFormat(row: DbSessionHistory): SessionHistoryEntry {
        return {
            id: row.id,
            mission: row.missionJson ? JSON.parse(row.missionJson) : null,
            language: row.language,
            fromLanguage: row.fromLanguage,
            mode: row.mode as SessionHistoryEntry["mode"],
            voice: row.voice,
            result: JSON.parse(row.resultJson),
            completedAt: row.completedAt,
            ieltsResult: row.ieltsResultJson ? JSON.parse(row.ieltsResultJson) : undefined,
            ieltsConfig: row.ieltsConfigJson ? JSON.parse(row.ieltsConfigJson) : undefined,
            syncVersion: row.syncVersion,
            syncedAt: row.syncedAt,
            deleted: row.deleted === 1,
            deletedAt: row.deletedAt,
        };
    }

    async save(entry: SessionHistoryEntry): Promise<void> {
        const dbEntry = this.toDbFormat(entry);
        await getDb().sessions.put(dbEntry);
    }

    async getAll(filter?: SessionHistoryFilter): Promise<SessionHistoryEntry[]> {
        let collection = getDb().sessions.where("deleted").equals(0);

        if (filter?.language) {
            collection = collection.and((item) => item.language === filter.language);
        }
        if (filter?.fromLanguage) {
            collection = collection.and((item) => item.fromLanguage === filter.fromLanguage);
        }
        if (filter?.mode) {
            collection = collection.and((item) => item.mode === filter.mode);
        }
        if (filter?.fromDate) {
            collection = collection.and((item) => item.completedAt >= filter.fromDate!);
        }
        if (filter?.toDate) {
            collection = collection.and((item) => item.completedAt <= filter.toDate!);
        }

        let results = await collection.sortBy("completedAt");
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
        const row = await getDb().sessions.get(id);
        if (!row || row.deleted === 1) {
            return null;
        }
        return this.fromDbFormat(row);
    }

    async delete(id: string): Promise<void> {
        const now = Date.now();
        const existing = await getDb().sessions.get(id);
        await getDb().sessions.update(id, {
            deleted: 1,
            deletedAt: now,
            syncVersion: (existing?.syncVersion ?? 0) + 1,
            syncedAt: null,
        });
    }

    async clear(): Promise<void> {
        const now = Date.now();
        await getDb().sessions.toCollection().modify({
            deleted: 1,
            deletedAt: now,
            syncedAt: null,
        });
    }

    async count(filter?: SessionHistoryFilter): Promise<number> {
        const entries = await this.getAll(filter);
        return entries.length;
    }
}
