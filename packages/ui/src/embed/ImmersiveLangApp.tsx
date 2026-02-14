import { useEffect, useMemo, useRef } from "react";
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
} from "@immersive-lang/ui/adapters";
import { IndexedDBSyncAdapter, LocalStorageAdapter, WebSessionHistoryAdapter } from "@immersive-lang/ui/adapters/web";
import { QmServerAuthAdapter } from "@immersive-lang/ui/adapters/shared";
import { AppShell } from "@immersive-lang/ui/components/templates";

export interface ImmersiveLangAppProps {
    className?: string;
    useRouter?: boolean;
    /** Auth tokens when embedded in qm-center */
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
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize services synchronously before first render
    const platform = useMemo<IPlatformServices>(() => {
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
    }, []);

    // Inject auth tokens when embedded (SSO from qm-center)
    useEffect(() => {
        if (authTokens?.accessToken && authTokens?.refreshToken && authTokens?.userId) {
            platform.auth.saveTokensExternal?.(authTokens.accessToken, authTokens.refreshToken, authTokens.userId);
            console.log("Auth tokens injected for embedded mode");
        }
    }, [authTokens, platform.auth]);

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
                        {useRouter ? <BrowserRouter basename={basePath}>{content}</BrowserRouter> : content}
                    </BasePathContext.Provider>
                </ThemeProvider>
            </PlatformProvider>
        </div>
    );
};
