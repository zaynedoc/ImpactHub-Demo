'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ResetPasswordPage() {
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

  async function handleSubmit(e: React.FormEvent) {
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
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setIsSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
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
            <h1 className="text-2xl font-bold text-bright-accent mb-2">Password updated!</h1>
            <p className="text-muted-accent mb-6">
              Your password has been successfully reset. Redirecting you to the dashboard...
            </p>
            <div className="w-8 h-8 border-2 border-main border-t-transparent rounded-full animate-spin mx-auto" />
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

      {/* Reset password card */}
      <div className="w-full max-w-md">
        <div className="glass-surface rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-bright-accent mb-2">Set new password</h1>
            <p className="text-muted-accent">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password input */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-accent/60" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="New password"
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
                placeholder="Confirm new password"
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

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              glow
            >
              Update password
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>
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
