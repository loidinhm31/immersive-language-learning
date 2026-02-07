/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import type { SessionDuration } from '@immersive-lang/shared';
import { cn, SESSION_DURATIONS } from '@immersive-lang/shared';
import { Clock } from 'lucide-react';

interface DurationOption {
  value: SessionDuration;
  label: string;
  description: string;
}

const DURATION_OPTIONS: DurationOption[] = [
  {
    value: SESSION_DURATIONS.SHORT,
    label: '3 min',
    description: 'Quick practice session',
  },
  {
    value: SESSION_DURATIONS.MEDIUM,
    label: '5 min',
    description: 'Standard session length',
  },
  {
    value: SESSION_DURATIONS.LONG,
    label: '10 min',
    description: 'Extended practice session',
  },
];

export interface SessionDurationSelectorProps {
  value: SessionDuration;
  onChange: (duration: SessionDuration) => void;
  className?: string;
}

export function SessionDurationSelector({
  value,
  onChange,
  className,
}: SessionDurationSelectorProps) {
  return (
    <div className={cn('w-full', className)}>
      <label className="block text-xs uppercase tracking-wider text-text-sub font-bold mb-3 ml-1">
        Session Duration
      </label>
      <div className="grid grid-cols-3 gap-3">
        {DURATION_OPTIONS.map(option => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer',
                'transition-all duration-200 text-center',
                isActive
                  ? 'bg-accent-primary/10 border-accent-primary shadow-[0_4px_20px_rgba(163,177,138,0.15)] -translate-y-0.5'
                  : 'bg-white/[0.03] border-transparent hover:bg-white/[0.05]'
              )}
            >
              <Clock
                className={cn('w-5 h-5', isActive ? 'text-accent-primary' : 'text-text-sub')}
              />
              <div>
                <div
                  className={cn(
                    'font-bold text-base',
                    isActive ? 'text-accent-primary' : 'text-text-main'
                  )}
                >
                  {option.label}
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
