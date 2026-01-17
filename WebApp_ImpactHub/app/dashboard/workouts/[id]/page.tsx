'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Dumbbell,
  Calendar,
  Clock,
  Trash2,
  Edit,
  MoreVertical,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Toast, useToastLocal } from '@/components/ui/Toast';

interface Set {
  id: string;
  set_number: number;
  weight: number;
  reps: number;
  rir: number | null;
}

interface WorkoutExercise {
  id: string;
  exercise_name: string;
  order_index: number;
  sets: Set[];
}

interface Workout {
  id: string;
  title: string;
  workout_date: string;
  notes: string | null;
  duration_minutes: number | null;
  status: string;
  workout_exercises: WorkoutExercise[];
}

export default function WorkoutDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast, showToast, hideToast } = useToastLocal();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWorkout();
    }
  }, [id]);

  const fetchWorkout = async () => {
    try {
      const response = await fetch(`/api/workouts/${id}`);
      const result = await response.json();

      if (result.success) {
        setWorkout(result.data);
      } else {
        showToast(result.error || 'Workout not found', 'error');
      }
    } catch (error) {
      console.error('Error fetching workout:', error);
      showToast('Failed to load workout', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workout?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        showToast('Workout deleted successfully', 'success');
        setTimeout(() => {
          router.push('/dashboard/workouts');
        }, 1000);
      } else {
        showToast(result.error || 'Failed to delete workout', 'error');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      showToast('Failed to delete workout', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate totals
  const totalExercises = workout?.workout_exercises?.length || 0;
  const totalSets = workout?.workout_exercises?.reduce(
    (acc, ex) => acc + (ex.sets?.length || 0),
    0
  ) || 0;
  const totalVolume = workout?.workout_exercises?.reduce((acc, ex) => {
    return acc + (ex.sets?.reduce((setAcc, set) => setAcc + set.weight * set.reps, 0) || 0);
  }, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-main animate-spin" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-16">
        <Dumbbell className="w-16 h-16 text-muted-accent mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-bright-accent mb-2">Workout Not Found</h2>
        <p className="text-muted-accent mb-6">This workout may have been deleted.</p>
        <Link href="/dashboard/workouts">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workouts
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 opacity-0 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workouts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-bright-accent">{workout.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-muted-accent">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(workout.workout_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {workout.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {workout.duration_minutes} min
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/workouts/${id}/edit`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-accent hover:text-bright-accent hover:bg-main/20"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 opacity-0 animate-fade-in-up stagger-1">
        <div className="glass-surface rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-accent">{totalExercises}</div>
          <div className="text-sm text-muted-accent">Exercises</div>
        </div>
        <div className="glass-surface rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-accent">{totalSets}</div>
          <div className="text-sm text-muted-accent">Sets</div>
        </div>
        <div className="glass-surface rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-accent">{totalVolume.toLocaleString()}</div>
          <div className="text-sm text-muted-accent">Total Volume (lbs)</div>
        </div>
      </div>

      {/* Notes */}
      {workout.notes && (
        <div className="glass-surface rounded-xl p-4 opacity-0 animate-fade-in-up stagger-2">
          <h3 className="text-sm font-medium text-muted-accent mb-2">Notes</h3>
          <p className="text-bright-accent">{workout.notes}</p>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4 opacity-0 animate-fade-in-up stagger-3">
        <h2 className="text-xl font-semibold text-bright-accent">Exercises</h2>

        {(!workout.workout_exercises || workout.workout_exercises.length === 0) ? (
          <div className="glass-surface rounded-xl p-8 text-center">
            <Dumbbell className="w-12 h-12 text-muted-accent mx-auto mb-4" />
            <p className="text-muted-accent">No exercises logged for this workout.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workout.workout_exercises
              .sort((a, b) => a.order_index - b.order_index)
              .map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="glass-surface rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-main/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-accent">{index + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-bright-accent">
                      {exercise.exercise_name}
                    </h3>
                  </div>

                  {exercise.sets && exercise.sets.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm text-muted-accent border-b border-main/30">
                            <th className="pb-2 font-medium">Set</th>
                            <th className="pb-2 font-medium">Weight</th>
                            <th className="pb-2 font-medium">Reps</th>
                            <th className="pb-2 font-medium">RIR</th>
                            <th className="pb-2 font-medium">Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets
                            .sort((a, b) => a.set_number - b.set_number)
                            .map((set) => (
                              <tr
                                key={set.id}
                                className="border-b border-main/20"
                              >
                                <td className="py-3 text-muted-accent">{set.set_number}</td>
                                <td className="py-3 text-bright-accent font-medium">
                                  {set.weight} lbs
                                </td>
                                <td className="py-3 text-bright-accent">{set.reps}</td>
                                <td className="py-3 text-muted-accent">
                                  {set.rir !== null ? set.rir : '-'}
                                </td>
                                <td className="py-3 text-accent">
                                  {(set.weight * set.reps).toLocaleString()} lbs
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-accent">No sets recorded</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
