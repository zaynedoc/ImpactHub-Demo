import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS, AI_LIMITS } from '@/lib/rate-limit';
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

interface AIUsageResponse {
  used: number;
  limit: number;
  remaining: number;
  monthKey: string;
  canGenerate: boolean;
}

/**
 * GET /api/ai/usage
 * Get user's AI plan generation usage for the current month
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

    // Get current month usage
    const monthKey = getMonthKey();

    const { data: usageData } = await supabase
      .from('ai_usage_counters' as 'profiles') // Type workaround
      .select('count')
      .eq('user_id', user.id)
      .eq('month_key', monthKey)
      .single();

    const used = (usageData as { count: number } | null)?.count || 0;
    const remaining = Math.max(0, AI_LIMITS.plansPerMonth - used);

    const response: AIUsageResponse = {
      used,
      limit: AI_LIMITS.plansPerMonth,
      remaining,
      monthKey,
      canGenerate: remaining > 0,
    };

    return NextResponse.json<ApiResponse<AIUsageResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('AI usage check error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
