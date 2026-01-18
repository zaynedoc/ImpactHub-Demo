'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { GlowingEffect } from '@/components/effects/GlowingEffect';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, glow = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-muted-main disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-main text-bright-accent hover:bg-main/80 focus:ring-main shadow-glow-main hover:shadow-glow-accent',
      secondary: 'bg-muted-accent text-muted-main hover:bg-accent focus:ring-muted-accent',
      outline: 'border-2 border-main text-bright-accent hover:bg-main/20 focus:ring-main',
      ghost: 'text-bright-accent hover:bg-main/20 focus:ring-main',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const showGlow = glow && !disabled && !isLoading && (variant === 'primary' || variant === 'outline');

    return (
      <div className="relative inline-block">
        <button
          ref={ref}
          className={cn(baseStyles, variants[variant], sizes[size], className)}
          disabled={disabled || isLoading}
          {...props}
        >
          {isLoading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {children}
        </button>
        {showGlow && (
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={2}
            variant="default"
          />
        )}
      </div>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
