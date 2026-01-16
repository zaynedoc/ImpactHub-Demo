'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Mail, Lock, Eye, EyeOff, User, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import dynamic from 'next/dynamic';

// Dynamic import for DarkVeil background
const DarkVeil = dynamic(() => import('@/components/effects/DarkVeil'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted-main" />,
});

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Password strength validation
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!isPasswordStrong) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      // Check if it's a network/configuration error
      if (err instanceof Error && err.message.includes('fetch')) {
        setError('Unable to connect to authentication service. Please check your configuration.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Success state - show email verification message
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
        {/* Aurora Background */}
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
              We&apos;ve sent a verification link to <span className="text-bright-accent">{email}</span>. 
              Click the link to activate your account.
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      {/* Aurora Background */}
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

      {/* Logo with drop shadow */}
      <Link href="/" className="group flex items-center gap-2 mb-8">
        <div className="drop-shadow-[0_0_15px_rgba(17,100,102,0.5)]">
          <Dumbbell className="w-10 h-10 text-white group-hover:text-accent transition-colors duration-300 group-hover:rotate-12" />
        </div>
        <span className="text-2xl font-bold text-white drop-shadow-[0_0_15px_rgba(17,100,102,0.5)] group-hover:text-accent transition-all duration-300">
          ImpactHub
        </span>
      </Link>

      {/* Signup card */}
      <div className="w-full max-w-md">
        <div className="glass-surface rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-bright-accent mb-2">Create your account</h1>
            <p className="text-muted-accent">Start tracking your fitness journey today</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Full name input */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-accent/60" />
              <Input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="pl-10"
                disabled={isLoading}
              />
            </div>

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

            {/* Password requirements */}
            {password.length > 0 && (
              <div className="space-y-1 text-xs">
                <p className={passwordChecks.minLength ? 'text-main' : 'text-muted-accent/60'}>
                  {passwordChecks.minLength ? '?' : '?'} At least 8 characters
                </p>
                <p className={passwordChecks.hasUppercase ? 'text-main' : 'text-muted-accent/60'}>
                  {passwordChecks.hasUppercase ? '?' : '?'} One uppercase letter
                </p>
                <p className={passwordChecks.hasLowercase ? 'text-main' : 'text-muted-accent/60'}>
                  {passwordChecks.hasLowercase ? '?' : '?'} One lowercase letter
                </p>
                <p className={passwordChecks.hasNumber ? 'text-main' : 'text-muted-accent/60'}>
                  {passwordChecks.hasNumber ? '?' : '?'} One number
                </p>
              </div>
            )}

            {/* Confirm password input */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-accent/60" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pl-10"
                disabled={isLoading}
              />
              {confirmPassword.length > 0 && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${passwordsMatch ? 'text-main' : 'text-red-400'}`}>
                  {passwordsMatch ? '?' : '?'}
                </span>
              )}
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
                Create account
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            {/* Terms notice */}
            <p className="text-xs text-center text-muted-accent">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-main hover:text-accent transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-main hover:text-accent transition-colors">
                Privacy Policy
              </Link>
            </p>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-main/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-muted-main/50 text-muted-accent">Already have an account?</span>
            </div>
          </div>

          {/* Login link and Back to home - side by side */}
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="ghost" className="w-full" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to home
              </Button>
            </Link>
            <Link href="/auth/login" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                Sign in instead
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
