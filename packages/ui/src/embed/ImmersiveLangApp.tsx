import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppStateProvider, ThemeProvider, useAppState } from "@immersive-lang/ui/contexts";
import type { AppMode, Mission, SessionDuration, SessionHistoryEntry, SessionResult, IeltsConfig, IeltsAssessmentResult } from "@immersive-lang/shared";
import { type IPlatformServices, PlatformProvider } from "@immersive-lang/ui/platform";
import { BasePathContext, useNav, useSessionHistory } from "@immersive-lang/ui/hooks";
import { QmServerAuthAdapter } from "@immersive-lang/ui/adapters/shared";
import { TauriSessionHistoryAdapter, TauriSyncAdapter } from "@immersive-lang/ui/adapters/tauri";
import { IndexedDBSyncAdapter, LocalStorageAdapter, WebSessionHistoryAdapter } from "@immersive-lang/ui/adapters/web";
import { isTauri } from "@immersive-lang/ui/adapters/shared";
import { AppShell } from "@immersive-lang/ui/components/templates";
import { Spinner } from "@immersive-lang/ui/components/atoms";

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

// Lazy load page components
const SplashPage = lazy(() => import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.SplashPage })));
const MissionsPage = lazy(() =>
    import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.MissionsPage })),
);
const ChatPage = lazy(() => import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.ChatPage })));
const SummaryPage = lazy(() => import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.SummaryPage })));
const HistoryPage = lazy(() => import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.HistoryPage })));
const LoginPage = lazy(() => import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.LoginPage })));
const SettingsPage = lazy(() =>
    import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.SettingsPage })),
);
const IeltsSetupPage = lazy(() =>
    import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.IeltsSetupPage })),
);
const IeltsChatPage = lazy(() =>
    import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.IeltsChatPage })),
);
const IeltsSummaryPage = lazy(() =>
    import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.IeltsSummaryPage })),
);

function PageLoader() {
    return (
        <div className="flex h-full min-h-[50vh] items-center justify-center">
            <Spinner className="h-8 w-8" />
        </div>
    );
}

// Wrapper components to connect pages with app state and routing
function SplashPageWrapper() {
    const navigate = useNavigate();
    const { to } = useNav();

    const handleStart = useCallback(() => {
        navigate(to("/missions"));
    }, [navigate, to]);

    return <SplashPage onStart={handleStart} />;
}

function MissionsPageWrapper() {
    const navigate = useNavigate();
    const { to } = useNav();
    const {
        state,
        setSelectedLanguage,
        setSelectedFromLanguage,
        setSelectedMode,
        setSelectedVoice,
        setSessionDuration,
        setSelectedMission,
    } = useAppState();

    const handleMissionSelect = useCallback(
        (mission: Mission) => {
            setSelectedMission(mission);
            navigate(to("/chat"));
        },
        [navigate, to, setSelectedMission],
    );

    const handleFromLanguageChange = useCallback(
        (lang: string) => {
            setSelectedFromLanguage(lang);
        },
        [setSelectedFromLanguage],
    );

    const handleToLanguageChange = useCallback(
        (lang: string) => {
            setSelectedLanguage(lang);
        },
        [setSelectedLanguage],
    );

    const handleModeChange = useCallback(
        (mode: AppMode) => {
            setSelectedMode(mode);
        },
        [setSelectedMode],
    );

    const handleVoiceChange = useCallback(
        (voice: string) => {
            setSelectedVoice(voice);
        },
        [setSelectedVoice],
    );

    const handleSessionDurationChange = useCallback(
        (duration: SessionDuration) => {
            setSessionDuration(duration);
        },
        [setSessionDuration],
    );

    const handleViewHistory = useCallback(() => {
        navigate(to("/history"));
    }, [navigate, to]);

    const handleIeltsAssessment = useCallback(() => {
        navigate(to("/ielts-setup"));
    }, [navigate, to]);

    return (
        <MissionsPage
            fromLanguage={state.selectedFromLanguage}
            toLanguage={state.selectedLanguage}
            mode={state.selectedMode}
            voice={state.selectedVoice}
            sessionDuration={state.sessionDuration}
            onFromLanguageChange={handleFromLanguageChange}
            onToLanguageChange={handleToLanguageChange}
            onModeChange={handleModeChange}
            onVoiceChange={handleVoiceChange}
            onSessionDurationChange={handleSessionDurationChange}
            onMissionSelect={handleMissionSelect}
            onViewHistory={handleViewHistory}
            onIeltsAssessment={handleIeltsAssessment}
        />
    );
}

