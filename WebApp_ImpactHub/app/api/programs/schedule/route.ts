import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateUUID } from '@/lib/validation';
import type { ApiResponse } from '@/types/api';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface PlanWorkout {
  day: number;
  name: string;
  focus: string;
  exercises: Array<{
    name: string;
    sets: number | string;
    reps: string;
    restSeconds: number;
    notes?: string;
  }>;
}

interface PlanData {
  name: string;
  weeks: number;
  daysPerWeek: number;
  workouts: PlanWorkout[];
}

/**
 * POST /api/programs/schedule
 * Apply a program to the calendar by creating scheduled workouts
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
    const { program_id, start_date } = body;

    // Validate program ID
    if (!program_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Program ID is required' },
        { status: 400 }
      );
    }

    const uuidValidation = validateUUID(program_id);
    if (!uuidValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid program ID' },
        { status: 400 }
      );
    }

    // Validate start date
    if (!start_date) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Start date is required' },
        { status: 400 }
      );
    }

    const startDateObj = new Date(start_date);
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid start date' },
        { status: 400 }
      );
    }

    // Fetch the program
    const { data: programData, error: programError } = await supabase
      .from('saved_programs' as 'profiles')
      .select('*')
      .eq('id', program_id)
      .eq('user_id', user.id)
      .single();

    if (programError || !programData) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    const program = programData as unknown as {
      id: string;
      name: string;
      is_active: boolean;
      plan_data: PlanData;
    };

    // Prevent reactivating an already-active program
    if (program.is_active) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'This program is already active. Discontinue it first if you want to restart.' },
        { status: 400 }
      );
    }

    const planData = program.plan_data;
    
    if (!planData.workouts || planData.workouts.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Program has no workouts' },
        { status: 400 }
      );
    }

    // Create scheduled workouts for each week
    const scheduledWorkouts: Array<{
      user_id: string;
      program_id: string;
      title: string;
      workout_date: string;
      status: string;
      notes: string;
      scheduled_exercises: unknown;
    }> = [];

    for (let week = 0; week < planData.weeks; week++) {
      planData.workouts.forEach((workout) => {
        // Calculate the date for this workout
        // Day 1 = first day of the week (start date)
        // Day 2 = second day, etc.
        const daysFromStart = week * 7 + (workout.day - 1);
        const workoutDate = new Date(startDateObj);
        workoutDate.setDate(startDateObj.getDate() + daysFromStart);
        
        const dateStr = workoutDate.toISOString().split('T')[0];
        
        scheduledWorkouts.push({
          user_id: user.id,
          program_id: program.id,
          title: `${workout.name} (Week ${week + 1})`,
          workout_date: dateStr,
          status: 'planned',
          notes: `From program: ${program.name}\nFocus: ${workout.focus}`,
          scheduled_exercises: JSON.stringify(workout.exercises),
        });
      });
    }

    // Insert all scheduled workouts into the scheduled_workouts table
    const { data: insertedWorkouts, error: insertError } = await supabase
      .from('scheduled_workouts' as 'profiles')
      .insert(scheduledWorkouts as never)
      .select();

    if (insertError) {
      console.error('Error scheduling workouts:', insertError);
      
      // Check if table doesn't exist
      if (insertError.code === '42P01') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Scheduled workouts table not found. Please run migration.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Failed to schedule workouts: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Mark program as active (allow multiple programs to be active simultaneously)
    await supabase
      .from('saved_programs' as 'profiles')
      .update({ is_active: true } as never)
      .eq('id', program_id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        scheduledCount: scheduledWorkouts.length,
        startDate: start_date,
        endDate: scheduledWorkouts[scheduledWorkouts.length - 1]?.workout_date,
      },
      message: `Successfully scheduled ${scheduledWorkouts.length} workouts`,
    });
  } catch (error) {
    console.error('Program schedule error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
