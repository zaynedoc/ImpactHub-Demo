'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Dumbbell, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message') || 'An authentication error occurred';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-muted-main">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-main/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Logo */}
      <Link href="/" className="group flex items-center gap-2 mb-8">
        <Dumbbell className="w-10 h-10 text-main group-hover:text-accent transition-colors duration-300 group-hover:rotate-12" />
        <span className="text-2xl font-bold text-bright-accent group-hover:text-gradient transition-all duration-300">
          ImpactHub
        </span>
      </Link>

      {/* Error card */}
      <div className="w-full max-w-md">
        <div className="glass-surface rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-bright-accent mb-2">Authentication Error</h1>
          <p className="text-muted-accent mb-6">
            {errorMessage}
          </p>
          <div className="space-y-3">
            <Link href="/auth/login">
              <Button variant="primary" className="w-full">
                Try again
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted-main">
        <div className="w-8 h-8 border-2 border-main border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
