'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Demo user credentials
export const DEMO_CREDENTIALS = {
  username: 'guest',
  email: 'guest@guest.com',
  password: 'Password123',
};

// Demo user profile
export const DEMO_USER = {
  id: 'demo-user-id-12345',
  email: DEMO_CREDENTIALS.email,
  username: DEMO_CREDENTIALS.username,
  full_name: 'Demo User',
  avatar_url: null,
  bio: 'This is a demo account for testing ImpactHub features.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Types matching the database schema
export interface DemoWorkout {
  id: string;
  user_id: string;
  title: string;
  workout_date: string;
  duration_minutes: number | null;
  notes: string | null;
  status: 'planned' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  exercises: DemoWorkoutExercise[];
}

export interface DemoWorkoutExercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  order_index: number;
  notes: string | null;
  created_at: string;
  sets: DemoSet[];
}

export interface DemoSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rpe: number | null;
  rir: number | null;
  is_warmup: boolean;
  is_dropset: boolean;
  notes: string | null;
  created_at: string;
}

export interface DemoProgram {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  weeks: number;
  days_per_week: number;
  is_public: boolean;
  times_used: number;
  created_at: string;
  updated_at: string;
  workouts: DemoProgramWorkout[];
}

export interface DemoProgramWorkout {
  id: string;
  program_id: string;
  name: string;
  day_number: number;
  week_number: number;
  order_index: number;
  created_at: string;
  exercises: DemoProgramExercise[];
}

export interface DemoProgramExercise {
  id: string;
  program_workout_id: string;
  exercise_name: string;
  target_sets: number | null;
  target_reps: string | null;
  rest_seconds: number | null;
  order_index: number;
  notes: string | null;
  created_at: string;
}

export interface DemoPersonalRecord {
  id: string;
  user_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  one_rep_max_estimate: number | null;
  achieved_at: string;
  created_at: string;
}

export interface DemoUserSettings {
  id: string;
  user_id: string;
  weight_unit: 'kg' | 'lbs';
  theme: 'dark' | 'light' | 'system';
  timezone: string;
  notifications_enabled: boolean;
  email_workout_reminders: boolean;
  email_weekly_summary: boolean;
  created_at: string;
  updated_at: string;
}

export interface DemoStoreState {
  isDemo: boolean;
  user: typeof DEMO_USER | null;
  workouts: DemoWorkout[];
  programs: DemoProgram[];
  personalRecords: DemoPersonalRecord[];
  userSettings: DemoUserSettings | null;
}

