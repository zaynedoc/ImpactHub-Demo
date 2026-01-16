'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

      {/* Login card */}
      <div className="w-full max-w-md">
        <div className="glass-surface rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-bright-accent mb-2">Welcome back</h1>
            <p className="text-muted-accent">Sign in to continue your fitness journey</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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

            {/* Password input */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-accent/60" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-accent/60 hover:text-bright-accent transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-main hover:text-accent transition-colors duration-200"
              >
                Forgot password?
              </Link>
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
              Sign in
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-main/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-muted-main/50 text-muted-accent">New to ImpactHub?</span>
            </div>
          </div>

          {/* Sign up link */}
          <Link href="/auth/signup">
            <Button variant="outline" className="w-full" size="lg">
              Create an account
            </Button>
          </Link>
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
