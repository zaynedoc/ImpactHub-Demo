import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateString, validateNumber, validateUUID, MAX_LENGTHS } from '@/lib/validation';
import type { ApiResponse, CreateExerciseRequest } from '@/types/api';
import type { Database } from '@/types/database';

type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
type WorkoutExerciseInsert = Database['public']['Tables']['workout_exercises']['Insert'];

/**
 * GET /api/workouts/[id]/exercises
 * Get all exercises for a workout
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate UUID
    const uuidValidation = validateUUID(id);
    if (!uuidValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid workout ID' },
        { status: 400 }
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

    // Verify workout ownership
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (workoutError || !workout) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Fetch exercises with sets
    const { data: exercises, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        sets (*)
      `)
      .eq('workout_id', id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching exercises:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch exercises' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: exercises,
    });
  } catch (error) {
    console.error('Exercises GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workouts/[id]/exercises
 * Add an exercise to a workout
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate UUID
    const uuidValidation = validateUUID(id);
    if (!uuidValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid workout ID' },
        { status: 400 }
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

    // Verify workout ownership
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (workoutError || !workout) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Parse and validate body
    const body: CreateExerciseRequest = await request.json();

    // Validate exercise_name
    const nameValidation = validateString(body.exercise_name, MAX_LENGTHS.exerciseName);
    if (!nameValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Invalid exercise name: ${nameValidation.error}` },
        { status: 400 }
      );
    }

    // Validate order_index
    const orderValidation = validateNumber(body.order_index, 0, 100);
    if (!orderValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Invalid order index: ${orderValidation.error}` },
        { status: 400 }
      );
    }

    // Create exercise
    const insertData: WorkoutExerciseInsert = {
      workout_id: id,
      exercise_name: nameValidation.sanitized,
      order_index: orderValidation.number,
    };

    const { data: exercise, error } = await supabase
      .from('workout_exercises')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating exercise:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create exercise' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<WorkoutExercise>>(
      { success: true, data: exercise, message: 'Exercise added successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Exercises POST error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
