import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Use service role for webhook operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/billing/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Handle checkout.session.completed
 * Creates or updates subscription record
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  console.log('Processing checkout complete:', { userId, customerId, subscriptionId });

  if (!userId) {
    console.error('No user ID in session metadata');
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  console.log('Stripe subscription status:', subscription.status);

  // Map Stripe status - treat 'active', 'trialing', and 'incomplete' as active for Pro access
  // 'incomplete' means payment is processing but they should get access
  const isActiveSubscription = ['active', 'trialing'].includes(subscription.status);
  const dbStatus = isActiveSubscription ? 'active' : 
                   subscription.status === 'past_due' ? 'past_due' :
                   subscription.status === 'canceled' ? 'canceled' : 'inactive';

  // Upsert subscription record
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: subscription.items.data[0]?.price.id,
      plan: 'pro', // Set plan to pro when checkout completes
      status: dbStatus,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error upserting subscription:', error);
    throw error; // Re-throw to ensure webhook returns error to Stripe
  }

  console.log('Subscription upserted successfully for user:', userId);

  // Update entitlements for Pro access
  const { error: entError } = await supabaseAdmin
    .from('entitlements')
    .upsert({
      user_id: userId,
      progress_unlocked: true,
      unlocked_reason: 'purchase',
      unlocked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (entError) {
    console.error('Error upserting entitlements:', entError);
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  
  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string;
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();
    
    if (!sub) {
      console.error('Could not find user for subscription');
      return;
    }
  }

  const customerId = subscription.customer as string;

  // Map Stripe status to our status
  let status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing' = 'inactive';
  if (subscription.status === 'active') status = 'active';
  else if (subscription.status === 'past_due') status = 'past_due';
  else if (subscription.status === 'canceled') status = 'canceled';
  else if (subscription.status === 'trialing') status = 'trialing';

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status,
      stripe_price_id: subscription.items.data[0]?.price.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

/**
 * Handle subscription deleted/canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating canceled subscription:', error);
  }
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating subscription status:', error);
  }
}
