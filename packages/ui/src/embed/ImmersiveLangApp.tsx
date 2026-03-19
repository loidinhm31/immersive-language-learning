import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppStateProvider, ThemeProvider } from "@immersive-lang/ui/contexts";
import { type IPlatformServices, PlatformProvider } from "@immersive-lang/ui/platform";
import { BasePathContext } from "@immersive-lang/ui/hooks";
import {
    setAuthService,
    setSyncService,
    setStorageService,
    setSessionHistoryService,
    getAllServices,
    getSyncService,
} from "@immersive-lang/ui/adapters";
import {
    IndexedDBSyncAdapter,
    IndexedDBSyncStorage,
    LocalStorageAdapter,
    WebSessionHistoryAdapter,
    initDb,
    deleteCurrentDb,
} from "@immersive-lang/ui/adapters/web";
import { QmServerAuthAdapter } from "@immersive-lang/ui/adapters/shared";
import { AppShell } from "@immersive-lang/ui/components/templates";
import { useAutoSync } from "../hooks/useAutoSync";
import { useSyncToast } from "../hooks/useSyncToast";
import { SyncToastProvider } from "@immersive-lang/ui/contexts";
import { SyncToast } from "@immersive-lang/ui/components/atoms";
import type { ISyncService } from "@immersive-lang/ui/adapters/factory/interfaces";

export interface ImmersiveLangAppProps {
    className?: string;
    useRouter?: boolean;
    /** Auth tokens when embedded in qm-hub */
    authTokens?: {
        accessToken: string;
        refreshToken: string;
        userId: string;
    };
    /** Whether running in embedded mode */
    embedded?: boolean;
    /** Callback when the app needs to logout (for embedded mode) */
    onLogoutRequest?: () => void;
    /** Base path for navigation when embedded (e.g., '/immersive-lang') */
    basePath?: string;
    /** Register a cleanup callback for logout (sync + delete DB). Returns unregister fn. */
    registerLogoutCleanup?: (
        appId: string,
        fn: () => Promise<{ success: boolean; error?: string }>,
    ) => () => void;
}

function SyncAutoSyncManager({
    syncService,
    enabled,
}: {
    syncService: ISyncService | null;
    enabled: boolean;
}) {
    const { handleSyncStart, handleSyncResult } = useSyncToast();
    useAutoSync({
        syncService,
        enabled,
        onSyncStart: handleSyncStart,
        onSyncResult: handleSyncResult,
    });
    return null;
}

/**
 * ImmersiveLangApp - Main embeddable component
 */
export const ImmersiveLangApp: React.FC<ImmersiveLangAppProps> = ({
    useRouter = true,
    authTokens,
    embedded = false,
    onLogoutRequest,
    basePath = "",
    className,
    registerLogoutCleanup,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dbReady, setDbReady] = useState(false);

    useEffect(() => {
        setDbReady(false);
        initDb(authTokens?.userId)
            .then(() => setDbReady(true))
            .catch(console.error);
    }, [authTokens?.userId]);

    // Register logout cleanup with hub after DB is ready
    useEffect(() => {
        if (!dbReady || !registerLogoutCleanup) return;
        const unregister = registerLogoutCleanup("immersive-lang", async () => {
            try {
                const storage = new IndexedDBSyncStorage();
                const hasPending = await storage.hasPendingChanges();
                if (hasPending) {
                    const syncService = getSyncService();
                    const result = await syncService.syncNow();
                    if (!result.success) return { success: false, error: result.error };
                }
                await deleteCurrentDb();
                return { success: true };
            } catch (e) {
                return { success: false, error: e instanceof Error ? e.message : "Cleanup failed" };
            }
        });
        return unregister;
    }, [dbReady, registerLogoutCleanup]);

    // Initialize services only after DB is ready
    const platform = useMemo<IPlatformServices>(() => {
        if (!dbReady) return {} as IPlatformServices;

        // Storage service
        setStorageService(new LocalStorageAdapter());

        // Session history service
        setSessionHistoryService(new WebSessionHistoryAdapter());

        // Auth service
        const auth = new QmServerAuthAdapter();
        setAuthService(auth);

        // Sync service (depends on auth)
        const sync = new IndexedDBSyncAdapter({
            getConfig: () => auth.getSyncConfig(),
            getTokens: () => auth.getTokens(),
            saveTokens: (a, r, u) => auth.saveTokensExternal!(a, r, u),
        });
        setSyncService(sync);

        return getAllServices();
    }, [dbReady]);

    const isAuthenticated = !!(authTokens?.accessToken && authTokens?.refreshToken);
    const autoSyncEnabled = dbReady && isAuthenticated && embedded;

    // Inject auth tokens when embedded (SSO from qm-hub)
    useEffect(() => {
        if (dbReady && authTokens?.accessToken && authTokens?.refreshToken && authTokens?.userId) {
            platform.auth.saveTokensExternal?.(authTokens.accessToken, authTokens.refreshToken, authTokens.userId);
        }
    }, [dbReady, authTokens, platform.auth]);

    if (!dbReady) return null;

    const content = (
        <AppStateProvider>
            <AppShell skipAuth={embedded} embedded={embedded} onLogoutRequest={onLogoutRequest} />
        </AppStateProvider>
    );

    return (
        <div ref={containerRef} className={className}>
            <PlatformProvider services={platform}>
                <ThemeProvider
                    embedded={embedded}
                    storageKey="immersive-lang-theme"
                    themeEventName="immersive-lang-theme-change"
                >
                    <BasePathContext.Provider value={basePath}>
                        <SyncToastProvider position="top-right">
                            {useRouter ? <BrowserRouter basename={basePath}>{content}</BrowserRouter> : content}
                            <SyncAutoSyncManager
                                syncService={dbReady ? getSyncService() : null}
                                enabled={autoSyncEnabled}
                            />
                            <SyncToast />
                        </SyncToastProvider>
                    </BasePathContext.Provider>
                </ThemeProvider>
            </PlatformProvider>
        </div>
    );
};
