-- ============================================================================
-- ImpactHub / LiftLog+ Row Level Security Policies
-- Phase 2: Database Security with Supabase RLS
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can view other users' public profile info (username, avatar)
CREATE POLICY "Users can view public profiles"
    ON public.profiles
    FOR SELECT
    USING (true); -- All profiles are publicly viewable for now

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- New users can insert their profile (handled by trigger typically)
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- WORKOUTS POLICIES
-- ============================================================================

-- Users can view their own workouts
CREATE POLICY "Users can view own workouts"
    ON public.workouts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create workouts for themselves
CREATE POLICY "Users can create own workouts"
    ON public.workouts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own workouts
CREATE POLICY "Users can update own workouts"
    ON public.workouts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own workouts
CREATE POLICY "Users can delete own workouts"
    ON public.workouts
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- WORKOUT EXERCISES POLICIES
-- ============================================================================

-- Users can view exercises from their own workouts
CREATE POLICY "Users can view own workout exercises"
    ON public.workout_exercises
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = workout_exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

-- Users can create exercises in their own workouts
CREATE POLICY "Users can create own workout exercises"
    ON public.workout_exercises
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = workout_exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

-- Users can update exercises in their own workouts
CREATE POLICY "Users can update own workout exercises"
    ON public.workout_exercises
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = workout_exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

-- Users can delete exercises from their own workouts
CREATE POLICY "Users can delete own workout exercises"
    ON public.workout_exercises
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = workout_exercises.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

-- ============================================================================
-- SETS POLICIES
-- ============================================================================

-- Users can view sets from their own exercises
CREATE POLICY "Users can view own sets"
    ON public.sets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workout_exercises we
            JOIN public.workouts w ON w.id = we.workout_id
            WHERE we.id = sets.workout_exercise_id
            AND w.user_id = auth.uid()
        )
    );

-- Users can create sets in their own exercises
CREATE POLICY "Users can create own sets"
    ON public.sets
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workout_exercises we
            JOIN public.workouts w ON w.id = we.workout_id
            WHERE we.id = sets.workout_exercise_id
            AND w.user_id = auth.uid()
        )
    );

-- Users can update their own sets
CREATE POLICY "Users can update own sets"
    ON public.sets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workout_exercises we
            JOIN public.workouts w ON w.id = we.workout_id
            WHERE we.id = sets.workout_exercise_id
            AND w.user_id = auth.uid()
        )
    );

-- Users can delete their own sets
CREATE POLICY "Users can delete own sets"
    ON public.sets
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workout_exercises we
            JOIN public.workouts w ON w.id = we.workout_id
            WHERE we.id = sets.workout_exercise_id
            AND w.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PROGRAM TEMPLATES POLICIES
-- ============================================================================

-- Users can view their own templates and public templates
CREATE POLICY "Users can view own and public program templates"
    ON public.program_templates
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR is_public = true
    );

-- Users can create their own templates
CREATE POLICY "Users can create own program templates"
    ON public.program_templates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own program templates"
    ON public.program_templates
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own program templates"
    ON public.program_templates
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- PROGRAM WORKOUTS POLICIES
-- ============================================================================

-- Users can view workouts from their own templates or public templates
CREATE POLICY "Users can view accessible program workouts"
    ON public.program_workouts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.program_templates pt
            WHERE pt.id = program_workouts.program_id
            AND (pt.user_id = auth.uid() OR pt.is_public = true)
        )
    );

-- Users can create workouts in their own templates
CREATE POLICY "Users can create own program workouts"
    ON public.program_workouts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.program_templates pt
            WHERE pt.id = program_workouts.program_id
            AND pt.user_id = auth.uid()
        )
    );

-- Users can update workouts in their own templates
CREATE POLICY "Users can update own program workouts"
    ON public.program_workouts
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_templates pt
            WHERE pt.id = program_workouts.program_id
            AND pt.user_id = auth.uid()
        )
    );

-- Users can delete workouts from their own templates
CREATE POLICY "Users can delete own program workouts"
    ON public.program_workouts
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_templates pt
            WHERE pt.id = program_workouts.program_id
            AND pt.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PROGRAM EXERCISES POLICIES
-- ============================================================================

-- Users can view exercises from accessible program workouts
CREATE POLICY "Users can view accessible program exercises"
    ON public.program_exercises
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.program_workouts pw
            JOIN public.program_templates pt ON pt.id = pw.program_id
            WHERE pw.id = program_exercises.program_workout_id
            AND (pt.user_id = auth.uid() OR pt.is_public = true)
        )
    );

-- Users can manage exercises in their own program workouts
CREATE POLICY "Users can create own program exercises"
    ON public.program_exercises
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.program_workouts pw
            JOIN public.program_templates pt ON pt.id = pw.program_id
            WHERE pw.id = program_exercises.program_workout_id
            AND pt.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own program exercises"
    ON public.program_exercises
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_workouts pw
            JOIN public.program_templates pt ON pt.id = pw.program_id
            WHERE pw.id = program_exercises.program_workout_id
            AND pt.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own program exercises"
    ON public.program_exercises
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.program_workouts pw
            JOIN public.program_templates pt ON pt.id = pw.program_id
            WHERE pw.id = program_exercises.program_workout_id
            AND pt.user_id = auth.uid()
        )
    );

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Users can only view their own subscription
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert/update subscriptions (handled by webhooks)
-- No INSERT/UPDATE/DELETE policies for regular users

-- ============================================================================
-- AUDIT LOGS POLICIES
-- ============================================================================

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert audit logs (no user INSERT policy)

-- ============================================================================
-- USER SETTINGS POLICIES
-- ============================================================================

-- Users can view their own settings
CREATE POLICY "Users can view own settings"
    ON public.user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own settings
CREATE POLICY "Users can create own settings"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
    ON public.user_settings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- EXERCISE LIBRARY POLICIES
-- ============================================================================

-- Everyone can view the exercise library (read-only for users)
CREATE POLICY "Everyone can view exercise library"
    ON public.exercise_library
    FOR SELECT
    USING (true);

-- Only service role can manage exercise library (no user INSERT/UPDATE/DELETE)

-- ============================================================================
-- PERSONAL RECORDS POLICIES
-- ============================================================================

-- Users can view their own PRs
CREATE POLICY "Users can view own personal records"
    ON public.personal_records
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own PRs
CREATE POLICY "Users can create own personal records"
    ON public.personal_records
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own PRs
CREATE POLICY "Users can update own personal records"
    ON public.personal_records
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own PRs
CREATE POLICY "Users can delete own personal records"
    ON public.personal_records
    FOR DELETE
    USING (auth.uid() = user_id);
