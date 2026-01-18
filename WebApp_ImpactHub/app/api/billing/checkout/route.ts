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

// Pro plan price ID from Stripe
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;

/**
 * POST /api/billing/checkout
 * Create a Stripe Checkout session for Pro subscription
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

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || !PRO_PRICE_ID) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions' as 'profiles')
      .select('status, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    const subscription = existingSub as { status: string; stripe_customer_id: string } | null;

    if (subscription?.status === 'active') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You already have an active Pro subscription' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/settings?tab=billing&success=true`,
      cancel_url: `${origin}/dashboard/settings?tab=billing&canceled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
      },
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
