import { type ReactNode, Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Github, Monitor, Moon, Sun } from "lucide-react";
import { type Theme, useTheme } from "@immersive-lang/ui/contexts";
import { API_ENDPOINTS, env } from "@immersive-lang/shared";
import { BottomNavigation, Sidebar } from "@immersive-lang/ui/components/organisms";
import { useIsMobile } from "@immersive-lang/ui/hooks";
import { Spinner } from "@immersive-lang/ui/components/atoms";
import { useAuthService } from "@immersive-lang/ui/platform";

export interface AppShellProps {
    children?: ReactNode;
    /** Show sidebar/bottom nav (default: true) */
    showNavigation?: boolean;
    /** Custom loading fallback for Suspense */
    loadingFallback?: ReactNode;
}

const THEME_ICONS: Record<Theme, ReactNode> = {
    dark: <Moon size={18} />,
    light: <Sun size={18} />,
    system: <Monitor size={18} />,
};

const THEME_TITLES: Record<Theme, string> = {
    dark: "Dark Mode",
    light: "Light Mode",
    system: "System Default",
};

// Routes where navigation should be hidden (immersive experiences)
const IMMERSIVE_ROUTES = ["/", "/chat", "/summary"];

export function AppShell({ children, showNavigation = true, loadingFallback }: AppShellProps) {
    const { theme, cycleTheme } = useTheme();
    const [simpleModeWarning, setSimpleModeWarning] = useState<string[] | null>(null);
    const isMobile = useIsMobile();
    const location = useLocation();
    const authService = useAuthService();

    // Check if current route is immersive (should hide nav)
    const isImmersiveRoute = IMMERSIVE_ROUTES.some(
        (route) => location.pathname === route || location.pathname.startsWith("/chat"),
    );
    const shouldShowNav = showNavigation && !isImmersiveRoute;

    const defaultLoadingFallback = (
        <div className="flex h-full items-center justify-center">
            <Spinner className="h-8 w-8" />
        </div>
    );

    useEffect(() => {
        async function checkConfigStatus() {
            try {
                const token = await authService.getAccessToken();
                if (!token) return;
                const res = await fetch(`${env.apiBaseUrl}${API_ENDPOINTS.STATUS}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.mode === "simple") {
                    setSimpleModeWarning(data.missing);
                }
            } catch (e) {
                console.warn("Failed to check config status:", e);
            }
        }
        checkConfigStatus();
    }, [authService]);

    return (
        <div className="min-h-screen w-full flex">
            {/* Sidebar - desktop only, hidden on immersive routes */}
            {shouldShowNav && !isMobile && (
                <aside className="hidden md:block w-56 shrink-0 border-r border-glass-border">
                    <Sidebar header={<span className="font-heading text-lg text-text-main">Immergo</span>} />
                </aside>
            )}

            {/* Main content area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex justify-end items-center py-2 px-4 gap-4 w-full pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-2">
                        <a
                            href="https://github.com/loidinhm31/immersive-language-learning"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 py-3.5 px-7 border-2 border-dashed border-accent-primary rounded-xl text-text-main no-underline font-extrabold transition-all duration-200 bg-surface backdrop-blur-[10px] shadow-sm text-lg hover:translate-y-[-3px] hover:shadow-md hover:bg-bg"
                        >
                            <Github size={20} style={{ opacity: 0.8 }} />
                            Source
                        </a>
                    </div>

                    <button
                        onClick={cycleTheme}
                        aria-label="Toggle Theme"
                        title={THEME_TITLES[theme]}
                        className="pointer-events-auto bg-surface text-text-main border border-glass-border rounded-full w-10 h-10 flex items-center justify-center cursor-pointer shadow-sm text-lg transition-all duration-200 backdrop-blur-[10px] hover:bg-bg"
                    >
                        {THEME_ICONS[theme]}
                    </button>
                </header>

                {/* Main Content */}
                <main className={`flex-1 w-full h-full overflow-auto ${shouldShowNav && isMobile ? "pb-16" : ""}`}>
                    <Suspense fallback={loadingFallback || defaultLoadingFallback}>{children || <Outlet />}</Suspense>
                </main>

                {/* Bottom Navigation - mobile only, hidden on immersive routes */}
                {shouldShowNav && isMobile && (
                    <div className="fixed bottom-0 left-0 right-0 md:hidden z-40">
                        <BottomNavigation />
                    </div>
                )}
            </div>

            {/* Simple Mode Warning */}
            {simpleModeWarning && (
                <div
                    className={`fixed ${shouldShowNav && isMobile ? "bottom-16" : "bottom-0"} left-0 right-0 bg-[#fff3cd] text-[#856404] py-2 px-4 text-center text-sm z-50 border-t border-[#ffeeba] flex justify-center items-center gap-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]`}
                >
                    <span>
                        ⚠️ <b>Simple Mode Check:</b> Production security features ({simpleModeWarning.join(" & ")}) are
                        not configured.
                    </span>
                    <a
                        href="https://github.com/loidinhm31/immersive-language-learning#advanced-configuration"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#533f03] underline font-bold ml-1"
                    >
                        Learn more
                    </a>
                </div>
            )}
        </div>
    );
}