function ChatPageWrapper() {
    const navigate = useNavigate();
    const { to } = useNav();
    const { state, setSessionResult } = useAppState();

    useEffect(() => {
        if (!state.selectedMission) {
            navigate(to("/missions"));
        }
    }, [state.selectedMission, navigate, to]);

    const handleChatBack = useCallback(() => {
        navigate(to("/missions"));
    }, [navigate, to]);

    const handleChatComplete = useCallback(
        (result: SessionResult) => {
            setSessionResult(result);
            navigate(to("/summary"));
        },
        [navigate, to, setSessionResult],
    );

    if (!state.selectedMission) {
        return null;
    }

    return (
        <ChatPage
            mission={state.selectedMission}
            language={state.selectedLanguage}
            fromLanguage={state.selectedFromLanguage}
            mode={state.selectedMode}
            voice={state.selectedVoice}
            sessionDuration={state.sessionDuration}
            onBack={handleChatBack}
            onComplete={handleChatComplete}
        />
    );
}

function SummaryPageWrapper() {
    const navigate = useNavigate();
    const { to } = useNav();
    const location = useLocation();
    const { state, setSelectedMission, setSessionResult } = useAppState();
    const { saveSession } = useSessionHistory();
    const sessionSavedRef = useRef(false);

    const fromHistory = (location.state as { fromHistory?: boolean })?.fromHistory === true;

    // Save session to history when reaching summary (skip when viewing from history)
    useEffect(() => {
        if (state.sessionResult && !sessionSavedRef.current && !fromHistory) {
            sessionSavedRef.current = true;
            saveSession({
                mission: state.selectedMission,
                language: state.selectedLanguage,
                fromLanguage: state.selectedFromLanguage,
                mode: state.selectedMode,
                voice: state.selectedVoice,
                result: state.sessionResult,
            }).catch((err) => {
                console.error("Failed to save session to history:", err);
            });
        }
    }, [
        state.sessionResult,
        state.selectedMission,
        state.selectedLanguage,
        state.selectedFromLanguage,
        state.selectedMode,
        state.selectedVoice,
        saveSession,
        fromHistory,
    ]);

    // Reset saved flag when leaving summary
    useEffect(() => {
        if (location.pathname !== "/summary") {
            sessionSavedRef.current = false;
        }
    }, [location.pathname]);

    useEffect(() => {
        if (!state.sessionResult) {
            navigate(to("/missions"));
        }
    }, [state.sessionResult, navigate, to]);

    const handleBackToMissions = useCallback(() => {
        setSelectedMission(null);
        setSessionResult(null);
        navigate(to("/missions"));
    }, [navigate, to, setSelectedMission, setSessionResult]);

    const handleBackToHistory = useCallback(() => {
        setSessionResult(null);
        navigate(to("/history"));
    }, [navigate, to, setSessionResult]);

    if (!state.sessionResult) {
        return null;
    }

    return (
        <SummaryPage
            result={state.sessionResult}
            onBackToMissions={handleBackToMissions}
            onBackToHistory={fromHistory ? handleBackToHistory : undefined}
        />
    );
}

function HistoryPageWrapper() {
    const navigate = useNavigate();
    const { to } = useNav();
    const { setSessionResult } = useAppState();

    const handleHistoryBack = useCallback(() => {
        navigate(to("/missions"));
    }, [navigate, to]);

    const handleViewSession = useCallback(
        (entry: SessionHistoryEntry) => {
            setSessionResult(entry.result);
            navigate(to("/summary"), { state: { fromHistory: true } });
        },
        [navigate, to, setSessionResult],
    );

    return <HistoryPage onBack={handleHistoryBack} onViewSession={handleViewSession} />;
}

function IeltsSetupPageWrapper() {
    const navigate = useNavigate();
    const { to } = useNav();
    const { state, setSelectedVoice, setIeltsConfig } = useAppState();

    const handleStart = useCallback(
        (config: IeltsConfig) => {
            setIeltsConfig(config);
            navigate(to("/ielts-chat"));
        },
        [navigate, to, setIeltsConfig],
    );

    const handleBack = useCallback(() => {
        navigate(to("/missions"));
    }, [navigate, to]);

    return (
        <IeltsSetupPage
            voice={state.selectedVoice}
            onVoiceChange={setSelectedVoice}
            onStart={handleStart}
            onBack={handleBack}
        />
    );
}

function IeltsChatPageWrapper() {
    const navigate = useNavigate();
    const { to } = useNav();
    const { state, setIeltsResult } = useAppState();

    useEffect(() => {
        if (!state.ieltsConfig) {
            navigate(to("/ielts-setup"));
        }
    }, [state.ieltsConfig, navigate, to]);

    const handleBack = useCallback(() => {
        navigate(to("/ielts-setup"));
    }, [navigate, to]);

    const handleComplete = useCallback(
        (result: IeltsAssessmentResult) => {
            setIeltsResult(result);
            navigate(to("/ielts-summary"));
        },
        [navigate, to, setIeltsResult],
    );

    if (!state.ieltsConfig) return null;

    return (
        <IeltsChatPage
            ieltsConfig={state.ieltsConfig}
            fromLanguage={state.selectedFromLanguage}
            voice={state.selectedVoice}
            onBack={handleBack}
            onComplete={handleComplete}
        />
    );
}

