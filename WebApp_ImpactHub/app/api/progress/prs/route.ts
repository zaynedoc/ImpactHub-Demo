import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { ApiResponse, PersonalRecordResponse } from '@/types/api';

// Type for PR query result
interface SetWithExercise {
  weight: number;
  reps: number;
  created_at: string;
  workout_exercise: {
    exercise_name: string;
    workout: {
      user_id: string;
      workout_date: string;
    };
  };
}

/**
 * GET /api/progress/prs
 * Get personal records (highest weight for each exercise)
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
    const exerciseName = searchParams.get('exercise');
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    // Query to get personal records (max weight per exercise)
    // We need to join sets -> workout_exercises -> workouts to filter by user
    const { data: prData, error } = await supabase
      .from('sets')
      .select(`
        weight,
        reps,
        created_at,
        workout_exercise:workout_exercises!inner(
          exercise_name,
          workout:workouts!inner(
            user_id,
            workout_date
          )
        )
      `)
      .order('weight', { ascending: false });

    if (error) {
      console.error('Error fetching PRs:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch personal records' },
        { status: 500 }
      );
    }

    // Filter by user and process PRs
    const prMap = new Map<string, PersonalRecordResponse>();
    const typedPrData = (prData || []) as unknown as SetWithExercise[];
    
    for (const set of typedPrData) {
      const exerciseData = set.workout_exercise;

      // Filter by user
      if (exerciseData.workout.user_id !== user.id) {
        continue;
      }

      // Filter by exercise name if provided
      if (exerciseName && !exerciseData.exercise_name.toLowerCase().includes(exerciseName.toLowerCase())) {
        continue;
      }

      const exerciseKey = exerciseData.exercise_name.toLowerCase();
      const existingPR = prMap.get(exerciseKey);

      // Update if this is a new exercise or higher weight
      if (!existingPR || set.weight > existingPR.weight) {
        prMap.set(exerciseKey, {
          exercise_name: exerciseData.exercise_name,
          weight: set.weight,
          reps: set.reps,
          date: exerciseData.workout.workout_date,
        });
      }
    }

    // Convert to array and sort by weight descending
    const prs = Array.from(prMap.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);

    return NextResponse.json<ApiResponse<PersonalRecordResponse[]>>({
      success: true,
      data: prs,
    });
  } catch (error) {
    console.error('PRs GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
