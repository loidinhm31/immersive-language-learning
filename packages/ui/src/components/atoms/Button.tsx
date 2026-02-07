/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@immersive-lang/shared';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-bold transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: [
          'bg-accent-primary text-white',
          'shadow-[0_10px_30px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.1)_inset]',
          'hover:translate-y-[-4px] hover:scale-[1.02] hover:brightness-110',
          'hover:shadow-[0_20px_50px_rgba(163,177,138,0.4),0_0_0_2px_rgba(255,255,255,0.2)_inset]',
        ],
        secondary: [
          'bg-surface text-text-main border border-glass-border',
          'shadow-sm backdrop-blur-[10px]',
          'hover:translate-y-[-3px] hover:shadow-md hover:bg-bg',
        ],
        danger: [
          'bg-danger text-white',
          'shadow-[0_10px_30px_rgba(0,0,0,0.2)]',
          'hover:translate-y-[-4px] hover:brightness-110',
        ],
        ghost: ['bg-transparent text-text-main', 'hover:bg-surface hover:shadow-sm'],
      },
      size: {
        sm: 'px-4 py-2 text-sm rounded-md',
        md: 'px-6 py-3 text-base rounded-lg',
        lg: 'px-12 py-6 text-lg rounded-xl',
        xl: 'px-16 py-6 text-xl rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  children: ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, isLoading, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="animate-spin mr-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
