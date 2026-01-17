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

    // Get today's date to exclude future workouts
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Fetch all completed/in_progress workout dates (excluding future dates)
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('workout_date')
      .eq('user_id', user.id)
      .in('status', ['completed', 'in_progress'])
      .lte('workout_date', todayStr) // Exclude future workouts
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

    // Helper to parse date string (YYYY-MM-DD) without timezone issues
    const parseLocalDate = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    // Helper to get difference in days between two date strings
    const getDayDiff = (date1: string, date2: string): number => {
      const d1 = parseLocalDate(date1);
      const d2 = parseLocalDate(date2);
      return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Get today's date string in local time
    const now = new Date();
    const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Calculate current streak
    // A streak counts CONSECUTIVE days only (no gaps allowed)
    let currentStreak = 0;
    
    const daysSinceLastWorkout = getDayDiff(todayLocalStr, lastWorkoutDate);
    
    // If the last workout was more than 1 day ago, current streak is 0
    // daysSinceLastWorkout: 0 = today, 1 = yesterday, 2+ = streak broken
    if (daysSinceLastWorkout > 1) {
      currentStreak = 0;
    } else {
      // Count the current streak (consecutive days only)
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const dayDiff = getDayDiff(uniqueDates[i - 1], uniqueDates[i]);
        
        // Only count consecutive days (exactly 1 day apart)
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak (consecutive days only)
    let longestStreak = 0;
    let tempStreak = 1;
    
    // Sort dates ascending for longest streak calculation
    const sortedDates = [...uniqueDates].sort();
    
    for (let i = 1; i < sortedDates.length; i++) {
      const dayDiff = getDayDiff(sortedDates[i], sortedDates[i - 1]);
      
      // Only count consecutive days
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Make sure longest streak is at least as big as current streak
    longestStreak = Math.max(longestStreak, currentStreak);

    // Additional stats (already filtered to exclude future workouts from query)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
    const workoutsLast30Days = uniqueDates.filter(date => date >= thirtyDaysAgoStr).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;
    const workoutsLast7Days = uniqueDates.filter(date => date >= sevenDaysAgoStr).length;

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
