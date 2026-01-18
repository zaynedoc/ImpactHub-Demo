-- ============================================================================
-- COMPLETE DATA WIPE SCRIPT FOR IMPACTHUB
-- Run this in Supabase SQL Editor to delete all user data
-- ============================================================================

-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- 5. This will delete ALL data from all tables (but keep the table structures)

-- ============================================================================
-- DELETE ALL DATA (in correct order due to foreign key constraints)
-- ============================================================================

-- Delete personal records first (references sets)
DELETE FROM public.personal_records;

-- Delete sets (references workout_exercises)
DELETE FROM public.sets;

-- Delete workout_exercises (references workouts)
DELETE FROM public.workout_exercises;

-- Delete workouts (references profiles)
DELETE FROM public.workouts;

-- Delete program_exercises (references program_workouts)
DELETE FROM public.program_exercises;

-- Delete program_workouts (references program_templates)
DELETE FROM public.program_workouts;

-- Delete program_templates (references profiles)
DELETE FROM public.program_templates;

-- Delete subscriptions (references profiles)
DELETE FROM public.subscriptions;

-- Delete user_settings (references profiles)
DELETE FROM public.user_settings;

-- Delete audit_logs (references profiles, but SET NULL on delete)
DELETE FROM public.audit_logs;

-- Delete exercise_library (standalone table)
DELETE FROM public.exercise_library;

-- ============================================================================
-- OPTIONAL: Delete profile data (keeps auth user, just clears profile info)
-- ============================================================================
-- Uncomment the line below if you want to clear profile data too
-- (username, full_name, bio, avatar_url)
-- Note: This does NOT delete the auth user, just clears profile fields

-- UPDATE public.profiles SET username = NULL, full_name = NULL, bio = NULL, avatar_url = NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after the delete to confirm everything is empty
-- ============================================================================

SELECT 'workouts' as table_name, COUNT(*) as row_count FROM public.workouts
UNION ALL
SELECT 'workout_exercises', COUNT(*) FROM public.workout_exercises
UNION ALL
SELECT 'sets', COUNT(*) FROM public.sets
UNION ALL
SELECT 'personal_records', COUNT(*) FROM public.personal_records
UNION ALL
SELECT 'program_templates', COUNT(*) FROM public.program_templates
UNION ALL
SELECT 'program_workouts', COUNT(*) FROM public.program_workouts
UNION ALL
SELECT 'program_exercises', COUNT(*) FROM public.program_exercises
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM public.subscriptions
UNION ALL
SELECT 'user_settings', COUNT(*) FROM public.user_settings
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM public.audit_logs
UNION ALL
SELECT 'exercise_library', COUNT(*) FROM public.exercise_library
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles;

-- ============================================================================
-- DONE! All data has been wiped.
-- Your account still exists but all workout data is gone.
-- ============================================================================
