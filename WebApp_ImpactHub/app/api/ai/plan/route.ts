import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS, AI_LIMITS } from '@/lib/rate-limit';
import { validateString, MAX_LENGTHS } from '@/lib/validation';
import { generateWorkoutPlan, summarizeInput, type PlanGenerationInput } from '@/lib/openai';
import type { ApiResponse } from '@/types/api';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Get current month key in YYYY-MM format (UTC)
function getMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Valid options for input validation
const VALID_GOALS = ['strength', 'hypertrophy', 'endurance', 'weight_loss', 'general_fitness'] as const;
const VALID_EXPERIENCE = ['beginner', 'intermediate', 'advanced'] as const;
const VALID_DAYS = [2, 3, 4, 5, 6, 7] as const;
const VALID_EQUIPMENT = ['full_gym', 'home_basic', 'bodyweight_only', 'dumbbells_only'] as const;

/**
 * POST /api/ai/plan
 * Generate an AI workout plan
 * 
 * Rate limits:
 * - 5 requests per minute (burst protection)
 * - 99 generations per month (testing) / 2 per month (production)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Burst rate limiting (5 requests per minute)
    const burstLimit = checkRateLimit(
      `ai-plan:${user.id}`,
      RATE_LIMITS.aiPlanGeneration
    );
    if (!burstLimit.allowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    // 3. Check monthly usage limit
    const monthKey = getMonthKey();
    
    // Get current usage count (gracefully handle if table doesn't exist)
    let currentCount = 0;
    try {
      const { data: usageData, error: usageError } = await supabase
        .from('ai_usage_counters' as 'profiles') // Type workaround
        .select('count')
        .eq('user_id', user.id)
        .eq('month_key', monthKey)
        .single();

      if (!usageError && usageData) {
        currentCount = (usageData as { count: number }).count || 0;
      }
      // If no record exists, that's fine - count stays 0
    } catch (err) {
      console.warn('Could not check AI usage count:', err);
      // Continue with count = 0 if table doesn't exist yet
    }

    if (currentCount >= AI_LIMITS.plansPerMonth) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Monthly limit reached. You've used ${currentCount}/${AI_LIMITS.plansPerMonth} plan generations this month.`,
        },
        { status: 429 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const { goal, experienceLevel, daysPerWeek, equipment, focusAreas, limitations } = body;

    // Validate required fields
    if (!goal || !VALID_GOALS.includes(goal)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid or missing goal' },
        { status: 400 }
      );
    }


    if (!experienceLevel || !VALID_EXPERIENCE.includes(experienceLevel)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid or missing experience level' },
        { status: 400 }
      );
    }

    const daysNum = Number(daysPerWeek);
    if (!daysPerWeek || !(VALID_DAYS as readonly number[]).includes(daysNum)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid or missing days per week (must be 2-6)' },
        { status: 400 }
      );
    }

    if (!equipment || !VALID_EQUIPMENT.includes(equipment)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid or missing equipment' },
        { status: 400 }
      );
    }

    // Validate optional fields
    let sanitizedLimitations: string | undefined;
    if (limitations) {
      const limitValidation = validateString(limitations, MAX_LENGTHS.notes, { allowEmpty: true });
      if (!limitValidation.valid) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Invalid limitations: ${limitValidation.error}` },
          { status: 400 }
        );
      }
      sanitizedLimitations = limitValidation.sanitized || undefined;
    }

    // Validate focus areas (array of strings, max 5)
    let sanitizedFocusAreas: string[] | undefined;
    if (focusAreas && Array.isArray(focusAreas)) {
      sanitizedFocusAreas = focusAreas
        .slice(0, 5)
        .filter((area: unknown) => typeof area === 'string')
        .map((area: string) => area.trim().slice(0, 50));
    }

    // 5. Build input for OpenAI
    const input: PlanGenerationInput = {
      goal,
      experienceLevel,
      daysPerWeek: daysNum as 2 | 3 | 4 | 5 | 6,
      equipment,
      focusAreas: sanitizedFocusAreas,
      limitations: sanitizedLimitations,
    };

    // 6. Call OpenAI to generate the plan
    let result;
    try {
      result = await generateWorkoutPlan(input);
    } catch (error) {
      console.error('OpenAI generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for specific error types
      if (errorMessage.includes('API key')) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'AI service not configured. Please contact support.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to generate plan. Please try again.' },
        { status: 500 }
      );
    }

    const { plan, tokensIn, tokensOut, model } = result;

    // 7. Store the generation record (non-blocking - don't fail if DB not set up)
    const inputSummary = summarizeInput(input);

    try {
      const { error: insertError } = await supabase
        .from('ai_plan_generations' as 'profiles') // Type workaround
        .insert({
          user_id: user.id,
          month_key: monthKey,
          input_summary: inputSummary,
          plan_data: plan,
          model,
          tokens_in: tokensIn,
          tokens_out: tokensOut,
        } as never);

      if (insertError) {
        console.warn('Failed to store plan generation:', insertError);
      }
    } catch (err) {
      console.warn('Could not store plan generation record:', err);
    }

    // 8. Update usage counter (upsert, non-blocking)
    try {
      const { error: upsertError } = await supabase
        .from('ai_usage_counters' as 'profiles') // Type workaround
        .upsert(
          {
            user_id: user.id,
            month_key: monthKey,
            count: currentCount + 1,
            updated_at: new Date().toISOString(),
          } as never,
          { onConflict: 'user_id,month_key' }
        );

      if (upsertError) {
        console.warn('Failed to update usage counter:', upsertError);
      }
    } catch (err) {
      console.warn('Could not update usage counter:', err);
    }

    // 9. Return the generated plan
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        plan,
        usage: {
          used: currentCount + 1,
          limit: AI_LIMITS.plansPerMonth,
          remaining: AI_LIMITS.plansPerMonth - currentCount - 1,
        },
      },
    });
  } catch (error) {
    console.error('AI plan generation error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
