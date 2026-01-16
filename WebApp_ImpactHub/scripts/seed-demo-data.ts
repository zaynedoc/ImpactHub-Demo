/**
 * Demo Data Seed Script
 * Run this script to populate the database with sample workout data for demo purposes.
 * 
 * Usage: npx ts-node scripts/seed-demo-data.ts
 * 
 * Note: Requires a valid user to be signed up first. The script will use
 * the DEMO_USER_ID environment variable or prompt for one.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Demo workout data
const demoWorkouts = [
  {
    title: 'Push Day - Chest & Shoulders',
    notes: 'Heavy compound movements followed by isolation work',
    workout_date: new Date().toISOString().split('T')[0],
    duration_minutes: 65,
    status: 'completed' as const,
    exercises: [
      {
        exercise_name: 'Bench Press',
        order_index: 0,
        sets: [
          { set_number: 1, weight: 135, reps: 10, rir: 4, is_warmup: true },
          { set_number: 2, weight: 185, reps: 8, rir: 3 },
          { set_number: 3, weight: 205, reps: 6, rir: 2 },
          { set_number: 4, weight: 225, reps: 4, rir: 1 },
        ],
      },
      {
        exercise_name: 'Incline Dumbbell Press',
        order_index: 1,
        sets: [
          { set_number: 1, weight: 60, reps: 10, rir: 2 },
          { set_number: 2, weight: 65, reps: 8, rir: 2 },
          { set_number: 3, weight: 70, reps: 8, rir: 1 },
        ],
      },
      {
        exercise_name: 'Cable Fly',
        order_index: 2,
        sets: [
          { set_number: 1, weight: 25, reps: 12, rir: 2 },
          { set_number: 2, weight: 30, reps: 10, rir: 1 },
          { set_number: 3, weight: 30, reps: 10, rir: 1 },
        ],
      },
      {
        exercise_name: 'Overhead Press',
        order_index: 3,
        sets: [
          { set_number: 1, weight: 95, reps: 8, rir: 2 },
          { set_number: 2, weight: 105, reps: 6, rir: 2 },
          { set_number: 3, weight: 115, reps: 5, rir: 1 },
        ],
      },
      {
        exercise_name: 'Lateral Raise',
        order_index: 4,
        sets: [
          { set_number: 1, weight: 15, reps: 15, rir: 2 },
          { set_number: 2, weight: 20, reps: 12, rir: 1 },
          { set_number: 3, weight: 20, reps: 12, rir: 1 },
        ],
      },
      {
        exercise_name: 'Tricep Pushdown',
        order_index: 5,
        sets: [
          { set_number: 1, weight: 50, reps: 12, rir: 2 },
          { set_number: 2, weight: 60, reps: 10, rir: 1 },
          { set_number: 3, weight: 60, reps: 10, rir: 1 },
        ],
      },
    ],
  },
  {
    title: 'Pull Day - Back & Biceps',
    notes: 'Focus on mind-muscle connection for lats',
    workout_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    duration_minutes: 60,
    status: 'completed' as const,
    exercises: [
      {
        exercise_name: 'Deadlift',
        order_index: 0,
        sets: [
          { set_number: 1, weight: 135, reps: 8, rir: 4, is_warmup: true },
          { set_number: 2, weight: 225, reps: 5, rir: 3 },
          { set_number: 3, weight: 275, reps: 3, rir: 2 },
          { set_number: 4, weight: 315, reps: 2, rir: 1 },
        ],
      },
      {
        exercise_name: 'Pull-ups',
        order_index: 1,
        sets: [
          { set_number: 1, weight: 0, reps: 10, rir: 2 },
          { set_number: 2, weight: 0, reps: 8, rir: 2 },
          { set_number: 3, weight: 0, reps: 7, rir: 1 },
        ],
      },
      {
        exercise_name: 'Barbell Row',
        order_index: 2,
        sets: [
          { set_number: 1, weight: 135, reps: 10, rir: 2 },
          { set_number: 2, weight: 155, reps: 8, rir: 2 },
          { set_number: 3, weight: 175, reps: 6, rir: 1 },
        ],
      },
      {
        exercise_name: 'Lat Pulldown',
        order_index: 3,
        sets: [
          { set_number: 1, weight: 120, reps: 10, rir: 2 },
          { set_number: 2, weight: 140, reps: 8, rir: 1 },
          { set_number: 3, weight: 140, reps: 8, rir: 1 },
        ],
      },
      {
        exercise_name: 'Face Pull',
        order_index: 4,
        sets: [
          { set_number: 1, weight: 40, reps: 15, rir: 2 },
          { set_number: 2, weight: 50, reps: 12, rir: 1 },
          { set_number: 3, weight: 50, reps: 12, rir: 1 },
        ],
      },
      {
        exercise_name: 'Barbell Curl',
        order_index: 5,
        sets: [
          { set_number: 1, weight: 65, reps: 10, rir: 2 },
          { set_number: 2, weight: 75, reps: 8, rir: 1 },
          { set_number: 3, weight: 75, reps: 8, rir: 1 },
        ],
      },
    ],
  },
  {
    title: 'Leg Day - Squat Focus',
    notes: 'Heavy squats, accessories for hamstrings and glutes',
    workout_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    duration_minutes: 75,
    status: 'completed' as const,
    exercises: [
      {
        exercise_name: 'Squat',
        order_index: 0,
        sets: [
          { set_number: 1, weight: 135, reps: 10, rir: 4, is_warmup: true },
          { set_number: 2, weight: 185, reps: 6, rir: 3, is_warmup: true },
          { set_number: 3, weight: 225, reps: 5, rir: 2 },
          { set_number: 4, weight: 255, reps: 3, rir: 2 },
          { set_number: 5, weight: 275, reps: 2, rir: 1 },
        ],
      },
      {
        exercise_name: 'Romanian Deadlift',
        order_index: 1,
        sets: [
          { set_number: 1, weight: 135, reps: 10, rir: 2 },
          { set_number: 2, weight: 155, reps: 8, rir: 2 },
          { set_number: 3, weight: 175, reps: 8, rir: 1 },
        ],
      },
      {
        exercise_name: 'Leg Press',
        order_index: 2,
        sets: [
          { set_number: 1, weight: 360, reps: 12, rir: 2 },
          { set_number: 2, weight: 450, reps: 10, rir: 1 },
          { set_number: 3, weight: 450, reps: 10, rir: 1 },
        ],
      },
      {
        exercise_name: 'Leg Curl',
        order_index: 3,
        sets: [
          { set_number: 1, weight: 80, reps: 12, rir: 2 },
          { set_number: 2, weight: 90, reps: 10, rir: 1 },
          { set_number: 3, weight: 90, reps: 10, rir: 1 },
        ],
      },
      {
        exercise_name: 'Leg Extension',
        order_index: 4,
        sets: [
          { set_number: 1, weight: 100, reps: 12, rir: 2 },
          { set_number: 2, weight: 120, reps: 10, rir: 1 },
          { set_number: 3, weight: 120, reps: 10, rir: 1 },
        ],
      },
      {
        exercise_name: 'Calf Raise',
        order_index: 5,
        sets: [
          { set_number: 1, weight: 180, reps: 15, rir: 2 },
          { set_number: 2, weight: 200, reps: 12, rir: 1 },
          { set_number: 3, weight: 200, reps: 12, rir: 1 },
        ],
      },
    ],
  },
];

// Demo program template
const demoProgram = {
  name: 'Push Pull Legs (PPL)',
  description: 'A classic 6-day training split focusing on compound movements with isolation accessories. Great for intermediate lifters looking to build strength and muscle.',
  weeks: 8,
  days_per_week: 6,
  difficulty: 'intermediate' as const,
  category: 'hypertrophy' as const,
  is_public: true,
  workouts: [
    {
      name: 'Push A - Chest Focus',
      day_number: 1,
      week_number: 1,
      exercises: [
        { exercise_name: 'Bench Press', target_sets: 4, target_reps: '6-8', rest_seconds: 180 },
        { exercise_name: 'Incline Dumbbell Press', target_sets: 3, target_reps: '8-10', rest_seconds: 120 },
        { exercise_name: 'Cable Fly', target_sets: 3, target_reps: '12-15', rest_seconds: 90 },
        { exercise_name: 'Overhead Press', target_sets: 3, target_reps: '8-10', rest_seconds: 120 },
        { exercise_name: 'Lateral Raise', target_sets: 3, target_reps: '12-15', rest_seconds: 60 },
        { exercise_name: 'Tricep Pushdown', target_sets: 3, target_reps: '10-12', rest_seconds: 60 },
      ],
    },
    {
      name: 'Pull A - Back Focus',
      day_number: 2,
      week_number: 1,
      exercises: [
        { exercise_name: 'Deadlift', target_sets: 4, target_reps: '3-5', rest_seconds: 180 },
        { exercise_name: 'Pull-ups', target_sets: 3, target_reps: '6-10', rest_seconds: 120 },
        { exercise_name: 'Barbell Row', target_sets: 3, target_reps: '8-10', rest_seconds: 120 },
        { exercise_name: 'Face Pull', target_sets: 3, target_reps: '15-20', rest_seconds: 60 },
        { exercise_name: 'Barbell Curl', target_sets: 3, target_reps: '10-12', rest_seconds: 60 },
        { exercise_name: 'Hammer Curl', target_sets: 2, target_reps: '10-12', rest_seconds: 60 },
      ],
    },
    {
      name: 'Legs A - Quad Focus',
      day_number: 3,
      week_number: 1,
      exercises: [
        { exercise_name: 'Squat', target_sets: 4, target_reps: '5-8', rest_seconds: 180 },
        { exercise_name: 'Romanian Deadlift', target_sets: 3, target_reps: '8-10', rest_seconds: 120 },
        { exercise_name: 'Leg Press', target_sets: 3, target_reps: '10-12', rest_seconds: 120 },
        { exercise_name: 'Leg Curl', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
        { exercise_name: 'Leg Extension', target_sets: 3, target_reps: '10-12', rest_seconds: 90 },
        { exercise_name: 'Calf Raise', target_sets: 4, target_reps: '12-15', rest_seconds: 60 },
      ],
    },
  ],
};

async function seedDemoData(userId: string) {
  console.log(`Seeding demo data for user: ${userId}`);

  try {
    // Seed workouts with exercises and sets
    for (const workoutData of demoWorkouts) {
      const { exercises, ...workout } = workoutData;

      // Insert workout
      const { data: insertedWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert({ ...workout, user_id: userId })
        .select()
        .single();

      if (workoutError) {
        console.error('Error inserting workout:', workoutError);
        continue;
      }

      console.log(`Created workout: ${insertedWorkout.title}`);

      // Insert exercises
      for (const exerciseData of exercises) {
        const { sets, ...exercise } = exerciseData;

        const { data: insertedExercise, error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert({ ...exercise, workout_id: insertedWorkout.id })
          .select()
          .single();

        if (exerciseError) {
          console.error('Error inserting exercise:', exerciseError);
          continue;
        }

        // Insert sets
        const setsToInsert = sets.map((set) => ({
          ...set,
          workout_exercise_id: insertedExercise.id,
          is_warmup: set.is_warmup || false,
          is_dropset: false,
        }));

        const { error: setsError } = await supabase
          .from('sets')
          .insert(setsToInsert);

        if (setsError) {
          console.error('Error inserting sets:', setsError);
        }
      }
    }

    // Seed program template
    const { workouts: programWorkouts, ...program } = demoProgram;

    const { data: insertedProgram, error: programError } = await supabase
      .from('program_templates')
      .insert({ ...program, user_id: userId })
      .select()
      .single();

    if (programError) {
      console.error('Error inserting program:', programError);
    } else {
      console.log(`Created program: ${insertedProgram.name}`);

      // Insert program workouts
      for (let i = 0; i < programWorkouts.length; i++) {
        const { exercises: programExercises, ...programWorkout } = programWorkouts[i];

        const { data: insertedProgramWorkout, error: pwError } = await supabase
          .from('program_workouts')
          .insert({
            ...programWorkout,
            program_id: insertedProgram.id,
            order_index: i,
          })
          .select()
          .single();

        if (pwError) {
          console.error('Error inserting program workout:', pwError);
          continue;
        }

        // Insert program exercises
        const exercisesToInsert = programExercises.map((exercise, index) => ({
          ...exercise,
          program_workout_id: insertedProgramWorkout.id,
          order_index: index,
        }));

        const { error: peError } = await supabase
          .from('program_exercises')
          .insert(exercisesToInsert);

        if (peError) {
          console.error('Error inserting program exercises:', peError);
        }
      }
    }

    console.log('\n? Demo data seeded successfully!');
  } catch (error) {
    console.error('Error seeding demo data:', error);
    process.exit(1);
  }
}

// Main execution
const userId = process.env.DEMO_USER_ID || process.argv[2];

if (!userId) {
  console.error('Please provide a user ID:');
  console.error('  Set DEMO_USER_ID environment variable, or');
  console.error('  Run: npx ts-node scripts/seed-demo-data.ts <user-id>');
  process.exit(1);
}

seedDemoData(userId);
