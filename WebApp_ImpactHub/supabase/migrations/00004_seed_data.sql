-- ============================================================================
-- ImpactHub / LiftLog+ Seed Data
-- Phase 2: Development and Demo Data
-- ============================================================================

-- ============================================================================
-- EXERCISE LIBRARY - Core exercises for the app
-- ============================================================================

INSERT INTO public.exercise_library (name, category, equipment, primary_muscles, secondary_muscles, instructions, is_compound) VALUES
-- Chest exercises
('Bench Press', 'chest', 'barbell', ARRAY['chest'], ARRAY['triceps', 'shoulders'], 'Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up.', true),
('Incline Bench Press', 'chest', 'barbell', ARRAY['upper chest'], ARRAY['triceps', 'shoulders'], 'Set bench to 30-45 degrees, grip bar, lower to upper chest, press up.', true),
('Dumbbell Bench Press', 'chest', 'dumbbell', ARRAY['chest'], ARRAY['triceps', 'shoulders'], 'Lie on bench with dumbbells at chest level, press up and together.', true),
('Incline Dumbbell Press', 'chest', 'dumbbell', ARRAY['upper chest'], ARRAY['triceps', 'shoulders'], 'Set bench to 30-45 degrees, press dumbbells up from chest level.', true),
('Cable Fly', 'chest', 'cable', ARRAY['chest'], ARRAY['shoulders'], 'Stand between cables, bring handles together in front of chest with slight bend in elbows.', false),
('Dumbbell Fly', 'chest', 'dumbbell', ARRAY['chest'], ARRAY['shoulders'], 'Lie on bench, lower dumbbells in arc motion to sides, bring back together.', false),
('Push-ups', 'chest', 'bodyweight', ARRAY['chest'], ARRAY['triceps', 'shoulders', 'core'], 'Start in plank position, lower body until chest nearly touches floor, push back up.', true),
('Dips (Chest)', 'chest', 'bodyweight', ARRAY['chest'], ARRAY['triceps', 'shoulders'], 'Lean forward on parallel bars, lower body with elbows flared, push back up.', true),

-- Back exercises
('Deadlift', 'back', 'barbell', ARRAY['lower back', 'glutes', 'hamstrings'], ARRAY['traps', 'forearms'], 'Stand with feet hip-width, grip bar, keep back straight, lift by extending hips and knees.', true),
('Barbell Row', 'back', 'barbell', ARRAY['lats', 'middle back'], ARRAY['biceps', 'rear delts'], 'Bend at hips, grip bar, pull to lower chest while keeping back straight.', true),
('Pull-ups', 'back', 'bodyweight', ARRAY['lats'], ARRAY['biceps', 'rear delts'], 'Hang from bar with overhand grip, pull body up until chin over bar.', true),
('Chin-ups', 'back', 'bodyweight', ARRAY['lats', 'biceps'], ARRAY['rear delts'], 'Hang from bar with underhand grip, pull body up until chin over bar.', true),
('Lat Pulldown', 'back', 'cable', ARRAY['lats'], ARRAY['biceps', 'rear delts'], 'Sit at machine, pull bar down to upper chest while keeping chest up.', true),
('Seated Cable Row', 'back', 'cable', ARRAY['middle back', 'lats'], ARRAY['biceps', 'rear delts'], 'Sit at machine, pull handle to midsection, squeeze shoulder blades.', true),
('Dumbbell Row', 'back', 'dumbbell', ARRAY['lats', 'middle back'], ARRAY['biceps', 'rear delts'], 'Place one hand on bench, row dumbbell to hip with other arm.', true),
('T-Bar Row', 'back', 'barbell', ARRAY['middle back', 'lats'], ARRAY['biceps', 'rear delts'], 'Straddle bar, grip handle, pull to chest while keeping back straight.', true),

