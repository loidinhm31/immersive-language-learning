import { useCallback, useEffect, useRef } from "react";
import { useAppState } from "@immersive-lang/ui/contexts";
import {
    SplashPage,
    MissionsPage,
    ChatPage,
    SummaryPage,
    HistoryPage,
    IeltsSetupPage,
    IeltsPart1ChatPage,
    IeltsPart2ChatPage,
    IeltsPart3ChatPage,
    IeltsSummaryPage,
} from "@immersive-lang/ui/components/pages";

import { useSessionHistory } from "@immersive-lang/ui/hooks";

import type { Mission, AppMode, SessionResult, SessionDuration, IeltsConfig, IeltsAssessmentResult } from "@immersive-lang/shared";
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
        setIeltsConfig,
        setIeltsResult,
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

    const handleIeltsAssessment = useCallback(() => {
        navigate("ielts-setup");
    }, [navigate]);

    const handleIeltsStart = useCallback(
        (config: IeltsConfig) => {
            setIeltsConfig(config);
            const partViews = { 1: "ielts-part1-chat", 2: "ielts-part2-chat", 3: "ielts-part3-chat" } as const;
            navigate(partViews[config.part]);
        },
        [navigate, setIeltsConfig],
    );

    const handleIeltsChatBack = useCallback(() => {
        navigate("ielts-setup");
    }, [navigate]);

    const handleIeltsChatComplete = useCallback(
        (result: IeltsAssessmentResult) => {
            setIeltsResult(result);
            navigate("ielts-summary");
        },
        [navigate, setIeltsResult],
    );

    const handleIeltsSummaryBack = useCallback(() => {
        setIeltsConfig(null);
        setIeltsResult(null);
        navigate("missions");
    }, [navigate, setIeltsConfig, setIeltsResult]);

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
                        onIeltsAssessment={handleIeltsAssessment}
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

            case "ielts-setup":
                return (
                    <IeltsSetupPage
                        voice={state.selectedVoice}
                        onVoiceChange={setSelectedVoice}
                        onStart={handleIeltsStart}
                        onBack={handleChatBack}
                    />
                );

            case "ielts-part1-chat":
                if (!state.ieltsConfig) {
                    navigate("ielts-setup");
                    return null;
                }
                return (
                    <IeltsPart1ChatPage
                        ieltsConfig={state.ieltsConfig}
                        fromLanguage={state.selectedFromLanguage}
                        voice={state.selectedVoice}
                        onBack={handleIeltsChatBack}
                        onComplete={handleIeltsChatComplete}
                    />
                );

            case "ielts-part2-chat":
                if (!state.ieltsConfig) {
                    navigate("ielts-setup");
                    return null;
                }
                return (
                    <IeltsPart2ChatPage
                        ieltsConfig={state.ieltsConfig}
                        fromLanguage={state.selectedFromLanguage}
                        voice={state.selectedVoice}
                        onBack={handleIeltsChatBack}
                        onComplete={handleIeltsChatComplete}
                    />
                );

            case "ielts-part3-chat":
                if (!state.ieltsConfig) {
                    navigate("ielts-setup");
                    return null;
                }
                return (
                    <IeltsPart3ChatPage
                        ieltsConfig={state.ieltsConfig}
                        fromLanguage={state.selectedFromLanguage}
                        voice={state.selectedVoice}
                        onBack={handleIeltsChatBack}
                        onComplete={handleIeltsChatComplete}
                    />
                );

            case "ielts-summary":
                if (!state.ieltsResult) {
                    navigate("missions");
                    return null;
                }
                return (
                    <IeltsSummaryPage
                        result={state.ieltsResult}
                        part={state.ieltsConfig?.part}
                        topic={state.ieltsConfig?.topic}
                        cueCard={state.ieltsConfig?.cueCard}
                        onBackToMissions={handleIeltsSummaryBack}
                    />
                );

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
