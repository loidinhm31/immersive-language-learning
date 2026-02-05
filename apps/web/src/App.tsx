/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { useCallback } from 'react';
import {
  AppShell,
  SplashPage,
  MissionsPage,
  ChatPage,
  SummaryPage,
  useAppState,
} from '@immersive-lang/ui';
import type { Mission, AppMode, SessionResult, SessionDuration } from '@immersive-lang/shared';

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

  const handleStart = useCallback(() => {
    navigate('missions');
  }, [navigate]);

  const handleMissionSelect = useCallback(
    (mission: Mission) => {
      navigate('chat', { mission });
    },
    [navigate]
  );

  const handleFromLanguageChange = useCallback(
    (lang: string) => {
      setSelectedFromLanguage(lang);
    },
    [setSelectedFromLanguage]
  );

  const handleToLanguageChange = useCallback(
    (lang: string) => {
      setSelectedLanguage(lang);
    },
    [setSelectedLanguage]
  );

  const handleModeChange = useCallback(
    (mode: AppMode) => {
      setSelectedMode(mode);
    },
    [setSelectedMode]
  );

  const handleVoiceChange = useCallback(
    (voice: string) => {
      setSelectedVoice(voice);
    },
    [setSelectedVoice]
  );

  const handleSessionDurationChange = useCallback(
    (duration: SessionDuration) => {
      setSessionDuration(duration);
    },
    [setSessionDuration]
  );

  const handleChatBack = useCallback(() => {
    navigate('missions');
  }, [navigate]);

  const handleChatComplete = useCallback(
    (result: SessionResult) => {
      navigate('summary', { result });
    },
    [navigate]
  );

  const handleBackToMissions = useCallback(() => {
    navigate('missions', { mission: undefined, result: undefined });
  }, [navigate]);

  const renderView = () => {
    switch (state.view) {
      case 'splash':
        return <SplashPage onStart={handleStart} />;

      case 'missions':
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
          />
        );

      case 'chat':
        if (!state.selectedMission) {
          navigate('missions');
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

      case 'summary':
        if (!state.sessionResult) {
          navigate('missions');
          return null;
        }
        return <SummaryPage result={state.sessionResult} onBackToMissions={handleBackToMissions} />;

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
