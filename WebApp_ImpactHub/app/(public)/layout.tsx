'use client';

import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/Navbar';
import GradualBlur from '@/components/effects/GradualBlur';

// Dynamic import to avoid SSR issues with WebGL
const DarkVeil = dynamic(() => import('@/components/effects/DarkVeil'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted-main" />,
});

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Background DarkVeil effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <DarkVeil 
          hueShift={120} 
          speed={0.3}
          noiseIntensity={0.02}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-muted-main/70" />
      </div>

      <Navbar />
      <main className="pt-16 relative">
        {children}
      </main>

      {/* Gradual blur at bottom */}
      <GradualBlur 
        position="bottom"
        strength={2}
        height="8rem"
        divCount={10}
        exponential={true}
        target="page"
      />
    </>
  );
}
