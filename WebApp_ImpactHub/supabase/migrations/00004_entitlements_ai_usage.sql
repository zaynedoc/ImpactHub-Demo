-- ============================================================================
-- ImpactHub / LiftLog+ Entitlements & AI Usage Schema
-- Phase 6: Feature Entitlements and AI Plan Generation Tracking
-- ============================================================================

-- ----------------------------------------------------------------------------
-- entitlements: Track feature unlocks for users
-- Progress tab unlocks after 10 workouts or via purchase
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entitlements (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    progress_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_reason TEXT CHECK (unlocked_reason IN ('earned', 'purchase', 'admin')),
    unlocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.entitlements IS 'Feature entitlements for users (progress unlock, etc.)';
COMMENT ON COLUMN public.entitlements.progress_unlocked IS 'Whether user has unlocked progress tab';
COMMENT ON COLUMN public.entitlements.unlocked_reason IS 'How the feature was unlocked: earned (10 workouts), purchase, or admin';

-- Index for quick entitlement lookups
CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON public.entitlements(user_id);

-- ----------------------------------------------------------------------------
-- ai_plan_generations: Track AI workout plan generations
-- Used for rate limiting (60/month) and audit trail
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_plan_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month_key TEXT NOT NULL, -- Format: YYYY-MM (e.g., '2025-01')
    input_summary TEXT, -- Sanitized summary of user's input
    plan_data JSONB, -- The generated plan
    model TEXT DEFAULT 'gpt-4o-mini', -- OpenAI model used
    tokens_in INTEGER,
    tokens_out INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT input_summary_length CHECK (char_length(input_summary) <= 500)
);

COMMENT ON TABLE public.ai_plan_generations IS 'Track AI workout plan generations for usage limits';
COMMENT ON COLUMN public.ai_plan_generations.month_key IS 'Month identifier for usage counting (YYYY-MM format)';

-- Indexes for ai_plan_generations
CREATE INDEX IF NOT EXISTS idx_ai_plan_generations_user_id ON public.ai_plan_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_plan_generations_month ON public.ai_plan_generations(user_id, month_key);
CREATE INDEX IF NOT EXISTS idx_ai_plan_generations_created ON public.ai_plan_generations(created_at DESC);

-- ----------------------------------------------------------------------------
-- ai_usage_counters: Quick lookup for monthly usage counts
-- Avoids counting rows each time
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage_counters (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month_key TEXT NOT NULL, -- Format: YYYY-MM
    count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    PRIMARY KEY (user_id, month_key),
    
    CONSTRAINT count_non_negative CHECK (count >= 0)
);

COMMENT ON TABLE public.ai_usage_counters IS 'Monthly AI usage counters for rate limiting';

-- Index for quick counter lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_counters_lookup ON public.ai_usage_counters(user_id, month_key);

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_plan_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_counters ENABLE ROW LEVEL SECURITY;

-- Entitlements policies
DROP POLICY IF EXISTS "Users can view own entitlements" ON public.entitlements;
CREATE POLICY "Users can view own entitlements"
    ON public.entitlements
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users should NOT be able to directly modify entitlements (server-only)
-- Entitlements are modified by: API routes, webhooks, triggers

-- AI Plan Generations policies
DROP POLICY IF EXISTS "Users can view own AI plan generations" ON public.ai_plan_generations;
CREATE POLICY "Users can view own AI plan generations"
    ON public.ai_plan_generations
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own AI plan generations" ON public.ai_plan_generations;
CREATE POLICY "Users can create own AI plan generations"
    ON public.ai_plan_generations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- AI Usage Counters policies
DROP POLICY IF EXISTS "Users can view own AI usage counters" ON public.ai_usage_counters;
CREATE POLICY "Users can view own AI usage counters"
    ON public.ai_usage_counters
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert/update their own counters (for upsert from API)
DROP POLICY IF EXISTS "Users can insert own AI usage counters" ON public.ai_usage_counters;
CREATE POLICY "Users can insert own AI usage counters"
    ON public.ai_usage_counters
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own AI usage counters" ON public.ai_usage_counters;
CREATE POLICY "Users can update own AI usage counters"
    ON public.ai_usage_counters
    FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTION: Auto-unlock progress after 10 workouts
-- This is called by a trigger whenever a workout is inserted
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_progress_unlock()
RETURNS TRIGGER AS $$
DECLARE
    workout_count INTEGER;
BEGIN
    -- Count user's total workouts
    SELECT COUNT(*) INTO workout_count
    FROM public.workouts
    WHERE user_id = NEW.user_id;
    
    -- If they have 10+ workouts, unlock progress (if not already)
    IF workout_count >= 10 THEN
        INSERT INTO public.entitlements (user_id, progress_unlocked, unlocked_reason, unlocked_at)
        VALUES (NEW.user_id, TRUE, 'earned', NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            progress_unlocked = TRUE,
            unlocked_reason = CASE 
                WHEN public.entitlements.unlocked_reason IS NULL THEN 'earned'
                ELSE public.entitlements.unlocked_reason
            END,
            unlocked_at = CASE 
                WHEN public.entitlements.unlocked_at IS NULL THEN NOW()
                ELSE public.entitlements.unlocked_at
            END,
            updated_at = NOW()
        WHERE public.entitlements.progress_unlocked = FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check progress unlock after workout insert
DROP TRIGGER IF EXISTS trigger_check_progress_unlock ON public.workouts;
CREATE TRIGGER trigger_check_progress_unlock
    AFTER INSERT ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.check_progress_unlock();

-- ============================================================================
-- FUNCTION: Increment AI usage counter
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID, p_month_key TEXT)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    INSERT INTO public.ai_usage_counters (user_id, month_key, count, updated_at)
    VALUES (p_user_id, p_month_key, 1, NOW())
    ON CONFLICT (user_id, month_key)
    DO UPDATE SET 
        count = public.ai_usage_counters.count + 1,
        updated_at = NOW()
    RETURNING count INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
