import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { ApiResponse, StreakInfo } from '@/types/api';

// Type for workout date query result
interface WorkoutDate {
  workout_date: string;
}

/**
 * GET /api/progress/streaks
 * Get workout streak information
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

    // Fetch all completed/in_progress workout dates
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('workout_date')
      .eq('user_id', user.id)
      .in('status', ['completed', 'in_progress'])
      .order('workout_date', { ascending: false });

    if (error) {
      console.error('Error fetching streak data:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch streak data' },
        { status: 500 }
      );
    }

    // No workouts = no streak
    const typedWorkouts = (workouts || []) as unknown as WorkoutDate[];
    
    if (typedWorkouts.length === 0) {
      const streakInfo: StreakInfo = {
        current_streak: 0,
        longest_streak: 0,
        last_workout_date: null,
      };
      return NextResponse.json<ApiResponse<StreakInfo>>({
        success: true,
        data: streakInfo,
      });
    }

    // Get unique dates (in case of multiple workouts on same day)
    const uniqueDates = [...new Set(typedWorkouts.map(w => w.workout_date))].sort().reverse();
    const lastWorkoutDate = uniqueDates[0];

    // Calculate current streak
    // A streak counts consecutive days or days with only 1 day gap (for rest days)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if the last workout was within the valid streak window (today or yesterday)
    const lastWorkoutDateObj = new Date(lastWorkoutDate);
    lastWorkoutDateObj.setHours(0, 0, 0, 0);
    
    const daysSinceLastWorkout = Math.floor((today.getTime() - lastWorkoutDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    // If the last workout was more than 1 day ago, current streak is 0
    if (daysSinceLastWorkout > 1) {
      currentStreak = 0;
    } else {
      // Count the current streak
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i - 1]);
        const previousDate = new Date(uniqueDates[i]);
        
        const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Allow 1 or 2 day gaps (accounts for rest days)
        if (dayDiff <= 2) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;
    
    // Sort dates ascending for longest streak calculation
    const sortedDates = [...uniqueDates].sort();
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const previousDate = new Date(sortedDates[i - 1]);
      
      const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Allow 1 or 2 day gaps
      if (dayDiff <= 2) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Make sure longest streak is at least as big as current streak
    longestStreak = Math.max(longestStreak, currentStreak);

    // Additional stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const workoutsLast30Days = uniqueDates.filter(date => new Date(date) >= thirtyDaysAgo).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const workoutsLast7Days = uniqueDates.filter(date => new Date(date) >= sevenDaysAgo).length;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_workout_date: lastWorkoutDate,
        total_workouts: uniqueDates.length,
        workouts_last_7_days: workoutsLast7Days,
        workouts_last_30_days: workoutsLast30Days,
      },
    });
  } catch (error) {
    console.error('Streaks GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
