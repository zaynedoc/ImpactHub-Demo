'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AuroraText({ children, className }: AuroraTextProps) {
  return (
    <span
      className={cn(
        'relative inline-block bg-gradient-to-r from-main via-accent to-bright-accent bg-[length:200%_auto] bg-clip-text text-transparent animate-aurora',
        className
      )}
    >
      {children}
    </span>
  );
}
