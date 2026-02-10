import { useEffect, useMemo, useRef } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppStateProvider, ThemeProvider } from "@immersive-lang/ui/contexts";
import { type IPlatformServices, PlatformProvider } from "@immersive-lang/ui/platform";
import { BasePathContext } from "@immersive-lang/ui/hooks";
import { QmServerAuthAdapter } from "@immersive-lang/ui/adapters/shared";
import { TauriSessionHistoryAdapter, TauriSyncAdapter } from "@immersive-lang/ui/adapters/tauri";
import { IndexedDBSyncAdapter, LocalStorageAdapter, WebSessionHistoryAdapter } from "@immersive-lang/ui/adapters/web";
import { isTauri } from "@immersive-lang/ui/adapters/shared";
import { AppRoutes } from "@immersive-lang/ui/components/templates";

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
 *
 * When embedded in another app (like qm-center-app), this component:
 * 1. Uses shared localStorage tokens for SSO
 * 2. Uses unique theme storage key to avoid conflicts
 * 3. Notifies parent app on logout request
 * 4. Dispatches theme change events for Shadow DOM wrapper
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

    // Initialize platform services
    const services = useMemo<IPlatformServices>(() => {
        const auth = new QmServerAuthAdapter();
        const sessionHistory = isTauri() ? new TauriSessionHistoryAdapter() : new WebSessionHistoryAdapter();
        const storage = new LocalStorageAdapter();
        const sync = isTauri()
            ? new TauriSyncAdapter()
            : new IndexedDBSyncAdapter({
                  getTokens: () => auth.getTokens(),
                  saveTokens: (a, r, u) => auth.saveTokensExternal!(a, r, u),
              });

        return { auth, sync, sessionHistory, storage };
    }, []);

    // Inject auth tokens when embedded (SSO from qm-center)
    useEffect(() => {
        if (authTokens?.accessToken && authTokens?.refreshToken && authTokens?.userId) {
            services.auth.saveTokensExternal?.(authTokens.accessToken, authTokens.refreshToken, authTokens.userId);
            console.log("Auth tokens injected for embedded mode");
        }
    }, [authTokens, services.auth]);

    const content = (
        <AppStateProvider>
            <AppRoutes onLogoutRequest={onLogoutRequest} />
        </AppStateProvider>
    );

    const wrappedContent = useRouter ? <BrowserRouter basename={basePath}>{content}</BrowserRouter> : content;

    return (
        <div ref={containerRef} className={className}>
            <PlatformProvider services={services}>
                <BasePathContext.Provider value={basePath}>
                    <ThemeProvider
                        embedded={embedded}
                        storageKey="immersive-lang-theme"
                        themeEventName="immersive-lang-theme-change"
                    >
                        {wrappedContent}
                    </ThemeProvider>
                </BasePathContext.Provider>
            </PlatformProvider>
        </div>
    );
};
