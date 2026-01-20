'use client';

import { ReactNode } from 'react';
import { DemoStoreProvider } from '@/lib/demo';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <DemoStoreProvider>
      {children}
    </DemoStoreProvider>
  );
}
