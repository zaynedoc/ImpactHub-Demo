'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dumbbell, Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-muted-main">
        {/* Background decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-main/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
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

      {/* Forgot password card */}
      <div className="w-full max-w-md">
        <div className="glass-surface rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-bright-accent mb-2">Reset your password</h1>
            <p className="text-muted-accent">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email input */}
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

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              glow
            >
              Send reset link
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm text-muted-accent hover:text-bright-accent transition-colors duration-200"
            >
              <ArrowLeft className="mr-1 w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-accent hover:text-bright-accent transition-colors duration-200"
          >
            ? Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
