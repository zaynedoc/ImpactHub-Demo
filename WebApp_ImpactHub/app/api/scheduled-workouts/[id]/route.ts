import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateUUID } from '@/lib/validation';
import type { ApiResponse } from '@/types/api';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/scheduled-workouts/[id]
 * Get a single scheduled workout
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
        { success: false, error: 'Invalid scheduled workout ID' },
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

    const { data, error } = await supabase
      .from('scheduled_workouts' as 'profiles')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Scheduled workout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Scheduled workout GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/scheduled-workouts/[id]
 * Update a scheduled workout (status, link to completed workout, etc.)
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
        { success: false, error: 'Invalid scheduled workout ID' },
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

    // Parse request body
    const body = await request.json();
    const { status, completed_workout_id } = body;

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      const validStatuses = ['planned', 'in_progress', 'completed', 'skipped'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (completed_workout_id !== undefined) {
      updateData.completed_workout_id = completed_workout_id;
      if (completed_workout_id) {
        updateData.status = 'completed';
      }
    }

    const { data, error } = await supabase
      .from('scheduled_workouts' as 'profiles')
      .update(updateData as never)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating scheduled workout:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update scheduled workout' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Scheduled workout PATCH error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scheduled-workouts/[id]
 * Delete a scheduled workout
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
        { success: false, error: 'Invalid scheduled workout ID' },
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

    const { error } = await supabase
      .from('scheduled_workouts' as 'profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting scheduled workout:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete scheduled workout' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Scheduled workout deleted',
    });
  } catch (error) {
    console.error('Scheduled workout DELETE error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
