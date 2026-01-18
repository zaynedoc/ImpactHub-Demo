import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateUUID } from '@/lib/validation';
import type { ApiResponse } from '@/types/api';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * POST /api/programs/[id]/discontinue
 * Discontinue an active program by deleting all future scheduled workouts
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
        { success: false, error: 'Invalid program ID' },
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

    // Verify program belongs to user
    const { data: program, error: programError } = await supabase
      .from('saved_programs' as 'profiles')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (programError || !program) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    // Get today's date to only delete future workouts
    const today = new Date().toISOString().split('T')[0];

    // Delete all future scheduled workouts for this program that are still planned
    const { data: deletedData, error: deleteError } = await supabase
      .from('scheduled_workouts' as 'profiles')
      .delete()
      .eq('program_id', id)
      .eq('user_id', user.id)
      .gte('workout_date', today)
      .in('status', ['planned', 'in_progress'])
      .select();

    if (deleteError) {
      console.error('Error deleting scheduled workouts:', deleteError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to discontinue program' },
        { status: 500 }
      );
    }

    // Mark program as inactive
    await supabase
      .from('saved_programs' as 'profiles')
      .update({ is_active: false } as never)
      .eq('id', id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        deletedCount: deletedData?.length || 0,
      },
      message: `Discontinued program and removed ${deletedData?.length || 0} scheduled workouts`,
    });
  } catch (error) {
    console.error('Program discontinue error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
