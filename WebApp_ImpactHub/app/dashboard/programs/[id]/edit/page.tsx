'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

interface Workout {
  day: number;
  name: string;
  focus: string;
  exercises: Exercise[];
}

interface PlanData {
  name: string;
  description: string;
  weeks: number;
  daysPerWeek: number;
  workouts: Workout[];
  notes?: string;
}

interface SavedProgram {
  id: string;
  name: string;
  description: string | null;
  weeks: number;
  days_per_week: number;
  goal: string | null;
  experience_level: string | null;
  equipment: string | null;
  source: 'ai' | 'manual' | 'template';
  is_active: boolean;
  plan_data: PlanData;
}

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [program, setProgram] = useState<SavedProgram | null>(null);
  
  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [weeks, setWeeks] = useState(4);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (programId) {
      fetchProgram();
    }
  }, [programId]);

  const fetchProgram = async () => {
    try {
      const res = await fetch(`/api/programs/${programId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const prog = data.data;
        
        // Check if program is active - redirect if so
        if (prog.is_active) {
          alert('Cannot edit an active program. Discontinue it first.');
          router.push(`/dashboard/programs/${programId}`);
          return;
        }
        
        setProgram(prog);
        setName(prog.name);
        setDescription(prog.description || '');
        setWeeks(prog.plan_data.weeks);
        setWorkouts(prog.plan_data.workouts || []);
        setExpandedDays(new Set([1]));
      } else {
        router.push('/dashboard/programs');
      }
    } catch (err) {
      console.error('Failed to fetch program:', err);
      router.push('/dashboard/programs');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const updateWorkoutName = (day: number, newName: string) => {
    setWorkouts(workouts.map(w => 
      w.day === day ? { ...w, name: newName } : w
    ));
  };

  const updateWorkoutFocus = (day: number, newFocus: string) => {
    setWorkouts(workouts.map(w => 
      w.day === day ? { ...w, focus: newFocus } : w
    ));
  };

  const updateExercise = (day: number, exIndex: number, field: keyof Exercise, value: string | number) => {
    setWorkouts(workouts.map(w => {
      if (w.day !== day) return w;
      const newExercises = [...w.exercises];
      newExercises[exIndex] = { ...newExercises[exIndex], [field]: value };
      return { ...w, exercises: newExercises };
    }));
  };

  const addExercise = (day: number) => {
    setWorkouts(workouts.map(w => {
      if (w.day !== day) return w;
      return {
        ...w,
        exercises: [...w.exercises, { name: '', sets: 3, reps: '8-12', restSeconds: 90 }],
      };
    }));
  };

  const removeExercise = (day: number, exIndex: number) => {
    setWorkouts(workouts.map(w => {
      if (w.day !== day) return w;
      const newExercises = w.exercises.filter((_, i) => i !== exIndex);
      return { ...w, exercises: newExercises };
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a program name');
      return;
    }

    setIsSaving(true);
    try {
      const updatedPlanData: PlanData = {
        name: name.trim(),
        description: description.trim(),
        weeks,
        daysPerWeek: workouts.length,
        workouts,
        notes: program?.plan_data.notes,
      };

      const res = await fetch(`/api/programs/${programId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          weeks,
          days_per_week: workouts.length,
          plan_data: updatedPlanData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/dashboard/programs/${programId}`);
      } else {
        alert(data.error || 'Failed to save program');
      }
    } catch (err) {
      console.error('Failed to save program:', err);
      alert('Failed to save program');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-main animate-spin" />
      </div>
    );
  }

  if (!program) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 opacity-0 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/programs/${programId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-bright-accent">Edit Program</h1>
            <p className="text-muted-accent mt-1">Modify your training program</p>
          </div>
        </div>
        <Button glow onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Program Details */}
      <div className="bg-muted-main/50 border border-main/30 rounded-xl p-6 opacity-0 animate-fade-in-up stagger-1">
        <h2 className="text-lg font-semibold text-bright-accent mb-4">Program Details</h2>
        <div className="grid gap-4">
          <Input
            label="Program Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Push Pull Legs"
          />
          <div>
            <label className="block text-sm font-medium text-bright-accent/80 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Program description..."
              rows={3}
              className="w-full px-4 py-3 bg-muted-main border border-main/30 rounded-lg text-bright-accent placeholder:text-muted-accent/50 focus:outline-none focus:ring-2 focus:ring-main/50 focus:border-main transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (weeks)"
              type="number"
              min={1}
              max={16}
              value={weeks.toString()}
              onChange={(e) => setWeeks(parseInt(e.target.value) || 4)}
            />
            <div>
              <label className="block text-sm font-medium text-bright-accent/80 mb-2">Days per Week</label>
              <div className="px-4 py-3 bg-muted-main/50 border border-main/30 rounded-lg text-muted-accent">
                {workouts.length} days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workouts */}
      <div className="opacity-0 animate-fade-in-up stagger-2">
        <h2 className="text-lg font-semibold text-bright-accent mb-4">Workouts</h2>
        <div className="space-y-4">
          {workouts.map((workout) => (
            <div
              key={workout.day}
              className="bg-muted-main/50 rounded-xl border border-main/30 overflow-hidden"
            >
              {/* Day Header */}
              <button
                type="button"
                onClick={() => toggleDay(workout.day)}
                className="w-full flex items-center justify-between p-4 hover:bg-main/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-main/20 rounded-lg flex items-center justify-center">
                    <span className="text-accent font-bold">{workout.day}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-bright-accent">{workout.name}</h3>
                    <p className="text-sm text-muted-accent">{workout.focus}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-accent">
                    {workout.exercises.length} exercises
                  </span>
                  {expandedDays.has(workout.day) ? (
                    <ChevronDown className="w-5 h-5 text-muted-accent" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-accent" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {expandedDays.has(workout.day) && (
                <div className="border-t border-main/20 p-4 space-y-4">
                  {/* Workout Name & Focus */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Workout Name"
                      value={workout.name}
                      onChange={(e) => updateWorkoutName(workout.day, e.target.value)}
                    />
                    <Input
                      label="Focus/Muscle Groups"
                      value={workout.focus}
                      onChange={(e) => updateWorkoutFocus(workout.day, e.target.value)}
                    />
                  </div>

                  {/* Exercises */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-bright-accent/80">Exercises</label>
                    {workout.exercises.map((exercise, exIndex) => (
                      <div key={exIndex} className="flex items-center gap-2 p-3 bg-muted-main/30 rounded-lg">
                        <GripVertical className="w-4 h-4 text-muted-accent/50 flex-shrink-0" />
                        <Input
                          placeholder="Exercise name"
                          value={exercise.name}
                          onChange={(e) => updateExercise(workout.day, exIndex, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Sets"
                          value={exercise.sets.toString()}
                          onChange={(e) => updateExercise(workout.day, exIndex, 'sets', parseInt(e.target.value) || 3)}
                          className="w-20 text-center"
                        />
                        <Input
                          placeholder="Reps"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(workout.day, exIndex, 'reps', e.target.value)}
                          className="w-24 text-center"
                        />
                        <Input
                          type="number"
                          placeholder="Rest (s)"
                          value={exercise.restSeconds.toString()}
                          onChange={(e) => updateExercise(workout.day, exIndex, 'restSeconds', parseInt(e.target.value) || 60)}
                          className="w-20 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => removeExercise(workout.day, exIndex)}
                          className="p-2 text-muted-accent hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addExercise(workout.day)}
                      className="w-full mt-2"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Exercise
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 opacity-0 animate-fade-in-up stagger-3">
        <Link href={`/dashboard/programs/${programId}`}>
          <Button variant="ghost">Cancel</Button>
        </Link>
        <Button glow onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
