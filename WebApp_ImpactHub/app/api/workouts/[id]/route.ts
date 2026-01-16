import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateString, validateUUID, MAX_LENGTHS } from '@/lib/validation';
import type { ApiResponse, UpdateWorkoutRequest } from '@/types/api';
import type { Database } from '@/types/database';

type Workout = Database['public']['Tables']['workouts']['Row'];
type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
type Set = Database['public']['Tables']['sets']['Row'];

interface WorkoutWithExercises extends Workout {
  workout_exercises: (WorkoutExercise & { sets: Set[] })[];
}

/**
 * GET /api/workouts/[id]
 * Get a single workout with its exercises and sets
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

    // Fetch workout with exercises and sets
    const { data: workout, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          *,
          sets (*)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Workout not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching workout:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch workout' },
        { status: 500 }
      );
    }

    // Type assertion for workout with exercises
    const typedWorkout = workout as unknown as WorkoutWithExercises;

    // Sort exercises by order_index and sets by set_number
    if (typedWorkout.workout_exercises) {
      typedWorkout.workout_exercises.sort((a: WorkoutExercise, b: WorkoutExercise) => 
        a.order_index - b.order_index
      );
      typedWorkout.workout_exercises.forEach((exercise: WorkoutExercise & { sets: Set[] }) => {
        if (exercise.sets) {
          exercise.sets.sort((a: Set, b: Set) => a.set_number - b.set_number);
        }
      });
    }

    return NextResponse.json<ApiResponse<WorkoutWithExercises>>({
      success: true,
      data: typedWorkout,
    });
  } catch (error) {
    console.error('Workout GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workouts/[id]
 * Update a workout
 */
export async function PATCH(
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

    // Verify ownership first
    const { data: existingWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingWorkout) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Parse and validate body
    const body: UpdateWorkoutRequest = await request.json();
    const updates: Record<string, unknown> = {};

    // Validate title if provided
    if (body.title !== undefined) {
      const titleValidation = validateString(body.title, MAX_LENGTHS.workoutTitle);
      if (!titleValidation.valid) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Invalid title: ${titleValidation.error}` },
          { status: 400 }
        );
      }
      updates.title = titleValidation.sanitized;
    }

    // Validate notes if provided
    if (body.notes !== undefined) {
      if (body.notes === null || body.notes === '') {
        updates.notes = null;
      } else {
        const notesValidation = validateString(body.notes, MAX_LENGTHS.notes);
        if (!notesValidation.valid) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: `Invalid notes: ${notesValidation.error}` },
            { status: 400 }
          );
        }
        updates.notes = notesValidation.sanitized;
      }
    }

    // Validate workout_date if provided
    if (body.workout_date !== undefined) {
      const workoutDate = new Date(body.workout_date);
      if (isNaN(workoutDate.getTime())) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid workout date' },
          { status: 400 }
        );
      }
      updates.workout_date = body.workout_date;
    }

    // Check if there's anything to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the workout
    const { data: workout, error: updateError } = await supabase
      .from('workouts')
      .update(updates as never)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating workout:', updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update workout' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Workout>>({
      success: true,
      data: workout,
      message: 'Workout updated successfully',
    });
  } catch (error) {
    console.error('Workout PATCH error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workouts/[id]
 * Delete a workout (cascades to exercises and sets)
 */
export async function DELETE(
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

    // Delete the workout (RLS ensures only owner can delete)
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting workout:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete workout' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Workout deleted successfully',
    });
  } catch (error) {
    console.error('Workout DELETE error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
