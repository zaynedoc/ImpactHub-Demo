'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Calendar, Dumbbell, MoreVertical, Trash2, Edit, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toast, useToastLocal } from '@/components/ui/Toast';

interface WorkoutExercise {
  id: string;
  exercise_name: string;
  order_index: number;
  sets?: { weight: number; reps: number }[];
}

interface Workout {
  id: string;
  title: string;
  workout_date: string;
  notes: string | null;
  duration_minutes: number | null;
  status: string;
  workout_exercises?: WorkoutExercise[];
}

export default function WorkoutsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { toast, showToast, hideToast } = useToastLocal();

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const response = await fetch('/api/workouts?pageSize=50');
      const result = await response.json();
      
      if (result.success) {
        setWorkouts(result.data || []);
      } else {
        console.error('Failed to fetch workouts:', result.error);
        showToast('Failed to load workouts', 'error');
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
      showToast('Failed to load workouts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;

    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        setWorkouts(workouts.filter(w => w.id !== workoutId));
        showToast('Workout deleted successfully', 'success');
      } else {
        showToast(result.error || 'Failed to delete workout', 'error');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      showToast('Failed to delete workout', 'error');
    }
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setShowDateFilter(false);
  };

  const filteredWorkouts = workouts.filter((workout) => {
    // Search filter
    const matchesSearch = workout.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date filter
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && workout.workout_date >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && workout.workout_date <= endDate;
    }
    
    return matchesSearch && matchesDate;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-main animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-bright-accent">Workouts</h1>
          <p className="text-muted-accent mt-1">View and manage your workout history</p>
        </div>
        <Link href="/dashboard/workouts/new">
          <Button glow className="group">
            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            New Workout
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in-up stagger-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-accent" />
          <Input
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowDateFilter(!showDateFilter)}
          className={startDate || endDate ? 'border-main text-accent' : ''}
        >
          <Calendar className="w-4 h-4 mr-2" />
          {startDate || endDate ? 'Date Filtered' : 'Filter by Date'}
        </Button>
      </div>

      {/* Date Filter Panel */}
      {showDateFilter && (
        <div className="glass-surface rounded-xl p-4 opacity-0 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-accent mb-2">From</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-accent mb-2">To</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={clearDateFilter}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {filteredWorkouts.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="w-8 h-8 text-muted-accent" />}
          title="No workouts found"
          description={
            searchQuery
              ? "Try adjusting your search query"
              : "Start logging your first workout to track your progress"
          }
          action={
            !searchQuery && (
              <Link href="/dashboard/workouts/new">
                <Button glow>
                  <Plus className="w-4 h-4 mr-2" />
                  Log First Workout
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard 
              key={workout.id} 
              workout={workout} 
              onDelete={handleDeleteWorkout}
            />
          ))}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}

function WorkoutCard({
  workout,
  onDelete,
}: {
  workout: Workout;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const exerciseCount = workout.workout_exercises?.length || 0;
  const exercises = workout.workout_exercises || [];
  
  // Calculate total volume from sets
  let totalVolume = 0;
  exercises.forEach(ex => {
    ex.sets?.forEach(set => {
      totalVolume += set.weight * set.reps;
    });
  });

  return (
    <div className="glass-surface rounded-xl p-6 hover:border-main/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-main group">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/dashboard/workouts/${workout.id}`} className="flex-1">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-main/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-main/30 group-hover:shadow-glow-main transition-all duration-300">
              <Dumbbell className="w-6 h-6 text-main" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-bright-accent mb-1 group-hover:text-accent transition-colors">
                {workout.title}
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-accent">
                <span>
                  {new Date(workout.workout_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span>{exerciseCount} exercises</span>
                {workout.duration_minutes && <span>{workout.duration_minutes} min</span>}
                {totalVolume > 0 && (
                  <span>{totalVolume.toLocaleString()} lbs volume</span>
                )}
              </div>
              {exercises.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {exercises.slice(0, 4).map((exercise) => (
                    <span
                      key={exercise.id}
                      className="px-2 py-1 bg-main/20 rounded text-xs text-accent border border-main/30"
                    >
                      {exercise.exercise_name}
                    </span>
                  ))}
                  {exercises.length > 4 && (
                    <span className="px-2 py-1 bg-muted-main/50 rounded text-xs text-muted-accent border border-main/20">
                      +{exercises.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-muted-accent hover:text-bright-accent hover:bg-main/20 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 glass-surface rounded-lg shadow-xl z-20">
                <Link href={`/dashboard/workouts/${workout.id}/edit`}>
                  <button className="w-full px-4 py-2 text-left text-sm text-bright-accent hover:bg-main/20 flex items-center gap-2 rounded-t-lg transition-colors">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </Link>
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(workout.id);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-b-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
