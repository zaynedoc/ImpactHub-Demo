import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateString, MAX_LENGTHS } from '@/lib/validation';
import type { ApiResponse, CreateWorkoutRequest } from '@/types/api';
import type { Database } from '@/types/database';

type Workout = Database['public']['Tables']['workouts']['Row'];
type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];

/**
 * GET /api/workouts
 * List all workouts for the authenticated user
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'workout_date';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? true : false;

    // Build query - include workout_exercises with their sets
    let query = supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          id,
          exercise_name,
          order_index,
          sets (
            id,
            weight,
            reps
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id);

    // Filter by status if provided
    if (status && ['planned', 'in_progress', 'completed', 'skipped'].includes(status)) {
      query = query.eq('status', status);
    }

    // Apply sorting
    const validSortColumns = ['workout_date', 'created_at', 'title'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'workout_date';
    query = query.order(sortColumn, { ascending: sortOrder });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: workouts, error, count } = await query;

    if (error) {
      console.error('Error fetching workouts:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch workouts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: workouts,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Workouts GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workouts
 * Create a new workout
 */
export async function POST(request: NextRequest) {
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

    // Rate limiting for workout creation
    const rateLimit = checkRateLimit(`workoutCreate:${user.id}`, RATE_LIMITS.workoutCreate);
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many workout creations. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate body
    const body: CreateWorkoutRequest = await request.json();

    // Validate title
    const titleValidation = validateString(body.title, MAX_LENGTHS.workoutTitle);
    if (!titleValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Invalid title: ${titleValidation.error}` },
        { status: 400 }
      );
    }

    // Validate notes if provided
    let sanitizedNotes: string | null = null;
    if (body.notes) {
      const notesValidation = validateString(body.notes, MAX_LENGTHS.notes);
      if (!notesValidation.valid) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Invalid notes: ${notesValidation.error}` },
          { status: 400 }
        );
      }
      sanitizedNotes = notesValidation.sanitized;
    }

    // Validate workout_date
    const workoutDate = new Date(body.workout_date);
    if (isNaN(workoutDate.getTime())) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid workout date' },
        { status: 400 }
      );
    }

    // Create workout - default to completed since we're logging a finished workout
    const insertData: WorkoutInsert = {
      user_id: user.id,
      title: titleValidation.sanitized,
      notes: sanitizedNotes,
      workout_date: body.workout_date,
      status: 'completed',
    };

    const { data: workout, error } = await supabase
      .from('workouts')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating workout:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create workout' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Workout>>(
      { success: true, data: workout, message: 'Workout created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Workouts POST error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
