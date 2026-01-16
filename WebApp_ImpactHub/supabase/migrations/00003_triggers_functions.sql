-- ============================================================================
-- ImpactHub / LiftLog+ Database Triggers and Functions
-- Phase 2: Automation and Business Logic
-- ============================================================================
-- NOTE: This file is idempotent - safe to run multiple times

-- ============================================================================
-- TIMESTAMP MANAGEMENT
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (makes script idempotent)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_workouts_updated_at ON public.workouts;
DROP TRIGGER IF EXISTS update_program_templates_updated_at ON public.program_templates;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;

-- Apply updated_at trigger to all tables that have this column
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_program_templates_updated_at
    BEFORE UPDATE ON public.program_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- USER PROFILE MANAGEMENT
-- ============================================================================

-- Function to create profile and related records when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    -- Create free subscription record
    INSERT INTO public.subscriptions (user_id, plan, status)
    VALUES (NEW.id, 'free', 'active');
    
    -- Log the signup event
    INSERT INTO public.audit_logs (user_id, event_type, event_data)
    VALUES (
        NEW.id,
        'user_signup',
        jsonb_build_object(
            'email', NEW.email,
            'provider', NEW.raw_app_meta_data->>'provider'
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user deletion (cleanup)
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion event (before cascade delete removes the user_id reference)
    INSERT INTO public.audit_logs (user_id, event_type, event_data)
    VALUES (
        OLD.id,
        'user_deleted',
        jsonb_build_object('email', OLD.email)
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_deleted();

-- ============================================================================
-- PERSONAL RECORDS AUTOMATION
-- ============================================================================

-- Function to calculate estimated 1RM using Epley formula
CREATE OR REPLACE FUNCTION public.calculate_one_rep_max(weight DECIMAL, reps INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    IF reps = 1 THEN
        RETURN weight;
    ELSIF reps > 0 THEN
        -- Epley formula: 1RM = weight * (1 + reps/30)
        RETURN ROUND(weight * (1 + reps::DECIMAL / 30), 2);
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check and update personal records when a new set is created
CREATE OR REPLACE FUNCTION public.check_personal_record()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_exercise_name TEXT;
    v_estimated_1rm DECIMAL;
    v_current_pr_weight DECIMAL;
BEGIN
    -- Skip warmup sets
    IF NEW.is_warmup = TRUE THEN
        RETURN NEW;
    END IF;
    
    -- Get the user_id and exercise_name for this set
    SELECT w.user_id, we.exercise_name
    INTO v_user_id, v_exercise_name
    FROM public.workout_exercises we
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE we.id = NEW.workout_exercise_id;
    
    -- Calculate estimated 1RM
    v_estimated_1rm := public.calculate_one_rep_max(NEW.weight, NEW.reps);
    
    -- Check if this is a new PR for this rep range
    SELECT weight INTO v_current_pr_weight
    FROM public.personal_records
    WHERE user_id = v_user_id
    AND exercise_name = v_exercise_name
    AND reps = NEW.reps;
    
    IF v_current_pr_weight IS NULL THEN
        -- No existing PR for this rep range, create one
        INSERT INTO public.personal_records (
            user_id, exercise_name, weight, reps, 
            one_rep_max_estimate, set_id, achieved_at
        )
        VALUES (
            v_user_id, v_exercise_name, NEW.weight, NEW.reps,
            v_estimated_1rm, NEW.id, CURRENT_DATE
        );
    ELSIF NEW.weight > v_current_pr_weight THEN
        -- New PR! Update the record
        UPDATE public.personal_records
        SET 
            weight = NEW.weight,
            one_rep_max_estimate = v_estimated_1rm,
            set_id = NEW.id,
            achieved_at = CURRENT_DATE
        WHERE user_id = v_user_id
        AND exercise_name = v_exercise_name
        AND reps = NEW.reps;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check for PRs on new sets
DROP TRIGGER IF EXISTS check_pr_on_set_insert ON public.sets;
CREATE TRIGGER check_pr_on_set_insert
    AFTER INSERT ON public.sets
    FOR EACH ROW
    EXECUTE FUNCTION public.check_personal_record();

-- ============================================================================
-- PROGRAM TEMPLATE USAGE TRACKING
-- ============================================================================

-- Function to increment times_used when a template is copied/used
CREATE OR REPLACE FUNCTION public.increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.program_templates
    SET times_used = times_used + 1
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT LOGGING HELPERS
-- ============================================================================

-- Function to create an audit log entry (can be called from API routes)
CREATE OR REPLACE FUNCTION public.create_audit_log(
    p_user_id UUID,
    p_event_type TEXT,
    p_event_data JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (user_id, event_type, event_data, ip_address, user_agent)
    VALUES (p_user_id, p_event_type, p_event_data, p_ip_address, p_user_agent)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- WORKOUT STATISTICS HELPERS
-- ============================================================================

-- Function to get workout statistics for a user
CREATE OR REPLACE FUNCTION public.get_user_workout_stats(p_user_id UUID)
RETURNS TABLE (
    total_workouts BIGINT,
    workouts_this_week BIGINT,
    workouts_this_month BIGINT,
    current_streak INTEGER,
    longest_streak INTEGER,
    total_sets BIGINT,
    total_volume DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH workout_dates AS (
        SELECT DISTINCT workout_date
        FROM public.workouts
        WHERE user_id = p_user_id AND status = 'completed'
        ORDER BY workout_date DESC
    ),
    streak_calc AS (
        SELECT 
            workout_date,
            workout_date - (ROW_NUMBER() OVER (ORDER BY workout_date DESC))::INTEGER AS streak_group
        FROM workout_dates
    ),
    streaks AS (
        SELECT 
            COUNT(*) AS streak_length,
            MAX(workout_date) = CURRENT_DATE OR MAX(workout_date) = CURRENT_DATE - 1 AS is_current
        FROM streak_calc
        GROUP BY streak_group
    )
    SELECT 
        (SELECT COUNT(*) FROM public.workouts WHERE user_id = p_user_id AND status = 'completed')::BIGINT,
        (SELECT COUNT(*) FROM public.workouts 
         WHERE user_id = p_user_id AND status = 'completed' 
         AND workout_date >= DATE_TRUNC('week', CURRENT_DATE))::BIGINT,
        (SELECT COUNT(*) FROM public.workouts 
         WHERE user_id = p_user_id AND status = 'completed' 
         AND workout_date >= DATE_TRUNC('month', CURRENT_DATE))::BIGINT,
        COALESCE((SELECT streak_length::INTEGER FROM streaks WHERE is_current = TRUE LIMIT 1), 0),
        COALESCE((SELECT MAX(streak_length)::INTEGER FROM streaks), 0),
        (SELECT COUNT(*) FROM public.sets s
         JOIN public.workout_exercises we ON we.id = s.workout_exercise_id
         JOIN public.workouts w ON w.id = we.workout_id
         WHERE w.user_id = p_user_id)::BIGINT,
        COALESCE((SELECT SUM(s.weight * s.reps) FROM public.sets s
         JOIN public.workout_exercises we ON we.id = s.workout_exercise_id
         JOIN public.workouts w ON w.id = we.workout_id
         WHERE w.user_id = p_user_id), 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- VOLUME TRACKING HELPERS
-- ============================================================================

-- Function to get weekly volume for an exercise
CREATE OR REPLACE FUNCTION public.get_weekly_volume(
    p_user_id UUID,
    p_exercise_name TEXT,
    p_weeks_back INTEGER DEFAULT 12
)
RETURNS TABLE (
    week_start DATE,
    total_sets BIGINT,
    total_reps BIGINT,
    total_volume DECIMAL,
    max_weight DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('week', w.workout_date)::DATE AS week_start,
        COUNT(s.id)::BIGINT AS total_sets,
        SUM(s.reps)::BIGINT AS total_reps,
        SUM(s.weight * s.reps) AS total_volume,
        MAX(s.weight) AS max_weight
    FROM public.sets s
    JOIN public.workout_exercises we ON we.id = s.workout_exercise_id
    JOIN public.workouts w ON w.id = we.workout_id
    WHERE w.user_id = p_user_id
    AND LOWER(we.exercise_name) = LOWER(p_exercise_name)
    AND w.workout_date >= CURRENT_DATE - (p_weeks_back * 7)
    AND s.is_warmup = FALSE
    GROUP BY DATE_TRUNC('week', w.workout_date)
    ORDER BY week_start DESC;
END;
$$ LANGUAGE plpgsql STABLE;