interface DemoStoreContextType {
  state: DemoStoreState;
  // Auth actions
  loginAsGuest: () => void;
  logout: () => void;
  // Workout actions
  addWorkout: (workout: Omit<DemoWorkout, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => DemoWorkout;
  updateWorkout: (id: string, updates: Partial<DemoWorkout>) => void;
  deleteWorkout: (id: string) => void;
  getWorkout: (id: string) => DemoWorkout | undefined;
  // Program actions
  addProgram: (program: Omit<DemoProgram, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => DemoProgram;
  updateProgram: (id: string, updates: Partial<DemoProgram>) => void;
  deleteProgram: (id: string) => void;
  getProgram: (id: string) => DemoProgram | undefined;
  // Personal record actions
  addPersonalRecord: (record: Omit<DemoPersonalRecord, 'id' | 'user_id' | 'created_at'>) => void;
  // Settings actions
  updateSettings: (updates: Partial<DemoUserSettings>) => void;
}

const DemoStoreContext = createContext<DemoStoreContextType | null>(null);

// Generate unique IDs
function generateId(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoStoreState>({
    isDemo: false,
    user: null,
    workouts: [],
    programs: [],
    personalRecords: [],
    userSettings: null,
  });

  const loginAsGuest = useCallback(() => {
    // Import sample data when logging in
    import('./sampleData').then(({ SAMPLE_WORKOUTS, SAMPLE_PROGRAMS, SAMPLE_PERSONAL_RECORDS, SAMPLE_USER_SETTINGS }) => {
      setState({
        isDemo: true,
        user: DEMO_USER,
        workouts: SAMPLE_WORKOUTS,
        programs: SAMPLE_PROGRAMS,
        personalRecords: SAMPLE_PERSONAL_RECORDS,
        userSettings: SAMPLE_USER_SETTINGS,
      });
    });
  }, []);

  const logout = useCallback(() => {
    setState({
      isDemo: false,
      user: null,
      workouts: [],
      programs: [],
      personalRecords: [],
      userSettings: null,
    });
  }, []);

  const addWorkout = useCallback((workout: Omit<DemoWorkout, 'id' | 'user_id' | 'created_at' | 'updated_at'>): DemoWorkout => {
    const now = new Date().toISOString();
    const newWorkout: DemoWorkout = {
      ...workout,
      id: generateId(),
      user_id: DEMO_USER.id,
      created_at: now,
      updated_at: now,
    };
    setState(prev => ({
      ...prev,
      workouts: [...prev.workouts, newWorkout],
    }));
    return newWorkout;
  }, []);

  const updateWorkout = useCallback((id: string, updates: Partial<DemoWorkout>) => {
    setState(prev => ({
      ...prev,
      workouts: prev.workouts.map(w => 
        w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
      ),
    }));
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      workouts: prev.workouts.filter(w => w.id !== id),
    }));
  }, []);

  const getWorkout = useCallback((id: string) => {
    return state.workouts.find(w => w.id === id);
  }, [state.workouts]);

  const addProgram = useCallback((program: Omit<DemoProgram, 'id' | 'user_id' | 'created_at' | 'updated_at'>): DemoProgram => {
    const now = new Date().toISOString();
    const newProgram: DemoProgram = {
      ...program,
      id: generateId(),
      user_id: DEMO_USER.id,
      created_at: now,
      updated_at: now,
    };
    setState(prev => ({
      ...prev,
      programs: [...prev.programs, newProgram],
    }));
    return newProgram;
  }, []);

  const updateProgram = useCallback((id: string, updates: Partial<DemoProgram>) => {
    setState(prev => ({
      ...prev,
      programs: prev.programs.map(p => 
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      ),
    }));
  }, []);

  const deleteProgram = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      programs: prev.programs.filter(p => p.id !== id),
    }));
  }, []);

  const getProgram = useCallback((id: string) => {
    return state.programs.find(p => p.id === id);
  }, [state.programs]);

  const addPersonalRecord = useCallback((record: Omit<DemoPersonalRecord, 'id' | 'user_id' | 'created_at'>) => {
    const newRecord: DemoPersonalRecord = {
      ...record,
      id: generateId(),
      user_id: DEMO_USER.id,
      created_at: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      personalRecords: [...prev.personalRecords, newRecord],
    }));
  }, []);

  const updateSettings = useCallback((updates: Partial<DemoUserSettings>) => {
    setState(prev => ({
      ...prev,
      userSettings: prev.userSettings ? {
        ...prev.userSettings,
        ...updates,
        updated_at: new Date().toISOString(),
      } : null,
    }));
  }, []);

  return (
    <DemoStoreContext.Provider value={{
      state,
      loginAsGuest,
      logout,
      addWorkout,
      updateWorkout,
      deleteWorkout,
      getWorkout,
      addProgram,
      updateProgram,
      deleteProgram,
      getProgram,
      addPersonalRecord,
      updateSettings,
    }}>
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore() {
  const context = useContext(DemoStoreContext);
  if (!context) {
    throw new Error('useDemoStore must be used within a DemoStoreProvider');
  }
  return context;
}

// Helper hook to check if in demo mode
export function useIsDemo() {
  const context = useContext(DemoStoreContext);
  return context?.state.isDemo ?? false;
}
