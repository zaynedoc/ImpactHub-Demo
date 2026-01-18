import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateString, MAX_LENGTHS } from '@/lib/validation';
import type { ApiResponse } from '@/types/api';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface SavedProgram {
  id: string;
  name: string;
  description: string | null;
  weeks: number;
  days_per_week: number;
  goal: string | null;
  experience_level: string | null;
  equipment: string | null;
  source: 'ai' | 'manual' | 'template';
  is_active: boolean;
  plan_data: unknown;
  created_at: string;
}

/**
 * GET /api/programs
 * List user's saved programs
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

    // Fetch user's programs
    const { data, error } = await supabase
      .from('saved_programs' as 'profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching programs:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch programs' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<SavedProgram[]>>({
      success: true,
      data: data as unknown as SavedProgram[],
    });
  } catch (error) {
    console.error('Programs GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/programs
 * Save a new program
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
    const {
      name,
      description,
      weeks,
      days_per_week,
      goal,
      experience_level,
      equipment,
      source,
      plan_data,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Program name is required' },
        { status: 400 }
      );
    }

    const nameValidation = validateString(name, MAX_LENGTHS.workoutTitle);
    if (!nameValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Invalid name: ${nameValidation.error}` },
        { status: 400 }
      );
    }

    if (!plan_data) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Program data is required' },
        { status: 400 }
      );
    }

    if (!days_per_week || days_per_week < 1 || days_per_week > 7) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Days per week must be between 1 and 7' },
        { status: 400 }
      );
    }

    // Validate optional description
    let sanitizedDescription: string | null = null;
    if (description) {
      const descValidation = validateString(description, MAX_LENGTHS.notes, { allowEmpty: true });
      if (!descValidation.valid) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Invalid description: ${descValidation.error}` },
          { status: 400 }
        );
      }
      sanitizedDescription = descValidation.sanitized || null;
    }

    // Insert program
    const { data, error } = await supabase
      .from('saved_programs' as 'profiles')
      .insert({
        user_id: user.id,
        name: nameValidation.sanitized,
        description: sanitizedDescription,
        weeks: weeks || 4,
        days_per_week,
        goal: goal || null,
        experience_level: experience_level || null,
        equipment: equipment || null,
        source: source || 'manual',
        plan_data,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error saving program:', error);
      // Provide more helpful error message
      if (error.code === '42P01') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Database table not found. Please run migration 00005.' },
          { status: 500 }
        );
      }
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Failed to save program: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
      message: 'Program saved successfully',
    });
  } catch (error) {
    console.error('Programs POST error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
