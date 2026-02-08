import { useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AppShell } from "@immersive-lang/ui/components/templates";
import type { Mission, AppMode, SessionResult, SessionDuration, SessionHistoryEntry, IeltsConfig, IeltsAssessmentResult } from "@immersive-lang/shared";
import { useAppState } from "@immersive-lang/ui/contexts";
import { Spinner } from "@immersive-lang/ui/components/atoms";
import { useSessionHistory } from "@immersive-lang/ui/hooks";

// Lazy load page components
const SplashPage = lazy(() => import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.SplashPage })));
const MissionsPage = lazy(() =>
    import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.MissionsPage })),
);
const ChatPage = lazy(() => import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.ChatPage })));
const SummaryPage = lazy(() => import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.SummaryPage })));
const HistoryPage = lazy(() => import("@immersive-lang/ui/components/pages").then((m) => ({ default: m.HistoryPage })));
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

    const handleStart = useCallback(() => {
        navigate("/missions");
    }, [navigate]);

    return <SplashPage onStart={handleStart} />;
}

function MissionsPageWrapper() {
    const navigate = useNavigate();
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
            navigate("/chat");
        },
        [navigate, setSelectedMission],
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
        navigate("/history");
    }, [navigate]);

    const handleIeltsAssessment = useCallback(() => {
        navigate("/ielts-setup");
    }, [navigate]);

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
    const { state, setSessionResult } = useAppState();

    useEffect(() => {
        if (!state.selectedMission) {
            navigate("/missions");
        }
    }, [state.selectedMission, navigate]);

    const handleChatBack = useCallback(() => {
        navigate("/missions");
    }, [navigate]);

    const handleChatComplete = useCallback(
        (result: SessionResult) => {
            setSessionResult(result);
            navigate("/summary");
        },
        [navigate, setSessionResult],
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
            navigate("/missions");
        }
    }, [state.sessionResult, navigate]);

    const handleBackToMissions = useCallback(() => {
        setSelectedMission(null);
        setSessionResult(null);
        navigate("/missions");
    }, [navigate, setSelectedMission, setSessionResult]);

    const handleBackToHistory = useCallback(() => {
        setSessionResult(null);
        navigate("/history");
    }, [navigate, setSessionResult]);

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
    const { setSessionResult } = useAppState();

    const handleHistoryBack = useCallback(() => {
        navigate("/missions");
    }, [navigate]);

    const handleViewSession = useCallback(
        (entry: SessionHistoryEntry) => {
            setSessionResult(entry.result);
            navigate("/summary", { state: { fromHistory: true } });
        },
        [navigate, setSessionResult],
    );

    return <HistoryPage onBack={handleHistoryBack} onViewSession={handleViewSession} />;
}

function IeltsSetupPageWrapper() {
    const navigate = useNavigate();
    const { state, setSelectedVoice, setIeltsConfig } = useAppState();

    const handleStart = useCallback(
        (config: IeltsConfig) => {
            setIeltsConfig(config);
            navigate("/ielts-chat");
        },
        [navigate, setIeltsConfig],
    );

    const handleBack = useCallback(() => {
        navigate("/missions");
    }, [navigate]);

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
    const { state, setIeltsResult } = useAppState();

    useEffect(() => {
        if (!state.ieltsConfig) {
            navigate("/ielts-setup");
        }
    }, [state.ieltsConfig, navigate]);

    const handleBack = useCallback(() => {
        navigate("/ielts-setup");
    }, [navigate]);

    const handleComplete = useCallback(
        (result: IeltsAssessmentResult) => {
            setIeltsResult(result);
            navigate("/ielts-summary");
        },
        [navigate, setIeltsResult],
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
            navigate("/missions");
        }
    }, [state.ieltsResult, navigate]);

    const handleBackToMissions = useCallback(() => {
        setIeltsConfig(null);
        setIeltsResult(null);
        navigate("/missions");
    }, [navigate, setIeltsConfig, setIeltsResult]);

    if (!state.ieltsResult) return null;

    return (
        <IeltsSummaryPage
            result={state.ieltsResult}
            topic={state.ieltsConfig?.topic}
            onBackToMissions={handleBackToMissions}
        />
    );
}

function App() {
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

export default App;
