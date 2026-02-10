import { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
import { Spinner } from "@immersive-lang/ui/components/atoms";
import { useNav, useSessionHistory } from "@immersive-lang/ui/hooks";
import { AppShell } from "./AppShell";

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

export interface AppRoutesProps {
    onLogoutRequest?: () => void;
}

export function AppRoutes({ onLogoutRequest }: AppRoutesProps) {
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
