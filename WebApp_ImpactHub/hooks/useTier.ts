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
}

const FREE_WORKOUT_LIMIT = 45;
const PRO_WORKOUT_LIMIT = Infinity;

export function useTier(): TierInfo {
  const [tier, setTier] = useState<UserTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [workoutsThisMonth, setWorkoutsThisMonth] = useState(0);

  useEffect(() => {
    async function checkTier() {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Check user's subscription tier from profile
        // For now, all users are on free tier
        // In the future, this would check a subscription table
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        const profileData = profile as { subscription_tier?: string } | null;
        const userTier = (profileData?.subscription_tier as UserTier) || 'free';
        setTier(userTier);

        // Count workouts this month
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const { count } = await supabase
          .from('workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('workout_date', firstOfMonth)
          .lte('workout_date', lastOfMonth);

        setWorkoutsThisMonth(count || 0);
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

  return {
    tier,
    isLoading,
    isPro,
    workoutsThisMonth,
    workoutLimit,
    canLogWorkout,
  };
}

// List of features that require pro tier
export const PRO_FEATURES = {
  programs: true,
  progress: true,
  advancedAnalytics: true,
  unlimitedWorkouts: true,
} as const;

export function requiresPro(feature: keyof typeof PRO_FEATURES): boolean {
  return PRO_FEATURES[feature] === true;
}