-- Shoulder exercises
('Overhead Press', 'shoulders', 'barbell', ARRAY['front delts'], ARRAY['triceps', 'side delts'], 'Stand with bar at shoulders, press overhead until arms extended.', true),
('Dumbbell Shoulder Press', 'shoulders', 'dumbbell', ARRAY['front delts'], ARRAY['triceps', 'side delts'], 'Sit or stand with dumbbells at shoulders, press overhead.', true),
('Lateral Raise', 'shoulders', 'dumbbell', ARRAY['side delts'], ARRAY[]::TEXT[], 'Stand with dumbbells at sides, raise arms to shoulder level.', false),
('Front Raise', 'shoulders', 'dumbbell', ARRAY['front delts'], ARRAY[]::TEXT[], 'Stand with dumbbells at thighs, raise arms forward to shoulder level.', false),
('Rear Delt Fly', 'shoulders', 'dumbbell', ARRAY['rear delts'], ARRAY['traps'], 'Bend forward, raise dumbbells out to sides with slight bend in elbows.', false),
('Face Pull', 'shoulders', 'cable', ARRAY['rear delts', 'traps'], ARRAY['rhomboids'], 'Pull rope attachment to face level, externally rotating shoulders.', false),
('Arnold Press', 'shoulders', 'dumbbell', ARRAY['front delts', 'side delts'], ARRAY['triceps'], 'Start with palms facing you, rotate and press overhead.', true),

-- Arm exercises
('Barbell Curl', 'arms', 'barbell', ARRAY['biceps'], ARRAY['forearms'], 'Stand with barbell, curl weight up by bending elbows, lower slowly.', false),
('Dumbbell Curl', 'arms', 'dumbbell', ARRAY['biceps'], ARRAY['forearms'], 'Stand with dumbbells, curl weight up by bending elbows.', false),
('Hammer Curl', 'arms', 'dumbbell', ARRAY['biceps', 'brachialis'], ARRAY['forearms'], 'Curl dumbbells with neutral grip (palms facing each other).', false),
('Preacher Curl', 'arms', 'barbell', ARRAY['biceps'], ARRAY['forearms'], 'Sit at preacher bench, curl bar up while keeping upper arms on pad.', false),
('Cable Curl', 'arms', 'cable', ARRAY['biceps'], ARRAY['forearms'], 'Stand at cable machine, curl handle up by bending elbows.', false),
('Tricep Pushdown', 'arms', 'cable', ARRAY['triceps'], ARRAY[]::TEXT[], 'Stand at cable machine, push handle down by extending elbows.', false),
('Skull Crushers', 'arms', 'barbell', ARRAY['triceps'], ARRAY[]::TEXT[], 'Lie on bench, lower bar to forehead by bending elbows, extend back up.', false),
('Overhead Tricep Extension', 'arms', 'dumbbell', ARRAY['triceps'], ARRAY[]::TEXT[], 'Hold weight overhead, lower behind head by bending elbows, extend up.', false),
('Close-Grip Bench Press', 'arms', 'barbell', ARRAY['triceps'], ARRAY['chest', 'shoulders'], 'Bench press with narrow grip to emphasize triceps.', true),
('Dips (Triceps)', 'arms', 'bodyweight', ARRAY['triceps'], ARRAY['chest', 'shoulders'], 'Keep body upright on parallel bars, lower and press up.', true),

