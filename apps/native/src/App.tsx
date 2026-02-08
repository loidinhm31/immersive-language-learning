import { useCallback, useEffect, useRef } from "react";
import { useAppState } from "@immersive-lang/ui/contexts";
import { SplashPage, MissionsPage, ChatPage, SummaryPage, HistoryPage } from "@immersive-lang/ui/components/pages";

import { useSessionHistory } from "@immersive-lang/ui/hooks";

import type { Mission, AppMode, SessionResult, SessionDuration } from "@immersive-lang/shared";
import { AppShell } from "@immersive-lang/ui/components/templates";

function App() {
    const {
        state,
        navigate,
        setSelectedLanguage,
        setSelectedFromLanguage,
        setSelectedMode,
        setSelectedVoice,
        setSessionDuration,
    } = useAppState();

    const { saveSession } = useSessionHistory();
    const sessionSavedRef = useRef(false);

    // Save session to history when navigating to summary
    useEffect(() => {
        if (state.view === "summary" && state.sessionResult && !sessionSavedRef.current) {
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
        // Reset flag when leaving summary
        if (state.view !== "summary") {
            sessionSavedRef.current = false;
        }
    }, [
        state.view,
        state.sessionResult,
        state.selectedMission,
        state.selectedLanguage,
        state.selectedFromLanguage,
        state.selectedMode,
        state.selectedVoice,
        saveSession,
    ]);

    const handleStart = useCallback(() => {
        navigate("missions");
    }, [navigate]);

    const handleMissionSelect = useCallback(
        (mission: Mission) => {
            navigate("chat", { mission });
        },
        [navigate],
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

    const handleChatBack = useCallback(() => {
        navigate("missions");
    }, [navigate]);

    const handleChatComplete = useCallback(
        (result: SessionResult) => {
            navigate("summary", { result });
        },
        [navigate],
    );

    const handleBackToMissions = useCallback(() => {
        navigate("missions", { mission: undefined, result: undefined });
    }, [navigate]);

    const handleHistoryBack = useCallback(() => {
        navigate("missions");
    }, [navigate]);

    const handleViewHistory = useCallback(() => {
        navigate("history");
    }, [navigate]);

    const renderView = () => {
        switch (state.view) {
            case "splash":
                return <SplashPage onStart={handleStart} />;

            case "missions":
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
                    />
                );

            case "chat":
                if (!state.selectedMission) {
                    navigate("missions");
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

            case "summary":
                if (!state.sessionResult) {
                    navigate("missions");
                    return null;
                }
                return <SummaryPage result={state.sessionResult} onBackToMissions={handleBackToMissions} />;

            case "history":
                return <HistoryPage onBack={handleHistoryBack} />;

            default:
                return <SplashPage onStart={handleStart} />;
        }
    };

    return (
        <AppShell>
            <div className="fade-in">{renderView()}</div>
        </AppShell>
    );
}

export default App;