function IeltsSummaryPageWrapper() {
    const navigate = useNavigate();
    const { to } = useNav();
    const { state, setIeltsConfig, setIeltsResult } = useAppState();
    const { saveSession } = useSessionHistory();
    const sessionSavedRef = useRef(false);

    useEffect(() => {
        if (state.ieltsResult && !sessionSavedRef.current) {
            sessionSavedRef.current = true;
            saveSession({
                mission: {
                    id: 100,
                    title: "IELTS Speaking Part 1",
                    difficulty: "Expert",
                    desc: `Topic: ${state.ieltsConfig?.topic || "General"}`,
                    target_role: "IELTS Examiner",
                },
                language: "🇬🇧 English",
                fromLanguage: state.selectedFromLanguage,
                mode: "immergo_immersive",
                voice: state.selectedVoice,
                result: {
                    score: state.ieltsResult.bandScores.overallBand.toString(),
                    level: `Band ${state.ieltsResult.bandScores.overallBand}`,
                    notes: state.ieltsResult.overallComments,
                    elapsedSeconds: state.ieltsResult.elapsedSeconds,
                    messageCount: state.ieltsResult.messageCount,
                    audioChunksSent: state.ieltsResult.audioChunksSent,
                    tokenUsage: state.ieltsResult.tokenUsage,
                    grammarCorrections: state.ieltsResult.grammarCorrections,
                    proficiencyObservations: state.ieltsResult.criterionFeedback.map(
                        (cf) => `${cf.criterion}: Band ${cf.band} - ${cf.comment}`,
                    ),
                },
            }).catch((err) => {
                console.error("Failed to save IELTS session to history:", err);
            });
        }
    }, [state.ieltsResult, state.ieltsConfig, state.selectedFromLanguage, state.selectedVoice, saveSession]);

    useEffect(() => {
        if (!state.ieltsResult) {
            navigate(to("/missions"));
        }
    }, [state.ieltsResult, navigate, to]);

    const handleBackToMissions = useCallback(() => {
        setIeltsConfig(null);
        setIeltsResult(null);
        navigate(to("/missions"));
    }, [navigate, to, setIeltsConfig, setIeltsResult]);

    if (!state.ieltsResult) return null;

    return (
        <IeltsSummaryPage
            result={state.ieltsResult}
            topic={state.ieltsConfig?.topic}
            onBackToMissions={handleBackToMissions}
        />
    );
}

function LoginPageWrapper() {
    const navigate = useNavigate();
    const { to } = useNav();

    const handleLoginSuccess = useCallback(() => {
        navigate(to("/settings"));
    }, [navigate, to]);

    const handleSkip = useCallback(() => {
        navigate(to("/missions"));
    }, [navigate, to]);

    return <LoginPage onLoginSuccess={handleLoginSuccess} onSkip={handleSkip} />;
}

function SettingsPageWrapper({ onLogoutRequest }: { onLogoutRequest?: () => void }) {
    return <SettingsPage onLogout={onLogoutRequest} />;
}

/**
 * Routes component - separated for easier embedding
 */
function AppRoutes({ onLogoutRequest }: { onLogoutRequest?: () => void }) {
    return (
        <Routes>
            {/* Splash page - no navigation shell */}
            <Route
                path="/"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <SplashPageWrapper />
                    </Suspense>
                }
            />

            {/* Login page - no navigation shell */}
            <Route
                path="/login"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <LoginPageWrapper />
                    </Suspense>
                }
            />

            {/* Routes with AppShell layout */}
            <Route element={<AppShell />}>
                <Route
                    path="/missions"
                    element={
                        <Suspense fallback={<PageLoader />}>
                            <MissionsPageWrapper />
                        </Suspense>
                    }
                />
                <Route
                    path="/history"
                    element={
                        <Suspense fallback={<PageLoader />}>
                            <HistoryPageWrapper />
                        </Suspense>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <Suspense fallback={<PageLoader />}>
                            <SettingsPageWrapper onLogoutRequest={onLogoutRequest} />
                        </Suspense>
                    }
                />
            </Route>

            {/* Immersive routes - with AppShell but nav hidden automatically */}
            <Route element={<AppShell />}>
                <Route
                    path="/chat"
                    element={
                        <Suspense fallback={<PageLoader />}>
                            <ChatPageWrapper />
                        </Suspense>
                    }
                />
                <Route
                    path="/summary"
                    element={
                        <Suspense fallback={<PageLoader />}>
                            <SummaryPageWrapper />
                        </Suspense>
                    }
                />
                <Route
                    path="/ielts-setup"
                    element={
                        <Suspense fallback={<PageLoader />}>
                            <IeltsSetupPageWrapper />
                        </Suspense>
                    }
                />
                <Route
                    path="/ielts-chat"
                    element={
                        <Suspense fallback={<PageLoader />}>
                            <IeltsChatPageWrapper />
                        </Suspense>
                    }
                />
                <Route
                    path="/ielts-summary"
                    element={
                        <Suspense fallback={<PageLoader />}>
                            <IeltsSummaryPageWrapper />
                        </Suspense>
                    }
                />
            </Route>
        </Routes>
    );
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
