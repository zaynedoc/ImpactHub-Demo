import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { validateString, validateUUID, MAX_LENGTHS } from '@/lib/validation';
import type { ApiResponse } from '@/types/api';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/programs/[id]
 * Get a single program
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

    // Fetch program (RLS ensures user can only see their own)
    const { data, error } = await supabase
      .from('saved_programs' as 'profiles')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Program GET error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/programs/[id]
 * Update a program
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

    // Parse request body
    const body = await request.json();
    const { name, description, is_active, plan_data } = body;

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      const nameValidation = validateString(name, MAX_LENGTHS.workoutTitle);
      if (!nameValidation.valid) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Invalid name: ${nameValidation.error}` },
          { status: 400 }
        );
      }
      updateData.name = nameValidation.sanitized;
    }

    if (description !== undefined) {
      if (description === null || description === '') {
        updateData.description = null;
      } else {
        const descValidation = validateString(description, MAX_LENGTHS.notes, { allowEmpty: true });
        if (!descValidation.valid) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: `Invalid description: ${descValidation.error}` },
            { status: 400 }
          );
        }
        updateData.description = descValidation.sanitized;
      }
    }

    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
      
      // If setting this program as active, deactivate all others
      if (is_active) {
        await supabase
          .from('saved_programs' as 'profiles')
          .update({ is_active: false } as never)
          .eq('user_id', user.id)
          .neq('id', id);
      }
    }

    if (plan_data !== undefined) {
      updateData.plan_data = plan_data;
    }

    // Update program
    const { data, error } = await supabase
      .from('saved_programs' as 'profiles')
      .update(updateData as never)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating program:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update program' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Program PATCH error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/programs/[id]
 * Delete a program
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

    // Delete program
    const { error } = await supabase
      .from('saved_programs' as 'profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting program:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete program' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Program deleted successfully',
    });
  } catch (error) {
    console.error('Program DELETE error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
