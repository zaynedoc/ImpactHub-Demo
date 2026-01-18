'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dumbbell, Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import dynamic from 'next/dynamic';

const DarkVeil = dynamic(() => import('@/components/effects/DarkVeil'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted-main" />,
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setIsSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
        <div className="fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
          <DarkVeil 
            hueShift={180} 
            speed={0.2}
            noiseIntensity={0.02}
          />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-main rounded-full blur-3xl animate-pulse-glow opacity-20" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse-glow opacity-15" style={{ animationDelay: '1.5s' }} />
          </div>
          <div className="absolute inset-0 bg-muted-main/60" />
        </div>

        <div className="w-full max-w-md">
          <div className="glass-surface rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-main/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-main" />
            </div>
            <h1 className="text-2xl font-bold text-bright-accent mb-2">Check your email</h1>
            <p className="text-muted-accent mb-6">
              If an account exists for <span className="text-bright-accent">{email}</span>, 
              we&apos;ve sent password reset instructions.
            </p>
            <div className="space-y-3">
              <Link href="/auth/login">
                <Button variant="primary" className="w-full">
                  Back to login
                </Button>
              </Link>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="text-sm text-muted-accent hover:text-bright-accent transition-colors"
              >
                Try a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      <div className="fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
        <DarkVeil 
          hueShift={180} 
          speed={0.2}
          noiseIntensity={0.02}
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-accent rounded-full animate-float opacity-60" />
          <div className="absolute top-40 right-20 w-3 h-3 bg-main rounded-full animate-float-delayed opacity-40" />
          <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-bright-accent rounded-full animate-float-slow opacity-50" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-main rounded-full blur-3xl animate-pulse-glow opacity-20" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse-glow opacity-15" style={{ animationDelay: '1.5s' }} />
        </div>
        <div className="absolute inset-0 bg-muted-main/60" />
      </div>

      <Link href="/" className="group flex items-center gap-2 mb-8">
        <div className="drop-shadow-[0_0_15px_rgba(17,100,102,0.5)]">
          <Dumbbell className="w-10 h-10 text-white group-hover:text-accent transition-colors duration-300 group-hover:rotate-12" />
        </div>
        <span className="text-2xl font-bold text-white drop-shadow-[0_0_15px_rgba(17,100,102,0.5)] group-hover:text-accent transition-all duration-300">
          ImpactHub
        </span>
      </Link>

      <div className="w-full max-w-md">
        <div className="glass-surface rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-bright-accent mb-2">Reset your password</h1>
            <p className="text-muted-accent">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-accent/60" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                glow
              >
                Send reset link
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-main/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-muted-main/50 text-muted-accent">Remember your password?</span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to home
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
