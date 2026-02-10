import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, AppStateProvider } from "@immersive-lang/ui/contexts";
import { type IPlatformServices, PlatformProvider } from "@immersive-lang/ui/platform";
import { BasePathContext } from "@immersive-lang/ui/hooks";
import { QmServerAuthAdapter } from "@immersive-lang/ui/adapters/shared";
import { isTauri } from "@immersive-lang/ui/adapters/shared";
import { TauriSessionHistoryAdapter, TauriSyncAdapter } from "@immersive-lang/ui/adapters/tauri";
import { IndexedDBSyncAdapter, LocalStorageAdapter, WebSessionHistoryAdapter } from "@immersive-lang/ui/adapters/web";
import "@immersive-lang/ui/styles";
import App from "./App";

function Root() {
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

    return (
        <PlatformProvider services={services}>
            <BasePathContext.Provider value="">
                <ThemeProvider storageKey="immersive-lang-theme" themeEventName="immersive-lang-theme-change">
                    <BrowserRouter>
                        <AppStateProvider>
                            <App />
                        </AppStateProvider>
                    </BrowserRouter>
                </ThemeProvider>
            </BasePathContext.Provider>
        </PlatformProvider>
    );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Root />
    </StrictMode>,
);
