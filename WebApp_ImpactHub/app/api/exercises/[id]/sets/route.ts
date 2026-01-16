import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateNumber, validateUUID, NUMERIC_BOUNDS } from '@/lib/validation';
import type { ApiResponse, CreateSetRequest } from '@/types/api';
import type { Database } from '@/types/database';

type Set = Database['public']['Tables']['sets']['Row'];
type SetInsert = Database['public']['Tables']['sets']['Insert'];

// Type for exercise with workout join
interface ExerciseWithWorkout {
  id: string;
  workout: { user_id: string };
}

/**
 * GET /api/exercises/[id]/sets
 * Get all sets for an exercise
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
        { success: false, error: 'Invalid exercise ID' },
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

    // Verify exercise ownership via workout
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select(`
        id,
        workout:workouts!inner(user_id)
      `)
      .eq('id', id)
      .single();

    if (exerciseError || !exerciseData) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Type assertion for the joined workout data
    const exercise = exerciseData as unknown as ExerciseWithWorkout;
    if (exercise.workout.user_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Fetch sets
    const { data: sets, error } = await supabase
      .from('sets')
      .select('*')
      .eq('workout_exercise_id', id)
      .order('set_number', { ascending: true });

    if (error) {
      console.error('Error fetching sets:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch sets' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: sets,
    });
  } catch (error) {
    console.error('Sets GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exercises/[id]/sets
 * Add a set to an exercise
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
        { success: false, error: 'Invalid exercise ID' },
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

    // Verify exercise ownership via workout
    const { data: exerciseData2, error: exerciseError } = await supabase
      .from('workout_exercises')
      .select(`
        id,
        workout:workouts!inner(user_id)
      `)
      .eq('id', id)
      .single();

    if (exerciseError || !exerciseData2) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Type assertion for the joined workout data
    const exercise2 = exerciseData2 as unknown as ExerciseWithWorkout;
    if (exercise2.workout.user_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Parse and validate body
    const body: CreateSetRequest = await request.json();

    // Validate set_number
    const setNumberValidation = validateNumber(
      body.set_number,
      NUMERIC_BOUNDS.sets.min,
      NUMERIC_BOUNDS.sets.max
    );
    if (!setNumberValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Invalid set number: ${setNumberValidation.error}` },
        { status: 400 }
      );
    }

    // Validate weight
    const weightValidation = validateNumber(
      body.weight,
      NUMERIC_BOUNDS.weight.min,
      NUMERIC_BOUNDS.weight.max
    );
    if (!weightValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Invalid weight: ${weightValidation.error}` },
        { status: 400 }
      );
    }

    // Validate reps
    const repsValidation = validateNumber(
      body.reps,
      NUMERIC_BOUNDS.reps.min,
      NUMERIC_BOUNDS.reps.max
    );
    if (!repsValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Invalid reps: ${repsValidation.error}` },
        { status: 400 }
      );
    }

    // Validate rir if provided
    let rir: number | null = null;
    if (body.rir !== undefined && body.rir !== null) {
      const rirValidation = validateNumber(
        body.rir,
        NUMERIC_BOUNDS.rir.min,
        NUMERIC_BOUNDS.rir.max
      );
      if (!rirValidation.valid) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Invalid RIR: ${rirValidation.error}` },
          { status: 400 }
        );
      }
      rir = rirValidation.number;
    }

    // Create set
    const insertData: SetInsert = {
      workout_exercise_id: id,
      set_number: setNumberValidation.number,
      weight: weightValidation.number,
      reps: repsValidation.number,
      rir,
    };

    const { data: set, error } = await supabase
      .from('sets')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating set:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create set' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Set>>(
      { success: true, data: set, message: 'Set added successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Sets POST error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
