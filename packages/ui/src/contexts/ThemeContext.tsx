/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { STORAGE_KEYS } from '@immersive-lang/shared';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  resolvedTheme: 'dark' | 'light';
  embedded: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  /**
   * When true, the provider dispatches custom events instead of modifying
   * document.body directly. Use this when embedding the app inside a parent
   * application to avoid theme conflicts.
   */
  embedded?: boolean;
  /**
   * Custom localStorage key for theme persistence.
   * Use unique keys per app to avoid conflicts when embedded.
   * @default STORAGE_KEYS.THEME ('immersive-lang-theme')
   */
  storageKey?: string;
  /**
   * Custom event name dispatched when theme changes in embedded mode.
   * Parent app should listen for this event to update shadow DOM styles.
   * @default 'immersive-lang-theme-change'
   */
  themeEventName?: string;
}

const DEFAULT_EVENT_NAME = 'immersive-lang-theme-change';

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  embedded = false,
  storageKey = STORAGE_KEYS.THEME,
  themeEventName = DEFAULT_EVENT_NAME,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  // Resolve the actual theme based on system preference
  const resolveTheme = useCallback((currentTheme: Theme): 'dark' | 'light' => {
    if (currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return currentTheme;
  }, []);

  // Apply theme - either to document or via custom event
  const applyTheme = useCallback(
    (resolved: 'dark' | 'light') => {
      setResolvedTheme(resolved);

      if (embedded) {
        // Dispatch custom event for parent app / shadow DOM wrapper
        window.dispatchEvent(
          new CustomEvent(themeEventName, {
            detail: { theme: resolved },
          })
        );
      } else {
        // Apply directly to document.body
        if (resolved === 'light') {
          document.body.classList.add('light-mode');
        } else {
          document.body.classList.remove('light-mode');
        }
      }
    },
    [embedded, themeEventName]
  );

  // Set theme and persist
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem(storageKey, newTheme);
      applyTheme(resolveTheme(newTheme));
    },
    [applyTheme, resolveTheme, storageKey]
  );

  // Cycle through themes: dark -> light -> system -> dark
  const cycleTheme = useCallback(() => {
    const modes: Theme[] = ['dark', 'light', 'system'];
    const currentIdx = modes.indexOf(theme);
    const nextIdx = (currentIdx + 1) % modes.length;
    setTheme(modes[nextIdx]);
  }, [theme, setTheme]);

  // Initial theme application and system preference listener
  useEffect(() => {
    applyTheme(resolveTheme(theme));

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme(resolveTheme('system'));
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme, resolveTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, resolvedTheme, embedded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
