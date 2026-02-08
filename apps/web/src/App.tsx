/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, useAppState, useSessionHistory, Spinner } from '@immersive-lang/ui';
import type {
  Mission,
  AppMode,
  SessionResult,
  SessionDuration,
  SessionHistoryEntry,
} from '@immersive-lang/shared';

// Lazy load page components
const SplashPage = lazy(() => import('@immersive-lang/ui').then(m => ({ default: m.SplashPage })));
const MissionsPage = lazy(() =>
  import('@immersive-lang/ui').then(m => ({ default: m.MissionsPage }))
);
const ChatPage = lazy(() => import('@immersive-lang/ui').then(m => ({ default: m.ChatPage })));
const SummaryPage = lazy(() =>
  import('@immersive-lang/ui').then(m => ({ default: m.SummaryPage }))
);
const HistoryPage = lazy(() =>
  import('@immersive-lang/ui').then(m => ({ default: m.HistoryPage }))
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
    navigate('/missions');
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
      navigate('/chat');
    },
    [navigate, setSelectedMission]
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

  const handleViewHistory = useCallback(() => {
    navigate('/history');
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
    />
  );
}

function ChatPageWrapper() {
  const navigate = useNavigate();
  const { state, setSessionResult } = useAppState();

  useEffect(() => {
    if (!state.selectedMission) {
      navigate('/missions');
    }
  }, [state.selectedMission, navigate]);

  const handleChatBack = useCallback(() => {
    navigate('/missions');
  }, [navigate]);

  const handleChatComplete = useCallback(
    (result: SessionResult) => {
      setSessionResult(result);
      navigate('/summary');
    },
    [navigate, setSessionResult]
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
      }).catch(err => {
        console.error('Failed to save session to history:', err);
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
    if (location.pathname !== '/summary') {
      sessionSavedRef.current = false;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!state.sessionResult) {
      navigate('/missions');
    }
  }, [state.sessionResult, navigate]);

  const handleBackToMissions = useCallback(() => {
    setSelectedMission(null);
    setSessionResult(null);
    navigate('/missions');
  }, [navigate, setSelectedMission, setSessionResult]);

  const handleBackToHistory = useCallback(() => {
    setSessionResult(null);
    navigate('/history');
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
    navigate('/missions');
  }, [navigate]);

  const handleViewSession = useCallback(
    (entry: SessionHistoryEntry) => {
      setSessionResult(entry.result);
      navigate('/summary', { state: { fromHistory: true } });
    },
    [navigate, setSessionResult]
  );

  return <HistoryPage onBack={handleHistoryBack} onViewSession={handleViewSession} />;
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
      </Route>
    </Routes>
  );
}

export default App;
