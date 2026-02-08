import type { SyncResult, SyncStatus, SyncConfig } from "@immersive-lang/shared";
import { tauriInvoke } from "./tauriInvoke";
import type { ISyncService } from "@immersive-lang/ui/adapters/factory/interfaces";

/**
 * Tauri sync adapter - delegates sync operations to Rust backend via IPC
 */
export class TauriSyncAdapter implements ISyncService {
    async configure(config: SyncConfig): Promise<void> {
        return tauriInvoke<void>("configure_sync", { config });
    }

    async syncNow(): Promise<SyncResult> {
        return tauriInvoke<SyncResult>("sync_now");
    }

    async getStatus(): Promise<SyncStatus> {
        return tauriInvoke<SyncStatus>("get_sync_status");
    }

    async resetSync(): Promise<void> {
        return tauriInvoke<void>("reset_sync");
    }
}
