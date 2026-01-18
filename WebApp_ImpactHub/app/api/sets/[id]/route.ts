import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateNumber, validateUUID, NUMERIC_BOUNDS } from '@/lib/validation';
import type { ApiResponse, UpdateSetRequest } from '@/types/api';
import type { Database } from '@/types/database';

type Set = Database['public']['Tables']['sets']['Row'];

// Type for set with workout join
interface SetWithWorkoutExercise extends Set {
  workout_exercise: {
    workout: { user_id: string };
  };
}

/**
 * Helper function to verify set ownership
 */
async function verifySetOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  setId: string,
  userId: string
): Promise<{ owned: boolean; set?: Set }> {
  const { data: setData, error } = await supabase
    .from('sets')
    .select(`
      *,
      workout_exercise:workout_exercises!inner(
        workout:workouts!inner(user_id)
      )
    `)
    .eq('id', setId)
    .single();

  if (error || !setData) {
    return { owned: false };
  }

  // Type assertion for the nested join
  const set = setData as unknown as SetWithWorkoutExercise;
  
  if (set.workout_exercise.workout.user_id !== userId) {
    return { owned: false };
  }

  return { owned: true, set };
}

/**
 * GET /api/sets/[id]
 * Get a single set
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
        { success: false, error: 'Invalid set ID' },
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

    // Verify ownership and get set
    const { owned, set } = await verifySetOwnership(supabase, id, user.id);
    
    if (!owned || !set) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Set not found' },
        { status: 404 }
      );
    }

    // Return clean set data without nested relations
    const { workout_exercise: _, ...cleanSet } = set as Set & { workout_exercise: unknown };

    return NextResponse.json<ApiResponse<Set>>({
      success: true,
      data: cleanSet,
    });
  } catch (error) {
    console.error('Set GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sets/[id]
 * Update a set
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
        { success: false, error: 'Invalid set ID' },
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
    const { owned } = await verifySetOwnership(supabase, id, user.id);
    
    if (!owned) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Set not found' },
        { status: 404 }
      );
    }

    // Parse and validate body
    const body: UpdateSetRequest = await request.json();
    const updates: Record<string, unknown> = {};

    // Validate weight if provided
    if (body.weight !== undefined) {
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
      updates.weight = weightValidation.number;
    }

    // Validate reps if provided
    if (body.reps !== undefined) {
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
      updates.reps = repsValidation.number;
    }

    // Validate rir if provided
    if (body.rir !== undefined) {
      if (body.rir === null) {
        updates.rir = null;
      } else {
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
        updates.rir = rirValidation.number;
      }
    }

    // Check if there's anything to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the set
    const { data: updatedSet, error: updateError } = await supabase
      .from('sets')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating set:', updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update set' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Set>>({
      success: true,
      data: updatedSet,
      message: 'Set updated successfully',
    });
  } catch (error) {
    console.error('Set PATCH error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sets/[id]
 * Delete a set
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
        { success: false, error: 'Invalid set ID' },
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
    const { owned } = await verifySetOwnership(supabase, id, user.id);
    
    if (!owned) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Set not found' },
        { status: 404 }
      );
    }

    // Delete the set
    const { error } = await supabase
      .from('sets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting set:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete set' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Set deleted successfully',
    });
  } catch (error) {
    console.error('Set DELETE error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
