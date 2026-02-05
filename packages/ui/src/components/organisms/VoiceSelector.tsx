/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { type ChangeEvent } from 'react';
import { cn, GEMINI_VOICES } from '@immersive-lang/shared';
import { ChevronDown } from 'lucide-react';

export interface VoiceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function VoiceSelector({ value, onChange, className }: VoiceSelectorProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-xs uppercase tracking-wider font-bold ml-1 text-text-sub">Voice</label>
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          className={cn(
            'w-full py-3 px-4 rounded-xl appearance-none cursor-pointer',
            'bg-surface text-text-main font-semibold text-base',
            'border border-glass-border transition-all duration-200',
            'hover:bg-bg focus:outline-none focus:ring-2 focus:ring-accent-primary'
          )}
        >
          {GEMINI_VOICES.map(voice => (
            <option key={voice.name} value={voice.name}>
              {voice.name} — {voice.personality}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}
