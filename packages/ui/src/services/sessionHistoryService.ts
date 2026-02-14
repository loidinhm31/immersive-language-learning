import type { SessionHistoryEntry } from "@immersive-lang/shared";
import { getSessionHistoryService } from "@immersive-lang/ui/adapters";
import type { SessionHistoryFilter } from "@immersive-lang/ui/adapters/factory/interfaces";

function handleError(error: unknown): Error {
    if (typeof error === "string") {
        return new Error(error);
    }
    return error instanceof Error ? error : new Error("Unknown error occurred");
}

export async function saveSessionHistory(entry: SessionHistoryEntry): Promise<void> {
    try {
        await getSessionHistoryService().save(entry);
    } catch (error) {
        console.error("Error saving session:", error);
        throw handleError(error);
    }
}

export async function getSessionHistory(id: string): Promise<SessionHistoryEntry | undefined> {
    try {
        const result = await getSessionHistoryService().get(id);
        return result ?? undefined;
    } catch (error) {
        console.error("Error getting session:", error);
        throw handleError(error);
    }
}

export async function getAllSessionHistory(filter?: SessionHistoryFilter): Promise<SessionHistoryEntry[]> {
    try {
        return await getSessionHistoryService().getAll(filter);
    } catch (error) {
        console.error("Error getting all sessions:", error);
        throw handleError(error);
    }
}

export async function deleteSessionHistory(id: string): Promise<void> {
    try {
        await getSessionHistoryService().delete(id);
    } catch (error) {
        console.error("Error deleting session:", error);
        throw handleError(error);
    }
}

export async function clearSessionHistory(): Promise<void> {
    try {
        await getSessionHistoryService().clear();
    } catch (error) {
        console.error("Error clearing history:", error);
        throw handleError(error);
    }
}

export async function countSessionHistory(filter?: SessionHistoryFilter): Promise<number> {
    try {
        return await getSessionHistoryService().count(filter);
    } catch (error) {
        console.error("Error counting sessions:", error);
        throw handleError(error);
    }
}
