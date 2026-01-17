import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { ApiResponse, VolumeStats } from '@/types/api';

// Type for workout query result
interface WorkoutWithExercises {
  id: string;
  workout_date: string;
  workout_exercises: {
    exercise_name: string;
    sets: { weight: number; reps: number }[];
  }[];
}

/**
 * GET /api/progress/volume
 * Get volume statistics over time (total weight * reps per workout)
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = Math.min(365, Math.max(7, parseInt(searchParams.get('days') || '30')));
    const exerciseName = searchParams.get('exercise');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all workouts with their sets in the date range (include completed and in_progress)
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(`
        id,
        workout_date,
        workout_exercises (
          exercise_name,
          sets (
            weight,
            reps
          )
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['completed', 'in_progress'])
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .lte('workout_date', endDate.toISOString().split('T')[0])
      .order('workout_date', { ascending: true });

    if (error) {
      console.error('Error fetching volume data:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch volume data' },
        { status: 500 }
      );
    }


    // Process volume by date
    const volumeMap = new Map<string, VolumeStats>();
    const typedWorkouts = (workouts || []) as unknown as WorkoutWithExercises[];
    let totalWorkoutCount = 0; // Track actual workout count, not unique days

    for (const workout of typedWorkouts) {
      const date = workout.workout_date;
      const existing = volumeMap.get(date) || {
        date,
        total_volume: 0,
        total_sets: 0,
        total_reps: 0,
      };

      const exercises = workout.workout_exercises;
      let workoutHasSets = false;

      for (const exercise of exercises) {
        // Filter by exercise name if provided
        if (exerciseName && !exercise.exercise_name.toLowerCase().includes(exerciseName.toLowerCase())) {
          continue;
        }

        for (const set of exercise.sets || []) {
          existing.total_volume += set.weight * set.reps;
          existing.total_sets += 1;
          existing.total_reps += set.reps;
          workoutHasSets = true;
        }
      }

      if (workoutHasSets) {
        totalWorkoutCount++;
      }

      volumeMap.set(date, existing);
    }

    // Convert to sorted array
    const volumeStats = Array.from(volumeMap.values())
      .filter(stat => stat.total_sets > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate summary statistics
    const totalVolume = volumeStats.reduce((sum, stat) => sum + stat.total_volume, 0);
    const totalSets = volumeStats.reduce((sum, stat) => sum + stat.total_sets, 0);
    const totalReps = volumeStats.reduce((sum, stat) => sum + stat.total_reps, 0);
    const avgVolumePerWorkout = totalWorkoutCount > 0 ? totalVolume / totalWorkoutCount : 0;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        daily: volumeStats,
        summary: {
          total_volume: totalVolume,
          total_sets: totalSets,
          total_reps: totalReps,
          workout_count: totalWorkoutCount, // Use actual workout count, not unique days
          avg_volume_per_workout: Math.round(avgVolumePerWorkout),
          period_days: days,
        },
      },
    });
  } catch (error) {
    console.error('Volume GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
