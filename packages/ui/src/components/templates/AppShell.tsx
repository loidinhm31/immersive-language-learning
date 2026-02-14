import { lazy, Suspense, useCallback, useEffect, useRef, useState, createContext, useContext } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import type {
    Mission,
    AppMode,
    SessionResult,
    SessionDuration,
    SessionHistoryEntry,
    IeltsConfig,
    IeltsAssessmentResult,
} from "@immersive-lang/shared";
import { useAppState } from "@immersive-lang/ui/contexts";
import { ErrorBoundary, Spinner } from "@immersive-lang/ui/components/atoms";
import { useNav, useSessionHistory, useIsMobile } from "@immersive-lang/ui/hooks";
import { BottomNavigation, Sidebar } from "@immersive-lang/ui/components/organisms";

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

/**
 * Props for AppShell component (matching cham-lang pattern)
 */
export interface AppShellProps {
    /**
     * Skip auth check - use when tokens are provided externally (e.g., embedded mode)
     */
    skipAuth?: boolean;

    /**
     * Embedded mode - hides outer navigation for embedding in parent apps
     */
    embedded?: boolean;

    /**
     * Callback when user requests logout - allows parent app to handle logout
     */
    onLogoutRequest?: () => void;
}

/**
 * Context passed to child routes
 */
export interface AppShellContext {
    onLogoutRequest?: () => void;
    embedded: boolean;
}

const AppShellContextInternal = createContext<AppShellContext>({ embedded: false });

/**
 * Hook to access AppShell context from child routes
 */
export function useAppShellContext(): AppShellContext {
    return useContext(AppShellContextInternal);
}

// Routes where navigation should be hidden (immersive experiences)
const IMMERSIVE_ROUTES = ["/", "/chat", "/summary", "/ielts-setup", "/ielts-chat", "/ielts-summary", "/login"];

function PageLoader() {
    return (
        <div className="flex h-full min-h-[50vh] items-center justify-center">
            <Spinner className="h-8 w-8" />
        </div>
    );
}

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
    const { setSessionResult, setIeltsResult, setIeltsConfig } = useAppState();

    const handleHistoryBack = useCallback(() => {
        navigate(to("/missions"));
    }, [navigate, to]);

    const handleViewSession = useCallback(
        (entry: SessionHistoryEntry) => {
            if (entry.ieltsResult && entry.ieltsConfig) {
                setIeltsResult(entry.ieltsResult);
                setIeltsConfig(entry.ieltsConfig);
                navigate(to("/ielts-summary"), {
                    state: {
                        fromHistory: true,
                        ieltsResult: entry.ieltsResult,
                        ieltsConfig: entry.ieltsConfig,
                    },
                });
            } else {
                setSessionResult(entry.result);
                navigate(to("/summary"), { state: { fromHistory: true } });
            }
        },
        [navigate, to, setSessionResult, setIeltsResult, setIeltsConfig],
    );

    return <HistoryPage onBack={handleHistoryBack} onViewSession={handleViewSession} />;
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
    const location = useLocation();
    const { state, setIeltsConfig, setIeltsResult } = useAppState();
    const { saveSession } = useSessionHistory();
    const sessionSavedRef = useRef(false);

    const locationState = location.state as {
        fromHistory?: boolean;
        ieltsResult?: IeltsAssessmentResult;
        ieltsConfig?: IeltsConfig;
    } | null;
    const fromHistory = locationState?.fromHistory === true;

    const ieltsResult = fromHistory ? locationState?.ieltsResult : state.ieltsResult;
    const ieltsConfig = fromHistory ? locationState?.ieltsConfig : state.ieltsConfig;

    const part = ieltsConfig?.part ?? 1;

    useEffect(() => {
        if (ieltsResult && ieltsConfig && !sessionSavedRef.current && !fromHistory) {
            sessionSavedRef.current = true;
            saveSession({
                mission: {
                    id: 100 + part,
                    title: `IELTS Speaking Part ${part}`,
                    difficulty: "Expert",
                    desc: `Topic: ${ieltsConfig?.topic || "General"}`,
                    target_role: "IELTS Examiner",
                },
                language: "English",
                fromLanguage: state.selectedFromLanguage,
                mode: "immergo_immersive",
                voice: state.selectedVoice,
                result: {
                    score: ieltsResult.bandScores.overallBand.toString(),
                    level: `Band ${ieltsResult.bandScores.overallBand}`,
                    notes: ieltsResult.overallComments,
                    elapsedSeconds: ieltsResult.elapsedSeconds,
                    messageCount: ieltsResult.messageCount,
                    audioChunksSent: ieltsResult.audioChunksSent,
                    tokenUsage: ieltsResult.tokenUsage,
                    grammarCorrections: ieltsResult.grammarCorrections,
                    proficiencyObservations: ieltsResult.criterionFeedback.map(
                        (cf) => `${cf.criterion}: Band ${cf.band} - ${cf.comment}`,
                    ),
                },
                ieltsResult: ieltsResult,
                ieltsConfig: ieltsConfig,
            }).catch((err) => {
                console.error("Failed to save IELTS session to history:", err);
            });
        }
    }, [ieltsResult, ieltsConfig, state.selectedFromLanguage, state.selectedVoice, saveSession, part, fromHistory]);

    useEffect(() => {
        if (!location.pathname.endsWith("/ielts-summary")) {
            sessionSavedRef.current = false;
        }
    }, [location.pathname]);

    useEffect(() => {
        if (!ieltsResult && !fromHistory) {
            navigate(to("/missions"));
        }
    }, [ieltsResult, navigate, to, fromHistory]);

    const handleBackToMissions = useCallback(() => {
        setIeltsConfig(null);
        setIeltsResult(null);
        navigate(to("/missions"));
    }, [navigate, to, setIeltsConfig, setIeltsResult]);

    const handleBackToHistory = useCallback(() => {
        setIeltsConfig(null);
        setIeltsResult(null);
        navigate(to("/history"));
    }, [navigate, to, setIeltsConfig, setIeltsResult]);

    if (!ieltsResult) return null;

    return (
        <IeltsSummaryPage
            result={ieltsResult}
            part={ieltsConfig?.part}
            topic={ieltsConfig?.topic}
            cueCard={ieltsConfig?.cueCard}
            onBackToMissions={handleBackToMissions}
            onBackToHistory={fromHistory ? handleBackToHistory : undefined}
        />
    );
}

