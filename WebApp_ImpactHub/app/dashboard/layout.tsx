'use client';

import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/Sidebar';

// Dynamic import to avoid SSR issues with WebGL
const DarkVeil = dynamic(() => import('@/components/effects/DarkVeil'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted-main" />,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative">
      {/* Background DarkVeil effect - slightly different hue from home for differentiation */}
      <div className="fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
        <DarkVeil 
          hueShift={140} 
          speed={0.25}
          noiseIntensity={0.015}
        />
        {/* Animated orbs like home page */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-accent rounded-full animate-float opacity-70" />
          <div className="absolute top-40 right-20 w-3 h-3 bg-main rounded-full animate-float-delayed opacity-50" />
          <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-bright-accent rounded-full animate-float-slow opacity-60" />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-accent rounded-full animate-float opacity-40" />
          {/* Large ambient orbs - more visible */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-main rounded-full blur-3xl animate-pulse-glow opacity-30" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse-glow opacity-20" style={{ animationDelay: '1.5s' }} />
        </div>
        {/* Lighter overlay to show more of the aurora effect */}
        <div className="absolute inset-0 bg-muted-main/50" />
      </div>

      <Sidebar />
      <main className="lg:pl-64 min-h-screen relative">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
