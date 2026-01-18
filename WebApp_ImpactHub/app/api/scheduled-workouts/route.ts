import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { ApiResponse } from '@/types/api';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/scheduled-workouts
 * List scheduled workouts for a date range
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Build query
    let query = supabase
      .from('scheduled_workouts' as 'profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('workout_date', { ascending: true });

    if (startDate) {
      query = query.gte('workout_date', startDate);
    }

    if (endDate) {
      query = query.lte('workout_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching scheduled workouts:', error);
      
      // Handle table not existing
      if (error.code === '42P01') {
        return NextResponse.json<ApiResponse>({
          success: true,
          data: [],
        });
      }
      
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch scheduled workouts' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Scheduled workouts GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