-- Leg exercises
('Squat', 'legs', 'barbell', ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'], 'Bar on upper back, squat down until thighs parallel, stand back up.', true),
('Front Squat', 'legs', 'barbell', ARRAY['quads'], ARRAY['glutes', 'core'], 'Bar on front shoulders, squat down keeping torso upright.', true),
('Leg Press', 'legs', 'machine', ARRAY['quads', 'glutes'], ARRAY['hamstrings'], 'Sit in machine, press platform away by extending legs.', true),
('Romanian Deadlift', 'legs', 'barbell', ARRAY['hamstrings', 'glutes'], ARRAY['lower back'], 'Hold bar, hinge at hips keeping legs slightly bent, lower bar along legs.', true),
('Leg Curl', 'legs', 'machine', ARRAY['hamstrings'], ARRAY[]::TEXT[], 'Lie face down, curl pad up by bending knees.', false),
('Leg Extension', 'legs', 'machine', ARRAY['quads'], ARRAY[]::TEXT[], 'Sit in machine, extend legs by straightening knees.', false),
('Lunges', 'legs', 'dumbbell', ARRAY['quads', 'glutes'], ARRAY['hamstrings'], 'Step forward, lower back knee toward ground, push back to start.', true),
('Bulgarian Split Squat', 'legs', 'dumbbell', ARRAY['quads', 'glutes'], ARRAY['hamstrings'], 'Rear foot elevated, squat down on front leg.', true),
('Calf Raise', 'legs', 'machine', ARRAY['calves'], ARRAY[]::TEXT[], 'Stand on platform, raise heels as high as possible.', false),
('Hip Thrust', 'legs', 'barbell', ARRAY['glutes'], ARRAY['hamstrings'], 'Upper back on bench, bar on hips, thrust hips upward.', true),

-- Core exercises
('Plank', 'core', 'bodyweight', ARRAY['core', 'abs'], ARRAY['shoulders'], 'Hold push-up position with forearms on ground, keep body straight.', false),
('Crunches', 'core', 'bodyweight', ARRAY['abs'], ARRAY[]::TEXT[], 'Lie on back, lift shoulders off ground by contracting abs.', false),
('Hanging Leg Raise', 'core', 'bodyweight', ARRAY['lower abs'], ARRAY['hip flexors'], 'Hang from bar, raise legs until parallel with ground.', false),
('Russian Twist', 'core', 'bodyweight', ARRAY['obliques'], ARRAY['abs'], 'Sit with knees bent, twist torso side to side.', false),
('Cable Woodchop', 'core', 'cable', ARRAY['obliques', 'core'], ARRAY[]::TEXT[], 'Pull cable diagonally across body with rotation.', false),
('Ab Rollout', 'core', 'other', ARRAY['abs', 'core'], ARRAY['shoulders', 'lats'], 'Kneel with wheel, roll forward keeping core tight, roll back.', false),
('Dead Bug', 'core', 'bodyweight', ARRAY['core', 'abs'], ARRAY[]::TEXT[], 'Lie on back, extend opposite arm and leg while keeping back flat.', false),

-- Cardio exercises
('Treadmill Run', 'cardio', 'machine', ARRAY['legs', 'cardiovascular'], ARRAY[]::TEXT[], 'Run on treadmill at desired pace and incline.', false),
('Rowing Machine', 'cardio', 'machine', ARRAY['back', 'legs', 'cardiovascular'], ARRAY['arms', 'core'], 'Pull handle to chest, push back with legs, repeat.', true),
('Stair Climber', 'cardio', 'machine', ARRAY['legs', 'cardiovascular'], ARRAY['glutes'], 'Climb stairs at desired pace.', false),
('Battle Ropes', 'cardio', 'other', ARRAY['cardiovascular', 'shoulders'], ARRAY['core', 'arms'], 'Create waves with heavy ropes using various patterns.', false),
('Jumping Jacks', 'cardio', 'bodyweight', ARRAY['cardiovascular'], ARRAY['legs', 'shoulders'], 'Jump feet out while raising arms, return to start.', false),
('Burpees', 'cardio', 'bodyweight', ARRAY['cardiovascular', 'full body'], ARRAY['chest', 'legs'], 'Drop to push-up, jump feet in, jump up with arms overhead.', true)

ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Note: User-specific seed data (profiles, workouts, etc.) should be created
-- through the application or via a separate script with valid auth.users IDs.
-- 
-- For demo purposes, you can create a test user in Supabase Auth and then
-- insert demo data using that user's ID.
-- ============================================================================

-- Example demo data structure (replace USER_ID with actual auth user ID):
/*
-- Demo profile is created automatically by trigger when user signs up

-- Demo workouts
INSERT INTO public.workouts (user_id, title, notes, workout_date, duration_minutes, status)
VALUES 
    ('USER_ID', 'Push Day', 'Chest, shoulders, and triceps', CURRENT_DATE, 65, 'completed'),
    ('USER_ID', 'Pull Day', 'Back and biceps focus', CURRENT_DATE - 1, 55, 'completed'),
    ('USER_ID', 'Leg Day', 'Squat focused', CURRENT_DATE - 2, 70, 'completed');

-- Demo exercises for the first workout
INSERT INTO public.workout_exercises (workout_id, exercise_name, order_index)
VALUES 
    ('WORKOUT_ID', 'Bench Press', 0),
    ('WORKOUT_ID', 'Incline Dumbbell Press', 1),
    ('WORKOUT_ID', 'Cable Fly', 2),
    ('WORKOUT_ID', 'Overhead Press', 3),
    ('WORKOUT_ID', 'Lateral Raise', 4),
    ('WORKOUT_ID', 'Tricep Pushdown', 5);

-- Demo sets
INSERT INTO public.sets (workout_exercise_id, set_number, weight, reps, rir)
VALUES
    ('EXERCISE_ID', 1, 135, 10, 3),
    ('EXERCISE_ID', 2, 155, 8, 2),
    ('EXERCISE_ID', 3, 175, 6, 1),
    ('EXERCISE_ID', 4, 175, 5, 0);
*/
