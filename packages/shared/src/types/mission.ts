/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface Mission {
  id: number;
  title: string;
  difficulty: Difficulty;
  desc: string;
  target_role: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇦🇪' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'sci', name: 'Science Jargon', flag: '🧑‍🔬' },
];

export type AppMode = 'immergo_immersive' | 'immergo_teacher';

export type AppView = 'splash' | 'missions' | 'chat' | 'summary';

export interface SessionResult {
  incomplete?: boolean;
  score?: string;
  level?: string;
  notes?: string[];
}

export type SessionDuration = 180 | 300 | 600;

export interface AppState {
  view: AppView;
  selectedMission: Mission | null;
  selectedLanguage: string;
  selectedFromLanguage: string;
  selectedMode: AppMode;
  sessionDuration: SessionDuration;
  sessionResult: SessionResult | null;
}