export function AppShell({ skipAuth: _skipAuth = false, embedded = false, onLogoutRequest }: AppShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const isMobile = useIsMobile();
    const location = useLocation();

    // Check if current route is immersive (should hide nav)
    const isImmersiveRoute = IMMERSIVE_ROUTES.some(
        (route) => location.pathname === route || location.pathname.startsWith("/chat"),
    );
    const shouldShowNav = !isImmersiveRoute;

    // Handle logout
    const handleLogout = useCallback(() => {
        if (onLogoutRequest) {
            onLogoutRequest();
        }
    }, [onLogoutRequest]);

    return (
        <AppShellContextInternal.Provider value={{ onLogoutRequest: handleLogout, embedded }}>
            <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg-gradient)" }}>
                {/* Sidebar - desktop only, hidden on immersive routes */}
                {shouldShowNav && (
                    <Sidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed((prev) => !prev)} />
                )}

                {/* Main content area */}
                <div
                    className={`relative z-10 pb-32 md:pb-0 transition-all duration-300 ${
                        shouldShowNav ? (isCollapsed ? "md:ml-16" : "md:ml-64") : ""
                    }`}
                >
                    <ErrorBoundary>
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                {/* Splash page - no navigation */}
                                <Route path="/" element={<SplashPageWrapper />} />

                                {/* Login page - no navigation */}
                                <Route path="/login" element={<LoginPageWrapper />} />

                                {/* Main app routes with navigation */}
                                <Route path="/missions" element={<MissionsPageWrapper />} />
                                <Route path="/history" element={<HistoryPageWrapper />} />
                                <Route
                                    path="/settings"
                                    element={<SettingsPageWrapper onLogoutRequest={handleLogout} />}
                                />

                                {/* Immersive routes - nav hidden automatically */}
                                <Route path="/chat" element={<ChatPageWrapper />} />
                                <Route path="/summary" element={<SummaryPageWrapper />} />
                                <Route path="/ielts-setup" element={<IeltsSetupPageWrapper />} />
                                <Route path="/ielts-chat" element={<IeltsChatPageWrapper />} />
                                <Route path="/ielts-summary" element={<IeltsSummaryPageWrapper />} />

                                {/* Fallback route */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </ErrorBoundary>
                </div>

                {/* Bottom Navigation - mobile only, hidden on immersive routes */}
                {shouldShowNav && isMobile && <BottomNavigation />}
            </div>
        </AppShellContextInternal.Provider>
    );
}
