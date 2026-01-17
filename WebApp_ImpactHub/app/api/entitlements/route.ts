import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { ApiResponse } from '@/types/api';

// Threshold for earning progress unlock
const PROGRESS_UNLOCK_THRESHOLD = 10;

interface EntitlementResponse {
  progressUnlocked: boolean;
  unlockReason: 'earned' | 'purchase' | 'admin' | null;
  totalWorkouts: number;
  workoutsUntilUnlock: number;
  unlockedAt: string | null;
}

/**
 * GET /api/entitlements
 * Check user's feature entitlements (progress unlock, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`api:${user.id}`, RATE_LIMITS.api);
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Type for entitlement data (table may not exist yet in types)
    interface EntitlementData {
      progress_unlocked: boolean;
      unlocked_reason: string | null;
      unlocked_at: string | null;
    }

    // Fetch entitlements record (if exists)
    // Note: Table might not exist in DB types yet, using type assertion
    let entitlement: EntitlementData | null = null;
    try {
      const { data, error } = await supabase
        .from('entitlements' as 'profiles') // Type workaround until types are regenerated
        .select('progress_unlocked, unlocked_reason, unlocked_at')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data) {
        entitlement = data as unknown as EntitlementData;
      }
    } catch {
      // Table might not exist yet, continue with null
    }

    // Count total workouts for the user
    const { count: totalWorkouts } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const workoutCount = totalWorkouts || 0;
    
    // Progress is unlocked if:
    // 1. Entitlement record shows progress_unlocked = true, OR
    // 2. User has 10+ total workouts (compute at runtime)
    const earnedByWorkouts = workoutCount >= PROGRESS_UNLOCK_THRESHOLD;
    const progressUnlocked = entitlement?.progress_unlocked === true || earnedByWorkouts;
    
    // Determine unlock reason
    let unlockReason: 'earned' | 'purchase' | 'admin' | null = null;
    if (entitlement?.unlocked_reason) {
      unlockReason = entitlement.unlocked_reason as 'earned' | 'purchase' | 'admin';
    } else if (earnedByWorkouts) {
      unlockReason = 'earned';
    }

    const response: EntitlementResponse = {
      progressUnlocked,
      unlockReason,
      totalWorkouts: workoutCount,
      workoutsUntilUnlock: Math.max(0, PROGRESS_UNLOCK_THRESHOLD - workoutCount),
      unlockedAt: entitlement?.unlocked_at || null,
    };

    return NextResponse.json<ApiResponse<EntitlementResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Entitlements GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
