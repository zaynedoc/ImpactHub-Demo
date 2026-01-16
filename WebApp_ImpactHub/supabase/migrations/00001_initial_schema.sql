-- ============================================================================
-- ImpactHub / LiftLog+ Database Schema
-- Phase 2: Database Design with Supabase PostgreSQL
-- ============================================================================

-- Note: Using gen_random_uuid() which is built into PostgreSQL 13+
-- No extension needed for UUID generation in Supabase

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles: User profile information (linked to Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
    CONSTRAINT full_name_length CHECK (char_length(full_name) <= 100),
    CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

COMMENT ON TABLE public.profiles IS 'User profile data, linked to Supabase auth.users';
COMMENT ON COLUMN public.profiles.username IS 'Unique username (alphanumeric and underscores only)';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image (stored in Supabase Storage)';

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ----------------------------------------------------------------------------
-- workouts: Individual workout sessions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workouts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT,
    workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INTEGER,
    status TEXT DEFAULT 'completed' CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
    CONSTRAINT notes_length CHECK (char_length(notes) <= 1000),
    CONSTRAINT duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

COMMENT ON TABLE public.workouts IS 'Individual workout sessions logged by users';
COMMENT ON COLUMN public.workouts.status IS 'Workout status: planned, in_progress, completed, or skipped';
COMMENT ON COLUMN public.workouts.duration_minutes IS 'Total workout duration in minutes';

-- Indexes for workouts
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON public.workouts(workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON public.workouts(user_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_status ON public.workouts(status);

-- ----------------------------------------------------------------------------
-- workout_exercises: Exercises within a workout
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_exercises (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT exercise_name_length CHECK (char_length(exercise_name) >= 1 AND char_length(exercise_name) <= 100),
    CONSTRAINT notes_length CHECK (char_length(notes) <= 500),
    CONSTRAINT order_non_negative CHECK (order_index >= 0)
);

COMMENT ON TABLE public.workout_exercises IS 'Individual exercises within a workout session';
COMMENT ON COLUMN public.workout_exercises.order_index IS 'Order of exercise within the workout (0-indexed)';

-- Indexes for workout_exercises
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON public.workout_exercises(workout_id, order_index);

-- ----------------------------------------------------------------------------
-- sets: Individual sets for each exercise
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sets (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL DEFAULT 1,
    weight DECIMAL(7,2) NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    rir INTEGER, -- Reps In Reserve (0-10, null if not tracked)
    rpe DECIMAL(3,1), -- Rate of Perceived Exertion (1-10)
    is_warmup BOOLEAN DEFAULT FALSE,
    is_dropset BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT set_number_positive CHECK (set_number > 0),
    CONSTRAINT weight_non_negative CHECK (weight >= 0),
    CONSTRAINT reps_non_negative CHECK (reps >= 0),
    CONSTRAINT rir_range CHECK (rir IS NULL OR (rir >= 0 AND rir <= 10)),
    CONSTRAINT rpe_range CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
    CONSTRAINT notes_length CHECK (char_length(notes) <= 200)
);

COMMENT ON TABLE public.sets IS 'Individual sets within an exercise';
COMMENT ON COLUMN public.sets.weight IS 'Weight in pounds or kilograms (user preference)';
COMMENT ON COLUMN public.sets.rir IS 'Reps In Reserve - how many more reps could have been performed';
COMMENT ON COLUMN public.sets.rpe IS 'Rate of Perceived Exertion (1-10 scale)';

-- Indexes for sets
CREATE INDEX IF NOT EXISTS idx_sets_workout_exercise_id ON public.sets(workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_sets_order ON public.sets(workout_exercise_id, set_number);

-- ============================================================================
-- PREMIUM/PROGRAM TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- program_templates: Reusable workout program templates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.program_templates (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    weeks INTEGER DEFAULT 4,
    days_per_week INTEGER DEFAULT 3,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category TEXT CHECK (category IN ('strength', 'hypertrophy', 'endurance', 'powerlifting', 'bodybuilding', 'general')),
    is_public BOOLEAN DEFAULT FALSE,
    times_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    CONSTRAINT description_length CHECK (char_length(description) <= 1000),
    CONSTRAINT weeks_positive CHECK (weeks > 0 AND weeks <= 52),
    CONSTRAINT days_per_week_valid CHECK (days_per_week > 0 AND days_per_week <= 7)
);

COMMENT ON TABLE public.program_templates IS 'Reusable workout program templates that can be shared';
COMMENT ON COLUMN public.program_templates.is_public IS 'Whether the template is visible to other users';
COMMENT ON COLUMN public.program_templates.times_used IS 'How many times this template has been copied/used';

-- Indexes for program_templates
CREATE INDEX IF NOT EXISTS idx_program_templates_user_id ON public.program_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_program_templates_public ON public.program_templates(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_program_templates_category ON public.program_templates(category);

-- ----------------------------------------------------------------------------
-- program_workouts: Workouts within a program template
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.program_workouts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.program_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    week_number INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    CONSTRAINT day_number_valid CHECK (day_number >= 1 AND day_number <= 7),
    CONSTRAINT week_number_positive CHECK (week_number >= 1)
);

COMMENT ON TABLE public.program_workouts IS 'Individual workout templates within a program';

-- Indexes for program_workouts
CREATE INDEX IF NOT EXISTS idx_program_workouts_program_id ON public.program_workouts(program_id);
CREATE INDEX IF NOT EXISTS idx_program_workouts_order ON public.program_workouts(program_id, week_number, day_number);

-- ----------------------------------------------------------------------------
-- program_exercises: Exercises within a program workout
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.program_exercises (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_workout_id UUID NOT NULL REFERENCES public.program_workouts(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    target_sets INTEGER DEFAULT 3,
    target_reps TEXT DEFAULT '8-12', -- Can be a range like "8-12" or single number
    rest_seconds INTEGER DEFAULT 90,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT exercise_name_length CHECK (char_length(exercise_name) >= 1 AND char_length(exercise_name) <= 100),
    CONSTRAINT target_reps_length CHECK (char_length(target_reps) <= 20),
    CONSTRAINT target_sets_positive CHECK (target_sets > 0),
    CONSTRAINT rest_positive CHECK (rest_seconds IS NULL OR rest_seconds > 0)
);

COMMENT ON TABLE public.program_exercises IS 'Exercise templates within a program workout';

-- Indexes for program_exercises
CREATE INDEX IF NOT EXISTS idx_program_exercises_workout_id ON public.program_exercises(program_workout_id);

-- ============================================================================
-- SUBSCRIPTION/BILLING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- subscriptions: User subscription status (for premium features)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'lifetime')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.subscriptions IS 'User subscription information synced with Stripe';
COMMENT ON COLUMN public.subscriptions.plan IS 'Subscription tier: free, pro, or lifetime';
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at the end of the current period';

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ============================================================================
-- AUDIT/LOGGING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- audit_logs: Security and activity logging
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT event_type_length CHECK (char_length(event_type) <= 100),
    CONSTRAINT user_agent_length CHECK (char_length(user_agent) <= 500)
);

COMMENT ON TABLE public.audit_logs IS 'Security and activity audit trail';
COMMENT ON COLUMN public.audit_logs.event_type IS 'Type of event: login, logout, payment, workout_created, etc.';
COMMENT ON COLUMN public.audit_logs.event_data IS 'Additional JSON data about the event';

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Partitioning hint: For production, consider partitioning audit_logs by created_at

-- ============================================================================
-- USER PREFERENCES/SETTINGS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- user_settings: User preferences and settings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_weekly_summary BOOLEAN DEFAULT TRUE,
    email_workout_reminders BOOLEAN DEFAULT TRUE,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.user_settings IS 'User preferences and application settings';

-- Indexes for user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- ============================================================================
-- EXERCISE LIBRARY (Optional enhancement)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- exercise_library: Master list of exercises with metadata
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercise_library (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT CHECK (category IN ('chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full_body', 'other')),
    equipment TEXT CHECK (equipment IN ('barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands', 'other', 'none')),
    primary_muscles TEXT[],
    secondary_muscles TEXT[],
    instructions TEXT,
    is_compound BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.exercise_library IS 'Master library of exercises with metadata';

-- Indexes for exercise_library
CREATE INDEX IF NOT EXISTS idx_exercise_library_name ON public.exercise_library(name);
CREATE INDEX IF NOT EXISTS idx_exercise_library_category ON public.exercise_library(category);
CREATE INDEX IF NOT EXISTS idx_exercise_library_equipment ON public.exercise_library(equipment);

-- ============================================================================
-- PERSONAL RECORDS (PRs)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- personal_records: Track user PRs for exercises
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.personal_records (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    weight DECIMAL(7,2) NOT NULL,
    reps INTEGER NOT NULL DEFAULT 1,
    one_rep_max_estimate DECIMAL(7,2), -- Calculated 1RM
    set_id UUID REFERENCES public.sets(id) ON DELETE SET NULL,
    achieved_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT weight_positive CHECK (weight > 0),
    CONSTRAINT reps_positive CHECK (reps > 0)
);

COMMENT ON TABLE public.personal_records IS 'Personal record (PR) tracking for exercises';
COMMENT ON COLUMN public.personal_records.one_rep_max_estimate IS 'Estimated 1RM using Epley formula';

-- Indexes for personal_records
CREATE INDEX IF NOT EXISTS idx_personal_records_user_id ON public.personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON public.personal_records(user_id, exercise_name);
CREATE INDEX IF NOT EXISTS idx_personal_records_date ON public.personal_records(achieved_at DESC);

-- Unique constraint to prevent duplicate PRs for same exercise/reps combo
CREATE UNIQUE INDEX IF NOT EXISTS idx_personal_records_unique 
    ON public.personal_records(user_id, exercise_name, reps);
