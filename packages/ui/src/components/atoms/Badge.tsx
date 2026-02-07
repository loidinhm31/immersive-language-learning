/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { type HTMLAttributes, type ReactNode } from 'react';
import { cn, getDifficultyColor } from '@immersive-lang/shared';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  color?: string;
  difficulty?: string;
}

export function Badge({ children, className, color, difficulty, style, ...props }: BadgeProps) {
  const badgeColor = difficulty ? getDifficultyColor(difficulty) : color || '#8bc34a';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-lg',
        'text-xs font-extrabold uppercase tracking-wide',
        className
      )}
      style={{
        background: `${badgeColor}22`,
        color: badgeColor,
        border: `1px solid ${badgeColor}44`,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
