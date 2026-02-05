/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import type { AppMode } from '@immersive-lang/shared';
import { cn } from '@immersive-lang/shared';

interface ModeOption {
  id: AppMode;
  icon: string;
  title: string;
  description: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'immergo_teacher',
    icon: '🧑‍🏫',
    title: 'Teacher Mode',
    description: 'Guidance, specific tips, and corrections',
  },
  {
    id: 'immergo_immersive',
    icon: '🎭',
    title: 'Immersive Roleplay',
    description: 'Strict roleplay, no breaks in character',
  },
];

export interface ModeSelectorProps {
  value: AppMode;
  onChange: (mode: AppMode) => void;
  className?: string;
}

export function ModeSelector({ value, onChange, className }: ModeSelectorProps) {
  return (
    <div className={cn('w-full', className)}>
      <label className="block text-xs uppercase tracking-wider text-text-sub font-bold mb-3 ml-1">
        Select Experience Mode
      </label>
      <div className="grid grid-cols-2 gap-4">
        {MODE_OPTIONS.map(option => {
          const isActive = value === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border cursor-pointer',
                'transition-all duration-200 text-left',
                isActive
                  ? 'bg-accent-primary/10 border-accent-primary shadow-[0_4px_20px_rgba(163,177,138,0.15)] -translate-y-0.5'
                  : 'bg-white/[0.03] border-transparent hover:bg-white/[0.05]'
              )}
            >
              <span className="text-2xl">{option.icon}</span>
              <div>
                <div
                  className={cn(
                    'font-bold text-base',
                    isActive ? 'text-accent-primary' : 'text-text-main'
                  )}
                >
                  {option.title}
                </div>
                <div className="text-xs opacity-70 mt-0.5 text-text-sub">{option.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
