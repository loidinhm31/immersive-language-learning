/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  AppView,
  AppMode,
  Mission,
  SessionResult,
  AppState,
  SessionDuration,
} from '@immersive-lang/shared';
import { STORAGE_KEYS, DEFAULT_SESSION_DURATION } from '@immersive-lang/shared';

interface AppStateContextValue {
  state: AppState;
  navigate: (view: AppView, options?: NavigateOptions) => void;
  setSelectedMission: (mission: Mission | null) => void;
  setSelectedLanguage: (language: string) => void;
  setSelectedFromLanguage: (language: string) => void;
  setSelectedMode: (mode: AppMode) => void;
  setSessionDuration: (duration: SessionDuration) => void;
  setSessionResult: (result: SessionResult | null) => void;
}

interface NavigateOptions {
  mission?: Mission;
  language?: string;
  fromLanguage?: string;
  mode?: AppMode;
  sessionDuration?: SessionDuration;
  result?: SessionResult;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

interface AppStateProviderProps {
  children: ReactNode;
}

function getInitialState(): AppState {
  if (typeof window === 'undefined') {
    return {
      view: 'splash',
      selectedMission: null,
      selectedLanguage: '🇫🇷 French',
      selectedFromLanguage: '🇬🇧 English',
      selectedMode: 'immergo_immersive',
      sessionDuration: DEFAULT_SESSION_DURATION,
      sessionResult: null,
    };
  }

  const storedDuration = localStorage.getItem(STORAGE_KEYS.SESSION_DURATION);
  const sessionDuration = storedDuration
    ? (parseInt(storedDuration, 10) as SessionDuration)
    : DEFAULT_SESSION_DURATION;

  return {
    view: 'splash',
    selectedMission: null,
    selectedLanguage: localStorage.getItem(STORAGE_KEYS.LANGUAGE) || '🇫🇷 French',
    selectedFromLanguage: localStorage.getItem(STORAGE_KEYS.FROM_LANGUAGE) || '🇬🇧 English',
    selectedMode: (localStorage.getItem(STORAGE_KEYS.MODE) as AppMode) || 'immergo_immersive',
    sessionDuration,
    sessionResult: null,
  };
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [state, setState] = useState<AppState>(getInitialState);

  const navigate = useCallback((view: AppView, options?: NavigateOptions) => {
    setState(prev => ({
      ...prev,
      view,
      ...(options?.mission !== undefined && { selectedMission: options.mission }),
      ...(options?.language && { selectedLanguage: options.language }),
      ...(options?.fromLanguage && { selectedFromLanguage: options.fromLanguage }),
      ...(options?.mode && { selectedMode: options.mode }),
      ...(options?.sessionDuration && { sessionDuration: options.sessionDuration }),
      ...(options?.result !== undefined && { sessionResult: options.result }),
    }));
  }, []);

  const setSelectedMission = useCallback((mission: Mission | null) => {
    setState(prev => ({ ...prev, selectedMission: mission }));
  }, []);

  const setSelectedLanguage = useCallback((language: string) => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    setState(prev => ({ ...prev, selectedLanguage: language }));
  }, []);

  const setSelectedFromLanguage = useCallback((language: string) => {
    localStorage.setItem(STORAGE_KEYS.FROM_LANGUAGE, language);
    setState(prev => ({ ...prev, selectedFromLanguage: language }));
  }, []);

  const setSelectedMode = useCallback((mode: AppMode) => {
    localStorage.setItem(STORAGE_KEYS.MODE, mode);
    setState(prev => ({ ...prev, selectedMode: mode }));
  }, []);

  const setSessionDuration = useCallback((duration: SessionDuration) => {
    localStorage.setItem(STORAGE_KEYS.SESSION_DURATION, duration.toString());
    setState(prev => ({ ...prev, sessionDuration: duration }));
  }, []);

  const setSessionResult = useCallback((result: SessionResult | null) => {
    setState(prev => ({ ...prev, sessionResult: result }));
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        state,
        navigate,
        setSelectedMission,
        setSelectedLanguage,
        setSelectedFromLanguage,
        setSelectedMode,
        setSessionDuration,
        setSessionResult,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
