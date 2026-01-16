'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-bright-accent mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2 bg-muted-main/80 border rounded-lg text-bright-accent placeholder-muted-accent/60
            focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            backdrop-blur-sm transition-all
            ${error ? 'border-red-500' : 'border-main/40 hover:border-main/60'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-muted-accent">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
