/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { type ReactNode, useEffect, useState } from 'react';
import { Github, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { API_ENDPOINTS } from '@immersive-lang/shared';

export interface AppShellProps {
  children: ReactNode;
}

const THEME_ICONS: Record<Theme, ReactNode> = {
  dark: <Moon size={18} />,
  light: <Sun size={18} />,
  system: <Monitor size={18} />,
};

const THEME_TITLES: Record<Theme, string> = {
  dark: 'Dark Mode',
  light: 'Light Mode',
  system: 'System Default',
};

export function AppShell({ children }: AppShellProps) {
  const { theme, cycleTheme } = useTheme();
  const [simpleModeWarning, setSimpleModeWarning] = useState<string[] | null>(null);

  useEffect(() => {
    async function checkConfigStatus() {
      try {
        const res = await fetch(API_ENDPOINTS.STATUS);
        const data = await res.json();
        if (data.mode === 'simple') {
          setSimpleModeWarning(data.missing);
        }
      } catch (e) {
        console.warn('Failed to check config status:', e);
      }
    }
    checkConfigStatus();
  }, []);

  return (
    <div className="min-h-screen w-full relative">
      {/* Header */}
      <header className="flex justify-end items-center py-2 px-4 gap-4 w-full pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <a
            href="https://github.com/ZackAkil/immersive-language-learning-with-live-api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 py-3.5 px-7 border-2 border-dashed border-accent-primary rounded-xl text-text-main no-underline font-extrabold transition-all duration-200 bg-surface backdrop-blur-[10px] shadow-sm text-lg hover:translate-y-[-3px] hover:shadow-md hover:bg-bg"
          >
            <Github size={20} style={{ opacity: 0.8 }} />
            Source
          </a>
        </div>

        <button
          onClick={cycleTheme}
          aria-label="Toggle Theme"
          title={THEME_TITLES[theme]}
          className="pointer-events-auto bg-surface text-text-main border border-glass-border rounded-full w-10 h-10 flex items-center justify-center cursor-pointer shadow-sm text-lg transition-all duration-200 backdrop-blur-[10px] hover:bg-bg"
        >
          {THEME_ICONS[theme]}
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full h-full">{children}</main>

      {/* Simple Mode Warning */}
      {simpleModeWarning && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#fff3cd] text-[#856404] py-2 px-4 text-center text-sm z-50 border-t border-[#ffeeba] flex justify-center items-center gap-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <span>
            ⚠️ <b>Simple Mode Check:</b> Production security features (
            {simpleModeWarning.join(' & ')}) are not configured.
          </span>
          <a
            href="https://github.com/ZackAkil/immersive-language-learning-with-live-api#advanced-configuration"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#533f03] underline font-bold ml-1"
          >
            Learn more
          </a>
        </div>
      )}
    </div>
  );
}
