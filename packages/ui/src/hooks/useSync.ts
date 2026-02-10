import { useCallback, useEffect, useState } from "react";
import type { SyncStatus, SyncResult, SyncConfig } from "@immersive-lang/shared";
import { useSyncService } from "@immersive-lang/ui/platform";

export interface UseSyncReturn {
    status: SyncStatus | null;
    lastResult: SyncResult | null;
    error: string | null;
    isSyncing: boolean;
    syncNow: () => Promise<SyncResult>;
    configure: (config: SyncConfig) => Promise<void>;
    refreshStatus: () => Promise<void>;
}

/**
 * Hook for sync operations
 * Provides sync triggering and status checking
 */
export const useSync = (): UseSyncReturn => {
    const syncService = useSyncService();
    const [status, setStatus] = useState<SyncStatus | null>(null);
    const [lastResult, setLastResult] = useState<SyncResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const refreshStatus = useCallback(async () => {
        try {
            const newStatus = await syncService.getStatus();
            setStatus(newStatus);
            setIsSyncing(newStatus.isSyncing ?? false);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to get sync status";
            setError(errorMsg);
        }
    }, [syncService]);

    const syncNow = useCallback(async (): Promise<SyncResult> => {
        try {
            setIsSyncing(true);
            setError(null);
            const result = await syncService.syncNow();
            setLastResult(result);
            if (!result.success && result.error) {
                setError(result.error);
            }
            await refreshStatus();
            return result;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Sync failed";
            setError(errorMsg);
            const failedResult: SyncResult = {
                pushed: 0,
                pulled: 0,
                conflicts: 0,
                success: false,
                error: errorMsg,
                syncedAt: Date.now(),
            };
            setLastResult(failedResult);
            return failedResult;
        } finally {
            setIsSyncing(false);
        }
    }, [syncService, refreshStatus]);

    const configure = useCallback(
        async (config: SyncConfig) => {
            try {
                setError(null);
                await syncService.configure(config);
                await refreshStatus();
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "Failed to configure sync";
                setError(errorMsg);
            }
        },
        [syncService, refreshStatus],
    );

    // Refresh status on mount
    useEffect(() => {
        refreshStatus();
    }, [refreshStatus]);

    return {
        status,
        lastResult,
        error,
        isSyncing,
        syncNow,
        configure,
        refreshStatus,
    };
};
