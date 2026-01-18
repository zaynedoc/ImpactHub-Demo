'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import dynamic from 'next/dynamic';

// Dynamic import for DarkVeil background
const DarkVeil = dynamic(() => import('@/components/effects/DarkVeil'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted-main" />,
});

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      {/* Aurora Background */}
      <div className="fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
        <DarkVeil 
          hueShift={200} 
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

      {/* Logo with drop shadow */}
      <Link href="/" className="group flex items-center gap-2 mb-8">
        <div className="drop-shadow-[0_0_15px_rgba(17,100,102,0.5)]">
          <Dumbbell className="w-10 h-10 text-white group-hover:text-accent transition-colors duration-300 group-hover:rotate-12" />
        </div>
        <span className="text-2xl font-bold text-white drop-shadow-[0_0_15px_rgba(17,100,102,0.5)] group-hover:text-accent transition-all duration-300">
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

            {/* Submit button - centered */}
            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                glow
              >
                Sign in
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
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

          {/* Sign up link and Back to home - side by side */}
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="ghost" className="w-full" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to home
              </Button>
            </Link>
            <Link href="/auth/signup" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
