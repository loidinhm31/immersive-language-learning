/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

export const STORAGE_KEYS = {
  THEME: 'theme',
  LANGUAGE: 'immergo_language',
  FROM_LANGUAGE: 'immergo_from_language',
  MODE: 'immergo_mode',
  SESSION_DURATION: 'immergo_session_duration',
  VOICE: 'immergo_voice',
} as const;

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  STATUS: '/api/status',
  WEBSOCKET: '/ws',
} as const;

export const AUDIO_SAMPLE_RATES = {
  INPUT: 16000, // Gemini requires 16kHz input
  OUTPUT: 24000, // Gemini outputs at 24kHz
} as const;

export const DEFAULT_VOICE = 'Puck';
export const DEFAULT_TEMPERATURE = 1.0;

export const GEMINI_VOICES = [
  { name: 'Puck', personality: 'Upbeat' },
  { name: 'Kore', personality: 'Firm' },
  { name: 'Charon', personality: 'Informative' },
  { name: 'Fenrir', personality: 'Excitable' },
  { name: 'Leda', personality: 'Youthful' },
  { name: 'Aoede', personality: 'Breezy' },
  { name: 'Zephyr', personality: 'Bright' },
  { name: 'Orus', personality: 'Firm' },
  { name: 'Achird', personality: 'Friendly' },
  { name: 'Sulafat', personality: 'Warm' },
  { name: 'Gacrux', personality: 'Mature' },
  { name: 'Achernar', personality: 'Soft' },
  { name: 'Callirrhoe', personality: 'Easy-going' },
  { name: 'Umbriel', personality: 'Easy-going' },
  { name: 'Algieba', personality: 'Smooth' },
  { name: 'Despina', personality: 'Smooth' },
  { name: 'Enceladus', personality: 'Breathy' },
  { name: 'Iapetus', personality: 'Clear' },
  { name: 'Erinome', personality: 'Clear' },
  { name: 'Algenib', personality: 'Gravelly' },
  { name: 'Rasalgethi', personality: 'Informative' },
  { name: 'Laomedeia', personality: 'Upbeat' },
  { name: 'Alnilam', personality: 'Firm' },
  { name: 'Schedar', personality: 'Even' },
  { name: 'Pulcherrima', personality: 'Forward' },
  { name: 'Zubenelgenubi', personality: 'Casual' },
  { name: 'Vindemiatrix', personality: 'Gentle' },
  { name: 'Sadachbia', personality: 'Lively' },
  { name: 'Sadaltager', personality: 'Knowledgeable' },
  { name: 'Autonoe', personality: 'Bright' },
] as const;

export const SESSION_DURATIONS = {
  SHORT: 180, // 3 minutes
  MEDIUM: 300, // 5 minutes
  LONG: 600, // 10 minutes
  UNLIMITED: 1800, // 30 minutes (freestyle)
} as const;

export const DEFAULT_SESSION_DURATION = SESSION_DURATIONS.SHORT;
