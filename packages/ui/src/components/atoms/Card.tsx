/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@immersive-lang/shared';

const cardVariants = cva(
  [
    'bg-surface backdrop-blur-[12px] border border-glass-border rounded-2xl',
    'shadow-sm transition-all duration-300',
  ],
  {
    variants: {
      variant: {
        default: '',
        interactive: [
          'cursor-pointer',
          'hover:translate-y-[-5px] hover:scale-[1.02]',
          'hover:shadow-[0_15px_30px_rgba(0,0,0,0.3),var(--shadow-glow)]',
          'hover:border-accent-primary hover:z-10',
        ],
        glass: 'bg-surface/60',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(cardVariants({ variant, padding }), className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
