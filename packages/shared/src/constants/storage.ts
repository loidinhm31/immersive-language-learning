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

export const SESSION_DURATIONS = {
  SHORT: 180, // 3 minutes
  MEDIUM: 300, // 5 minutes
  LONG: 600, // 10 minutes
  UNLIMITED: 1800, // 30 minutes (freestyle)
} as const;

export const DEFAULT_SESSION_DURATION = SESSION_DURATIONS.SHORT;
