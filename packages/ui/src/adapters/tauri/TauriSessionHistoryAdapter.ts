/**
 * Tauri Session History Adapter
 *
 * SQLite-based implementation of ISessionHistoryService via Tauri IPC.
 */

import type { SessionHistoryEntry } from "@immersive-lang/shared";
import type { ISessionHistoryService, SessionHistoryFilter } from "@immersive-lang/ui/adapters/factory/interfaces";
import { tauriInvoke } from "./tauriInvoke";

export class TauriSessionHistoryAdapter implements ISessionHistoryService {
    async save(entry: SessionHistoryEntry): Promise<void> {
        await tauriInvoke<void>("save_session", { entry });
    }

    async getAll(filter?: SessionHistoryFilter): Promise<SessionHistoryEntry[]> {
        return tauriInvoke<SessionHistoryEntry[]>("get_all_sessions", { filter });
    }

    async get(id: string): Promise<SessionHistoryEntry | null> {
        return tauriInvoke<SessionHistoryEntry | null>("get_session", { id });
    }

    async delete(id: string): Promise<void> {
        await tauriInvoke<void>("delete_session", { id });
    }

    async clear(): Promise<void> {
        await tauriInvoke<void>("clear_sessions", {});
    }

    async count(filter?: SessionHistoryFilter): Promise<number> {
        return tauriInvoke<number>("count_sessions", { filter });
    }
}
