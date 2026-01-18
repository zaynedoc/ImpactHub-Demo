import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateString, validateUUID, MAX_LENGTHS } from '@/lib/validation';
import type { ApiResponse } from '@/types/api';

/**
 * Helper function to verify exercise ownership
 */
async function verifyExerciseOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exerciseId: string,
  userId: string
): Promise<boolean> {
  const { data: exerciseData, error } = await supabase
    .from('workout_exercises')
    .select(`
      id,
      workout:workouts!inner(user_id)
    `)
    .eq('id', exerciseId)
    .single();

  if (error || !exerciseData) {
    return false;
  }

  // Type assertion for the nested join
  const exercise = exerciseData as unknown as {
    id: string;
    workout: { user_id: string };
  };
  
  return exercise.workout.user_id === userId;
}

/**
 * GET /api/exercises/[id]
 * Get a single exercise with its sets
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

    // Verify ownership
    const owned = await verifyExerciseOwnership(supabase, id, user.id);
    if (!owned) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Fetch with sets
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        sets (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Exercise GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/exercises/[id]
 * Update an exercise
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

    // Verify ownership
    const owned = await verifyExerciseOwnership(supabase, id, user.id);
    if (!owned) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { exercise_name, order_index } = body;

    // Build update object
    const updateData: Record<string, unknown> = {};
    
    // Validate exercise name if provided
    if (exercise_name !== undefined) {
      const nameValidation = validateString(exercise_name, MAX_LENGTHS.exerciseName);
      if (!nameValidation.valid) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Invalid exercise name: ${nameValidation.error}` },
          { status: 400 }
        );
      }
      updateData.exercise_name = nameValidation.sanitized;
    }
    
    if (order_index !== undefined) {
      updateData.order_index = order_index;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update exercise
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('workout_exercises')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating exercise:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update exercise' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Exercise PATCH error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/exercises/[id]
 * Delete an exercise (cascades to sets)
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

    // Verify ownership
    const owned = await verifyExerciseOwnership(supabase, id, user.id);
    if (!owned) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Delete exercise (sets will cascade delete due to FK constraint)
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting exercise:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete exercise' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Exercise deleted successfully',
    });
  } catch (error) {
    console.error('Exercise DELETE error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
