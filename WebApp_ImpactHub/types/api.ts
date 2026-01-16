/**
 * API Response types
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API Request types
 */

export interface CreateWorkoutRequest {
  title: string;
  notes?: string;
  workout_date: string;
}

export interface UpdateWorkoutRequest {
  title?: string;
  notes?: string;
  workout_date?: string;
}

export interface CreateExerciseRequest {
  exercise_name: string;
  order_index: number;
}

export interface CreateSetRequest {
  set_number: number;
  weight: number;
  reps: number;
  rir?: number;
}

export interface UpdateSetRequest {
  weight?: number;
  reps?: number;
  rir?: number;
}

/**
 * Progress tracking types
 */

export interface PersonalRecord {
  exercise_name: string;
  weight: number;
  reps: number;
  date: string;
}

export interface VolumeStats {
  date: string;
  total_volume: number;
  total_sets: number;
  total_reps: number;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
}
