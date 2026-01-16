'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, User, AtSign, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Database } from '@/types/database';

export default function ProfileSetupPage() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check if user is authenticated
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Pre-fill name from auth metadata if available
      if (user.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name);
      }

      setIsCheckingAuth(false);
    }

    checkAuth();
  }, [router, supabase.auth]);

  // Check username availability with debounce
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (error) {
          console.error('Error checking username:', error);
          setUsernameAvailable(null);
          setError('Unable to check username availability');
        } else {
          setUsernameAvailable(data === null);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to check username:', err);
        setUsernameAvailable(null);
        setError('Unable to connect to database. Check your Supabase configuration.');
      }
      
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, supabase]);

  // Username validation
  const isUsernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isUsernameValid) {
      setError('Username must be 3-20 characters, letters, numbers, and underscores only');
      return;
    }

    if (!usernameAvailable) {
      setError('This username is already taken');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Session expired. Please log in again.');
        router.push('/auth/login');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({
          username: username.toLowerCase(),
          full_name: fullName,
          bio: bio || null,
        })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.code === '23505') {
          setError('This username is already taken');
        } else {
          setError(updateError.message);
        }
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted-main">
        <Loader2 className="w-8 h-8 text-main animate-spin" />
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
      <div className="flex items-center gap-2 mb-8">
        <Dumbbell className="w-10 h-10 text-main" />
        <span className="text-2xl font-bold text-bright-accent">ImpactHub</span>
      </div>

      {/* Profile setup card */}
      <div className="w-full max-w-md">
        <div className="glass-surface rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-bright-accent mb-2">Complete your profile</h1>
            <p className="text-muted-accent">
              Set up your username and profile to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username input */}
            <div>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-accent/60" />
                <Input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  required
                  className="pl-10 pr-10"
                  disabled={isLoading}
                  maxLength={20}
                />
                {username.length >= 3 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername ? (
                      <Loader2 className="w-4 h-4 text-muted-accent animate-spin" />
                    ) : usernameAvailable ? (
                      <span className="text-main text-sm">?</span>
                    ) : usernameAvailable === false ? (
                      <span className="text-red-400 text-sm">?</span>
                    ) : null}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-accent">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

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
                maxLength={100}
              />
            </div>

            {/* Bio input */}
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-muted-accent/60" />
              <textarea
                placeholder="Tell us about yourself (optional)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-muted-main/80 border border-main/40 hover:border-main/60 rounded-lg text-bright-accent placeholder-muted-accent/60 focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent backdrop-blur-sm transition-all resize-none"
                rows={3}
                disabled={isLoading}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-muted-accent text-right">
                {bio.length}/500
              </p>
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
              disabled={!isUsernameValid || !usernameAvailable || !fullName.trim()}
              glow
            >
              Complete setup
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            {/* Skip option */}
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full text-sm text-muted-accent hover:text-bright-accent transition-colors"
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
