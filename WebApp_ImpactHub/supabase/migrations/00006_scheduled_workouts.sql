-- ============================================================================
-- ImpactHub / LiftLog+ Scheduled Workouts Schema
-- Phase 6.6: Program Calendar Integration
-- ============================================================================

-- ----------------------------------------------------------------------------
-- scheduled_workouts: Planned workouts from applied programs
-- These appear on the calendar and can be started/completed
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scheduled_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    program_id UUID REFERENCES public.saved_programs(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    workout_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped')),
    notes TEXT,
    scheduled_exercises JSONB, -- Planned exercises from program
    completed_workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL, -- Link to actual workout when completed
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT title_length CHECK (char_length(title) <= 200)
);

COMMENT ON TABLE public.scheduled_workouts IS 'Scheduled workouts from applied programs';
COMMENT ON COLUMN public.scheduled_workouts.scheduled_exercises IS 'JSON array of planned exercises from the program';
COMMENT ON COLUMN public.scheduled_workouts.completed_workout_id IS 'Links to the actual workout record if completed';

-- Indexes for scheduled_workouts
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_user_id ON public.scheduled_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_date ON public.scheduled_workouts(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_program ON public.scheduled_workouts(program_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_status ON public.scheduled_workouts(user_id, status);

-- ============================================================================
-- RLS POLICIES for scheduled_workouts
-- ============================================================================

-- Enable RLS
ALTER TABLE public.scheduled_workouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own scheduled workouts
DROP POLICY IF EXISTS "Users can view own scheduled workouts" ON public.scheduled_workouts;
CREATE POLICY "Users can view own scheduled workouts"
    ON public.scheduled_workouts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own scheduled workouts
DROP POLICY IF EXISTS "Users can create own scheduled workouts" ON public.scheduled_workouts;
CREATE POLICY "Users can create own scheduled workouts"
    ON public.scheduled_workouts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own scheduled workouts
DROP POLICY IF EXISTS "Users can update own scheduled workouts" ON public.scheduled_workouts;
CREATE POLICY "Users can update own scheduled workouts"
    ON public.scheduled_workouts
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own scheduled workouts
DROP POLICY IF EXISTS "Users can delete own scheduled workouts" ON public.scheduled_workouts;
CREATE POLICY "Users can delete own scheduled workouts"
    ON public.scheduled_workouts
    FOR DELETE
    USING (auth.uid() = user_id);
