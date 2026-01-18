import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import Stripe from 'stripe';
import type { ApiResponse } from '@/types/api';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Subscription tier limits (internal use only)
const TIER_LIMITS = {
  free: {
    workoutsPerMonth: 45,
    aiTokensPerMonth: 0,
    progressAccess: false, // Unless earned via 10 workouts
  },
  pro: {
    workoutsPerMonth: 90,
    aiTokensPerMonth: 3,
    progressAccess: true,
  },
} as const;

interface SubscriptionStatus {
  tier: 'free' | 'pro';
  status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing';
  limits: typeof TIER_LIMITS.free | typeof TIER_LIMITS.pro;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  workoutsUsedThisMonth: number;
  workoutsRemaining: number;
  aiTokensUsedThisMonth: number;
  aiTokensRemaining: number;
  canCreateWorkout: boolean;
  canUseAI: boolean;
}

// Get current month key in YYYY-MM format (UTC)
function getMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * GET /api/billing/subscription
 * Get user's subscription status and usage
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

    // Get subscription record
    const { data: subscriptionData } = await supabase
      .from('subscriptions' as 'profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const subscription = subscriptionData as {
      status: string;
      current_period_end: string;
      cancel_at_period_end: boolean;
    } | null;

    // Determine tier
    const isPro = subscription?.status === 'active' || subscription?.status === 'trialing';
    const tier = isPro ? 'pro' : 'free';
    const limits = TIER_LIMITS[tier];

    // Get current month usage
    const monthKey = getMonthKey();

    // Get workout usage
    let workoutsUsed = 0;
    try {
      const { data: usageData } = await supabase
        .from('usage_limits' as 'profiles')
        .select('workouts_logged')
        .eq('user_id', user.id)
        .eq('month_key', monthKey)
        .single();

      if (usageData) {
        workoutsUsed = (usageData as { workouts_logged: number }).workouts_logged || 0;
      }
    } catch {
      // No usage record yet
    }

    // Get AI token usage
    let aiTokensUsed = 0;
    try {
      const { data: aiData } = await supabase
        .from('ai_usage_counters' as 'profiles')
        .select('count')
        .eq('user_id', user.id)
        .eq('month_key', monthKey)
        .single();

      if (aiData) {
        aiTokensUsed = (aiData as { count: number }).count || 0;
      }
    } catch {
      // No AI usage record yet
    }

    const response: SubscriptionStatus = {
      tier,
      status: (subscription?.status as SubscriptionStatus['status']) || 'inactive',
      limits,
      currentPeriodEnd: subscription?.current_period_end || null,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
      workoutsUsedThisMonth: workoutsUsed,
      workoutsRemaining: Math.max(0, limits.workoutsPerMonth - workoutsUsed),
      aiTokensUsedThisMonth: aiTokensUsed,
      aiTokensRemaining: Math.max(0, limits.aiTokensPerMonth - aiTokensUsed),
      canCreateWorkout: workoutsUsed < limits.workoutsPerMonth,
      canUseAI: isPro && aiTokensUsed < limits.aiTokensPerMonth,
    };

    return NextResponse.json<ApiResponse<SubscriptionStatus>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/subscription
 * Cancel subscription at period end
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
    const rateLimit = checkRateLimit(`billing:${user.id}`, RATE_LIMITS.payment);
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Get subscription record
    const { data: subscriptionData } = await supabase
      .from('subscriptions' as 'profiles')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    const subscription = subscriptionData as { stripe_subscription_id: string } | null;

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No active subscription found' },
        { status: 400 }
      );
    }

    if (action === 'cancel') {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Subscription will be canceled at the end of the billing period',
      });
    } else if (action === 'reactivate') {
      // Reactivate canceled subscription
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: false,
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Subscription reactivated',
      });
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Subscription action error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
