'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type UserTier = 'free' | 'pro';

interface TierInfo {
  tier: UserTier;
  isLoading: boolean;
  isPro: boolean;
  workoutsThisMonth: number;
  workoutLimit: number;
  canLogWorkout: boolean;
  // Progress unlock (earned after 10 total workouts)
  totalWorkouts: number;
  progressUnlocked: boolean;
  workoutsUntilProgressUnlock: number;
}

// Free tier: 60 workouts per month (generous limit)
const FREE_WORKOUT_LIMIT = 60;
const PRO_WORKOUT_LIMIT = Infinity;

// Progress tab unlocks after 10 total workouts (lifetime)
const PROGRESS_UNLOCK_THRESHOLD = 10;

export function useTier(): TierInfo {
  const [tier, setTier] = useState<UserTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [workoutsThisMonth, setWorkoutsThisMonth] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  useEffect(() => {
    async function checkTier() {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan, status')
          .eq('user_id', user.id)
          .single();

        const subData = subscription as { plan?: string; status?: string } | null;
        const isActiveProSub = subData?.plan === 'pro' && 
          (subData?.status === 'active' || subData?.status === 'trialing');
        const userTier: UserTier = isActiveProSub ? 'pro' : 'free';
        setTier(userTier);

        // Count workouts this month
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const { count: monthlyCount } = await supabase
          .from('workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('workout_date', firstOfMonth)
          .lte('workout_date', lastOfMonth);

        setWorkoutsThisMonth(monthlyCount || 0);

        // Count total workouts (all time) for progress unlock
        const { count: totalCount } = await supabase
          .from('workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setTotalWorkouts(totalCount || 0);
      } catch (error) {
        console.error('Error checking tier:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkTier();
  }, []);

  const isPro = tier === 'pro';
  const workoutLimit = isPro ? PRO_WORKOUT_LIMIT : FREE_WORKOUT_LIMIT;
  const canLogWorkout = workoutsThisMonth < workoutLimit;
  
  // Progress is unlocked after 10 total workouts (or if Pro)
  const progressUnlocked = isPro || totalWorkouts >= PROGRESS_UNLOCK_THRESHOLD;
  const workoutsUntilProgressUnlock = Math.max(0, PROGRESS_UNLOCK_THRESHOLD - totalWorkouts);

  return {
    tier,
    isLoading,
    isPro,
    workoutsThisMonth,
    workoutLimit,
    canLogWorkout,
    totalWorkouts,
    progressUnlocked,
    workoutsUntilProgressUnlock,
  };
}

// Features that are always free (no Pro gate)
// Programs: FREE for everyone
// Progress: Unlocks after 10 workouts
// Workouts: 60/month for free users
export const FEATURE_ACCESS = {
  programs: 'free',           // Always free
  progress: 'earned',         // Earned after 10 workouts
  advancedAnalytics: 'pro',   // Pro only (future)
  unlimitedWorkouts: 'pro',   // Pro gets unlimited
} as const;

export function getFeatureAccess(feature: keyof typeof FEATURE_ACCESS): 'free' | 'earned' | 'pro' {
  return FEATURE_ACCESS[feature];
}
