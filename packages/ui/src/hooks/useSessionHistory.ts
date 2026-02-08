import { useState, useCallback } from "react";
import type { SessionHistoryEntry, Mission, AppMode, SessionResult } from "@immersive-lang/shared";
import { ServiceFactory } from "@immersive-lang/ui/adapters";
import type { SessionHistoryFilter } from "@immersive-lang/ui/adapters/factory/interfaces";

export interface UseSessionHistoryReturn {
    sessions: SessionHistoryEntry[];
    loading: boolean;
    error: string | null;
    loadSessions: (filter?: SessionHistoryFilter) => Promise<void>;
    saveSession: (params: SaveSessionParams) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    clearHistory: () => Promise<void>;
}

export interface SaveSessionParams {
    mission: Mission | null;
    language: string;
    fromLanguage: string;
    mode: AppMode;
    voice: string;
    result: SessionResult;
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useSessionHistory(): UseSessionHistoryReturn {
    const [sessions, setSessions] = useState<SessionHistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadSessions = useCallback(async (filter?: SessionHistoryFilter) => {
        try {
            setLoading(true);
            setError(null);
            const service = ServiceFactory.getSessionHistoryService();
            const entries = await service.getAll(filter);
            setSessions(entries);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load sessions");
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSession = useCallback(async (params: SaveSessionParams) => {
        try {
            const service = ServiceFactory.getSessionHistoryService();
            const entry: SessionHistoryEntry = {
                id: generateId(),
                mission: params.mission,
                language: params.language,
                fromLanguage: params.fromLanguage,
                mode: params.mode,
                voice: params.voice,
                result: params.result,
                completedAt: Date.now(),
                sync_version: 1,
                synced_at: null,
                deleted: false,
                deleted_at: null,
            };
            await service.save(entry);
            setSessions((prev) => [entry, ...prev]);
        } catch (err) {
            console.error("Failed to save session:", err);
            throw err;
        }
    }, []);

    const deleteSession = useCallback(async (id: string) => {
        try {
            const service = ServiceFactory.getSessionHistoryService();
            await service.delete(id);
            setSessions((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
            console.error("Failed to delete session:", err);
            throw err;
        }
    }, []);

    const clearHistory = useCallback(async () => {
        try {
            const service = ServiceFactory.getSessionHistoryService();
            await service.clear();
            setSessions([]);
        } catch (err) {
            console.error("Failed to clear history:", err);
            throw err;
        }
    }, []);

    return {
        sessions,
        loading,
        error,
        loadSessions,
        saveSession,
        deleteSession,
        clearHistory,
    };
}
