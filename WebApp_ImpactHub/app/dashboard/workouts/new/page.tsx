'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, History, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast, useToastLocal } from '@/components/ui/Toast';

interface ExerciseSet {
  id: string;
  weight: string;
  reps: string;
  rir: string;
}

interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
}

interface PreviousExercise {
  exercise_name: string;
  sets: { weight: number; reps: number; rir: number | null }[];
}

export default function NewWorkoutPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToastLocal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [workoutDate, setWorkoutDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  // Previous exercises modal state
  const [showPreviousExercises, setShowPreviousExercises] = useState(false);
  const [previousExercises, setPreviousExercises] = useState<PreviousExercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  useEffect(() => {
    if (showPreviousExercises) {
      fetchPreviousExercises();
    }
  }, [showPreviousExercises]);

  const fetchPreviousExercises = async () => {
    setIsLoadingPrevious(true);
    try {
      const response = await fetch('/api/workouts?pageSize=20');
      const result = await response.json();
      
      if (result.success && result.data) {
        const exerciseMap = new Map<string, PreviousExercise>();
        
        result.data.forEach((workout: { workout_exercises?: Array<{ exercise_name: string; sets?: Array<{ weight: number; reps: number; rir: number | null }> }> }) => {
          workout.workout_exercises?.forEach((exercise) => {
            if (!exerciseMap.has(exercise.exercise_name)) {
              exerciseMap.set(exercise.exercise_name, {
                exercise_name: exercise.exercise_name,
                sets: exercise.sets || [],
              });
            }
          });
        });
        
        setPreviousExercises(Array.from(exerciseMap.values()));
      }
    } catch (error) {
      console.error('Error fetching previous exercises:', error);
    } finally {
      setIsLoadingPrevious(false);
    }
  };

  const addExistingExercise = (prevExercise: PreviousExercise) => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: prevExercise.exercise_name,
      sets: prevExercise.sets.length > 0 
        ? prevExercise.sets.map(s => ({
            id: crypto.randomUUID(),
            weight: s.weight.toString(),
            reps: s.reps.toString(),
            rir: s.rir?.toString() || '',
          }))
        : [{ id: crypto.randomUUID(), weight: '', reps: '', rir: '' }],
    };
    setExercises([...exercises, newExercise]);
    setShowPreviousExercises(false);
    setExerciseSearch('');
  };

  const filteredPreviousExercises = previousExercises.filter(e =>
    e.exercise_name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  const addExercise = () => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: '',
      sets: [{ id: crypto.randomUUID(), weight: '', reps: '', rir: '' }],
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter((e) => e.id !== exerciseId));
  };

  const updateExerciseName = (exerciseId: string, name: string) => {
    setExercises(
      exercises.map((e) => (e.id === exerciseId ? { ...e, name } : e))
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises(
      exercises.map((e) =>
        e.id === exerciseId
          ? {
              ...e,
              sets: [
                ...e.sets,
                { id: crypto.randomUUID(), weight: '', reps: '', rir: '' },
              ],
            }
          : e
      )
    );
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(
      exercises.map((e) =>
        e.id === exerciseId
          ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
          : e
      )
    );
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: keyof ExerciseSet,
    value: string
  ) => {
    setExercises(
      exercises.map((e) =>
        e.id === exerciseId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, [field]: value } : s
              ),
            }
          : e
      )
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.target as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    const newExercises = [...exercises];
    const [draggedItem] = newExercises.splice(draggedIndex, 1);
    newExercises.splice(dropIndex, 0, draggedItem);
    
    setExercises(newExercises);
    handleDragEnd();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter a workout title', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const workoutResponse = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          notes: notes.trim() || null,
          workout_date: workoutDate,
        }),
      });

      const workoutResult = await workoutResponse.json();

      if (!workoutResult.success) {
        throw new Error(workoutResult.error || 'Failed to create workout');
      }

      const workoutId = workoutResult.data.id;

      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        if (!exercise.name.trim()) continue;

        const exerciseResponse = await fetch(
          `/api/workouts/${workoutId}/exercises`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              exercise_name: exercise.name.trim(),
              order_index: i,
            }),
          }
        );

        const exerciseResult = await exerciseResponse.json();

        if (!exerciseResult.success) {
          console.error('Failed to create exercise:', exerciseResult.error);
          continue;
        }

        const exerciseId = exerciseResult.data.id;

        for (let j = 0; j < exercise.sets.length; j++) {
          const set = exercise.sets[j];
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps) || 0;
          const rir = set.rir ? parseInt(set.rir) : null;

          if (weight === 0 && reps === 0) continue;

          await fetch(`/api/exercises/${exerciseId}/sets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              set_number: j + 1,
              weight,
              reps,
              rir,
            }),
          });
        }
      }

      showToast('Workout created successfully!', 'success');
      setTimeout(() => {
        router.push('/dashboard/workouts');
      }, 1000);
    } catch (error) {
      console.error('Error creating workout:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to create workout',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 opacity-0 animate-fade-in-up">
        <Link href="/dashboard/workouts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-bright-accent">New Workout</h1>
          <p className="text-muted-accent mt-1">Log your training session</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-muted-main/50 border border-main/30 rounded-xl p-6 opacity-0 animate-fade-in-up stagger-1">
          <h2 className="text-lg font-semibold text-bright-accent mb-4">Workout Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Workout Title"
              placeholder="e.g., Push Day - Chest Focus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="Date"
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              required
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-bright-accent/80 mb-2">Notes (optional)</label>
            <textarea
              placeholder="How did the workout feel? Any PRs or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-muted-main border border-main/30 rounded-lg text-bright-accent placeholder:text-muted-accent/50 focus:outline-none focus:ring-2 focus:ring-main/50 focus:border-main transition-all resize-none"
            />
          </div>
        </div>

        <div className="space-y-4 opacity-0 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-bright-accent">Exercises</h2>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPreviousExercises(true)}>
                <History className="w-4 h-4 mr-2" />
                Add Existing
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            </div>
          </div>

          {exercises.length === 0 ? (
            <div className="bg-muted-main/50 border border-main/30 border-dashed rounded-xl p-8 text-center">
              <p className="text-muted-accent mb-4">No exercises added yet. Click "Add Exercise" to get started.</p>
              <Button type="button" variant="outline" onClick={addExercise}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Exercise
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise, exerciseIndex) => (
                <div
                  key={exercise.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, exerciseIndex)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, exerciseIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, exerciseIndex)}
                  className={`bg-muted-main/50 border rounded-xl p-4 transition-all duration-200 ${
                    draggedIndex === exerciseIndex 
                      ? 'opacity-50 border-main/50' 
                      : dragOverIndex === exerciseIndex 
                        ? 'border-accent border-2 shadow-glow-accent' 
                        : 'border-main/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-main/20 rounded transition-colors" title="Drag to reorder">
                      <GripVertical className="w-5 h-5 text-muted-accent" />
                    </div>
                    <span className="text-sm text-muted-accent font-medium">#{exerciseIndex + 1}</span>
                    <Input
                      placeholder="Exercise name (e.g., Bench Press)"
                      value={exercise.name}
                      onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(exercise.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-12 gap-2 mb-2 px-2">
                    <div className="col-span-1 text-xs text-muted-accent font-medium">Set</div>
                    <div className="col-span-4 text-xs text-muted-accent font-medium">Weight (lbs)</div>
                    <div className="col-span-3 text-xs text-muted-accent font-medium">Reps</div>
                    <div className="col-span-3 text-xs text-muted-accent font-medium">RIR</div>
                    <div className="col-span-1"></div>
                  </div>

                  <div className="space-y-2">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 text-sm text-muted-accent text-center">{setIndex + 1}</div>
                        <div className="col-span-4">
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.weight}
                            onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                            className="text-center"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.reps}
                            onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                            className="text-center"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="-"
                            value={set.rir}
                            onChange={(e) => updateSet(exercise.id, set.id, 'rir', e.target.value)}
                            className="text-center"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {exercise.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSet(exercise.id, set.id)}
                              className="p-1 text-muted-accent hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addSet(exercise.id)}
                    className="mt-3 w-full text-muted-accent hover:text-bright-accent"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Set
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 opacity-0 animate-fade-in-up stagger-3">
          <Link href="/dashboard/workouts">
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" glow disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-muted-main border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Workout
              </>
            )}
          </Button>
        </div>
      </form>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {showPreviousExercises && (
        <div className="fixed inset-0 bg-muted-main/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-muted-main border border-main/40 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-main/30">
              <h3 className="text-lg font-semibold text-bright-accent">Add Existing Exercise</h3>
              <button
                onClick={() => { setShowPreviousExercises(false); setExerciseSearch(''); }}
                className="p-2 hover:bg-main/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-accent" />
              </button>
            </div>
            
            <div className="p-4 border-b border-main/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-accent" />
                <Input
                  placeholder="Search exercises..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-96 p-4">
              {isLoadingPrevious ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-main border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredPreviousExercises.length === 0 ? (
                <div className="text-center py-8 text-muted-accent">
                  {previousExercises.length === 0 
                    ? 'No previous exercises found. Log some workouts first!'
                    : 'No exercises match your search'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPreviousExercises.map((exercise, index) => (
                    <button
                      key={index}
                      onClick={() => addExistingExercise(exercise)}
                      className="w-full text-left p-4 rounded-xl border border-main/30 hover:border-accent/50 hover:bg-main/10 transition-all group"
                    >
                      <div className="font-medium text-bright-accent group-hover:text-accent transition-colors">
                        {exercise.exercise_name}
                      </div>
                      {exercise.sets.length > 0 && (
                        <div className="text-sm text-muted-accent mt-1">
                          Last: {exercise.sets.map(s => `${s.weight}lbs x ${s.reps}`).join(', ')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
