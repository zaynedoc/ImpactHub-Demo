-- ============================================================================
-- ImpactHub / LiftLog+ Pro Subscription & Programs Schema
-- Phase 6.5: Stripe Subscriptions and Saved Programs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- subscriptions: Track Stripe subscription status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

COMMENT ON TABLE public.subscriptions IS 'Stripe subscription tracking for Pro users';
COMMENT ON COLUMN public.subscriptions.status IS 'Subscription status: active, inactive, past_due, canceled, trialing';

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ----------------------------------------------------------------------------
-- saved_programs: User's saved workout programs (from AI or manual creation)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    weeks INTEGER DEFAULT 4,
    days_per_week INTEGER NOT NULL,
    goal TEXT, -- strength, hypertrophy, endurance, weight_loss, general_fitness
    experience_level TEXT, -- beginner, intermediate, advanced
    equipment TEXT, -- full_gym, home_basic, bodyweight_only, dumbbells_only
    source TEXT DEFAULT 'manual' CHECK (source IN ('ai', 'manual', 'template')),
    is_active BOOLEAN DEFAULT FALSE, -- Currently following this program
    plan_data JSONB NOT NULL, -- Full program structure with workouts
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT name_length CHECK (char_length(name) <= 100),
    CONSTRAINT description_length CHECK (char_length(description) <= 500)
);

COMMENT ON TABLE public.saved_programs IS 'Saved workout programs for users';
COMMENT ON COLUMN public.saved_programs.plan_data IS 'JSON structure containing workout days and exercises';
COMMENT ON COLUMN public.saved_programs.is_active IS 'Whether user is currently following this program';

-- Indexes for saved_programs
CREATE INDEX IF NOT EXISTS idx_saved_programs_user_id ON public.saved_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_programs_active ON public.saved_programs(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_saved_programs_created ON public.saved_programs(created_at DESC);

-- ----------------------------------------------------------------------------
-- usage_limits: Track monthly usage for workout limits
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_limits (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month_key TEXT NOT NULL, -- Format: YYYY-MM
    workouts_logged INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    PRIMARY KEY (user_id, month_key),
    CONSTRAINT workouts_non_negative CHECK (workouts_logged >= 0)
);

COMMENT ON TABLE public.usage_limits IS 'Monthly usage tracking for workout limits';

-- Index for usage_limits
CREATE INDEX IF NOT EXISTS idx_usage_limits_lookup ON public.usage_limits(user_id, month_key);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies (users can only view their own)
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Subscriptions are managed by webhooks/server only (no direct user insert/update)

-- Saved Programs policies
DROP POLICY IF EXISTS "Users can view own programs" ON public.saved_programs;
CREATE POLICY "Users can view own programs"
    ON public.saved_programs
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own programs" ON public.saved_programs;
CREATE POLICY "Users can create own programs"
    ON public.saved_programs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own programs" ON public.saved_programs;
CREATE POLICY "Users can update own programs"
    ON public.saved_programs
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own programs" ON public.saved_programs;
CREATE POLICY "Users can delete own programs"
    ON public.saved_programs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Usage Limits policies
DROP POLICY IF EXISTS "Users can view own usage limits" ON public.usage_limits;
CREATE POLICY "Users can view own usage limits"
    ON public.usage_limits
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage limits" ON public.usage_limits;
CREATE POLICY "Users can insert own usage limits"
    ON public.usage_limits
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own usage limits" ON public.usage_limits;
CREATE POLICY "Users can update own usage limits"
    ON public.usage_limits
    FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTION: Increment workout count on new workout
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_workout_count()
RETURNS TRIGGER AS $$
DECLARE
    current_month TEXT;
BEGIN
    -- Get current month key
    current_month := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM');
    
    -- Upsert the usage count
    INSERT INTO public.usage_limits (user_id, month_key, workouts_logged, updated_at)
    VALUES (NEW.user_id, current_month, 1, NOW())
    ON CONFLICT (user_id, month_key)
    DO UPDATE SET 
        workouts_logged = public.usage_limits.workouts_logged + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment workout count
DROP TRIGGER IF EXISTS trigger_increment_workout_count ON public.workouts;
CREATE TRIGGER trigger_increment_workout_count
    AFTER INSERT ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_workout_count();

-- ============================================================================
-- FUNCTION: Decrement workout count on workout delete
-- ============================================================================
CREATE OR REPLACE FUNCTION public.decrement_workout_count()
RETURNS TRIGGER AS $$
DECLARE
    current_month TEXT;
BEGIN
    -- Get current month key
    current_month := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM');
    
    -- Only decrement if deleting a workout from current month
    UPDATE public.usage_limits
    SET workouts_logged = GREATEST(0, workouts_logged - 1),
        updated_at = NOW()
    WHERE user_id = OLD.user_id 
    AND month_key = current_month;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to decrement workout count
DROP TRIGGER IF EXISTS trigger_decrement_workout_count ON public.workouts;
CREATE TRIGGER trigger_decrement_workout_count
    AFTER DELETE ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_workout_count();
