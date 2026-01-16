/**
 * Supabase Database Types
 * Phase 2: Complete database type definitions for ImpactHub / LiftLog+
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types for better type safety
export type WorkoutStatus = 'planned' | 'in_progress' | 'completed' | 'skipped';
export type SubscriptionPlan = 'free' | 'pro' | 'lifetime';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type ProgramCategory = 'strength' | 'hypertrophy' | 'endurance' | 'powerlifting' | 'bodybuilding' | 'general';
export type ExerciseCategory = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'cardio' | 'full_body' | 'other';
export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands' | 'other' | 'none';
export type WeightUnit = 'lbs' | 'kg';
export type Theme = 'light' | 'dark' | 'system';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          workout_date: string;
          duration_minutes: number | null;
          status: WorkoutStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          notes?: string | null;
          workout_date: string;
          duration_minutes?: number | null;
          status?: WorkoutStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          notes?: string | null;
          workout_date?: string;
          duration_minutes?: number | null;
          status?: WorkoutStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workouts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_name: string;
          order_index: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_name: string;
          order_index?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          exercise_name?: string;
          order_index?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          }
        ];
      };
      sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          weight: number;
          reps: number;
          rir: number | null;
          rpe: number | null;
          is_warmup: boolean;
          is_dropset: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number?: number;
          weight?: number;
          reps?: number;
          rir?: number | null;
          rpe?: number | null;
          is_warmup?: boolean;
          is_dropset?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_exercise_id?: string;
          set_number?: number;
          weight?: number;
          reps?: number;
          rir?: number | null;
          rpe?: number | null;
          is_warmup?: boolean;
          is_dropset?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sets_workout_exercise_id_fkey';
            columns: ['workout_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'workout_exercises';
            referencedColumns: ['id'];
          }
        ];
      };
      program_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          weeks: number;
          days_per_week: number;
          difficulty: Difficulty | null;
          category: ProgramCategory | null;
          is_public: boolean;
          times_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          weeks?: number;
          days_per_week?: number;
          difficulty?: Difficulty | null;
          category?: ProgramCategory | null;
          is_public?: boolean;
          times_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          weeks?: number;
          days_per_week?: number;
          difficulty?: Difficulty | null;
          category?: ProgramCategory | null;
          is_public?: boolean;
          times_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_templates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      program_workouts: {
        Row: {
          id: string;
          program_id: string;
          name: string;
          day_number: number;
          week_number: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          name: string;
          day_number: number;
          week_number?: number;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          program_id?: string;
          name?: string;
          day_number?: number;
          week_number?: number;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_workouts_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'program_templates';
            referencedColumns: ['id'];
          }
        ];
      };
      program_exercises: {
        Row: {
          id: string;
          program_workout_id: string;
          exercise_name: string;
          order_index: number;
          target_sets: number;
          target_reps: string;
          rest_seconds: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_workout_id: string;
          exercise_name: string;
          order_index?: number;
          target_sets?: number;
          target_reps?: string;
          rest_seconds?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          program_workout_id?: string;
          exercise_name?: string;
          order_index?: number;
          target_sets?: number;
          target_reps?: string;
          rest_seconds?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_exercises_program_workout_id_fkey';
            columns: ['program_workout_id'];
            isOneToOne: false;
            referencedRelation: 'program_workouts';
            referencedColumns: ['id'];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          event_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          event_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: string;
          event_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          weight_unit: WeightUnit;
          theme: Theme;
          notifications_enabled: boolean;
          email_weekly_summary: boolean;
          email_workout_reminders: boolean;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight_unit?: WeightUnit;
          theme?: Theme;
          notifications_enabled?: boolean;
          email_weekly_summary?: boolean;
          email_workout_reminders?: boolean;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weight_unit?: WeightUnit;
          theme?: Theme;
          notifications_enabled?: boolean;
          email_weekly_summary?: boolean;
          email_workout_reminders?: boolean;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      exercise_library: {
        Row: {
          id: string;
          name: string;
          category: ExerciseCategory | null;
          equipment: Equipment | null;
          primary_muscles: string[] | null;
          secondary_muscles: string[] | null;
          instructions: string | null;
          is_compound: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: ExerciseCategory | null;
          equipment?: Equipment | null;
          primary_muscles?: string[] | null;
          secondary_muscles?: string[] | null;
          instructions?: string | null;
          is_compound?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: ExerciseCategory | null;
          equipment?: Equipment | null;
          primary_muscles?: string[] | null;
          secondary_muscles?: string[] | null;
          instructions?: string | null;
          is_compound?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_name: string;
          weight: number;
          reps: number;
          one_rep_max_estimate: number | null;
          set_id: string | null;
          achieved_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_name: string;
          weight: number;
          reps?: number;
          one_rep_max_estimate?: number | null;
          set_id?: string | null;
          achieved_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_name?: string;
          weight?: number;
          reps?: number;
          one_rep_max_estimate?: number | null;
          set_id?: string | null;
          achieved_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'personal_records_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personal_records_set_id_fkey';
            columns: ['set_id'];
            isOneToOne: false;
            referencedRelation: 'sets';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_one_rep_max: {
        Args: { weight: number; reps: number };
        Returns: number;
      };
      get_user_workout_stats: {
        Args: { p_user_id: string };
        Returns: {
          total_workouts: number;
          workouts_this_week: number;
          workouts_this_month: number;
          current_streak: number;
          longest_streak: number;
          total_sets: number;
          total_volume: number;
        }[];
      };
      get_weekly_volume: {
        Args: { p_user_id: string; p_exercise_name: string; p_weeks_back?: number };
        Returns: {
          week_start: string;
          total_sets: number;
          total_reps: number;
          total_volume: number;
          max_weight: number;
        }[];
      };
      create_audit_log: {
        Args: {
          p_user_id: string;
          p_event_type: string;
          p_event_data?: Json;
          p_ip_address?: string;
          p_user_agent?: string;
        };
        Returns: string;
      };
      increment_template_usage: {
        Args: { template_id: string };
        Returns: void;
      };
    };
    Enums: {
      workout_status: WorkoutStatus;
      subscription_plan: SubscriptionPlan;
      subscription_status: SubscriptionStatus;
      difficulty: Difficulty;
      program_category: ProgramCategory;
      exercise_category: ExerciseCategory;
      equipment: Equipment;
      weight_unit: WeightUnit;
      theme: Theme;
    };
  };
}

// ============================================================================
// Convenience Type Aliases
// ============================================================================

// Table row types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Workout = Database['public']['Tables']['workouts']['Row'];
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
export type Set = Database['public']['Tables']['sets']['Row'];
export type ProgramTemplate = Database['public']['Tables']['program_templates']['Row'];
export type ProgramWorkout = Database['public']['Tables']['program_workouts']['Row'];
export type ProgramExercise = Database['public']['Tables']['program_exercises']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type ExerciseLibraryItem = Database['public']['Tables']['exercise_library']['Row'];
export type PersonalRecord = Database['public']['Tables']['personal_records']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];
export type WorkoutExerciseInsert = Database['public']['Tables']['workout_exercises']['Insert'];
export type SetInsert = Database['public']['Tables']['sets']['Insert'];
export type ProgramTemplateInsert = Database['public']['Tables']['program_templates']['Insert'];
export type ProgramWorkoutInsert = Database['public']['Tables']['program_workouts']['Insert'];
export type ProgramExerciseInsert = Database['public']['Tables']['program_exercises']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type WorkoutUpdate = Database['public']['Tables']['workouts']['Update'];
export type WorkoutExerciseUpdate = Database['public']['Tables']['workout_exercises']['Update'];
export type SetUpdate = Database['public']['Tables']['sets']['Update'];
export type ProgramTemplateUpdate = Database['public']['Tables']['program_templates']['Update'];

// ============================================================================
// Extended Types for API/UI usage
// ============================================================================

// Workout with nested exercises and sets
export interface WorkoutWithExercises extends Workout {
  workout_exercises: (WorkoutExercise & {
    sets: Set[];
  })[];
}

// Program template with nested structure
export interface ProgramTemplateWithWorkouts extends ProgramTemplate {
  program_workouts: (ProgramWorkout & {
    program_exercises: ProgramExercise[];
  })[];
}

// User profile with settings and subscription
export interface UserWithDetails extends Profile {
  user_settings: UserSettings | null;
  subscriptions: Subscription | null;
}

// Workout stats return type
export interface WorkoutStats {
  total_workouts: number;
  workouts_this_week: number;
  workouts_this_month: number;
  current_streak: number;
  longest_streak: number;
  total_sets: number;
  total_volume: number;
}

// Volume tracking data point
export interface VolumeDataPoint {
  week_start: string;
  total_sets: number;
  total_reps: number;
  total_volume: number;
  max_weight: number;
}
