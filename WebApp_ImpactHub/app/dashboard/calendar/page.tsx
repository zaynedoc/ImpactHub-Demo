'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Plus,
  Loader2,
  Calendar as CalendarIcon,
  Play,
  Clock,
  Check,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Workout {
  id: string;
  title: string;
  workout_date: string;
  duration_minutes: number | null;
  workout_exercises?: { id: string }[];
}

interface ScheduledWorkout {
  id: string;
  title: string;
  workout_date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'skipped';
  notes: string | null;
  scheduled_exercises: string | null;
  program_id: string | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkouts();
    fetchScheduledWorkouts();
  }, [currentDate]);

  const fetchWorkouts = async () => {
    try {
      const response = await fetch('/api/workouts?pageSize=100');
      const result = await response.json();

      if (result.success) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
        const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
        
        const monthWorkouts = (result.data || []).filter((w: Workout) => 
          w.workout_date >= firstDay && w.workout_date <= lastDay
        );
        setWorkouts(monthWorkouts);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const fetchScheduledWorkouts = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const response = await fetch(`/api/scheduled-workouts?start=${firstDay}&end=${lastDay}`);
      const result = await response.json();

      if (result.success) {
        setScheduledWorkouts(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    
    return { daysInMonth, adjustedStartDay };
  };

  const { daysInMonth, adjustedStartDay } = getDaysInMonth(currentDate);

  const getWorkoutsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return workouts.filter(w => w.workout_date === dateStr);
  };

  const getScheduledForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduledWorkouts.filter(w => w.workout_date === dateStr && w.status !== 'completed');
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setIsLoading(true);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const formatDateForLink = (day: number) => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const selectedDateWorkouts = selectedDate 
    ? workouts.filter(w => w.workout_date === selectedDate)
    : [];

  const selectedDateScheduled = selectedDate
    ? scheduledWorkouts.filter(w => w.workout_date === selectedDate && w.status !== 'completed')
    : [];

  const handleStartScheduled = async (scheduledId: string) => {
    // Navigate to new workout page with pre-filled data from scheduled workout
    window.location.href = `/dashboard/workouts/new?scheduled=${scheduledId}`;
  };

  const handleDeleteScheduled = async (scheduledId: string) => {
    if (!confirm('Delete this scheduled workout?')) return;
    
    try {
      const res = await fetch(`/api/scheduled-workouts/${scheduledId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setScheduledWorkouts(prev => prev.filter(s => s.id !== scheduledId));
      }
    } catch (err) {
      console.error('Failed to delete scheduled workout:', err);
    }
  };

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
          <h1 className="text-3xl font-bold text-bright-accent">Calendar</h1>
          <p className="text-muted-accent mt-1">View your workout schedule</p>
        </div>
        <Link href="/dashboard/workouts/new">
          <Button glow className="group">
            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            New Workout
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card opacity-0 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-main/20 text-muted-accent hover:text-accent transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-bright-accent">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-main/20 text-muted-accent hover:text-accent transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-accent py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: adjustedStartDay }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayWorkouts = getWorkoutsForDay(day);
              const dayScheduled = getScheduledForDay(day);
              const hasWorkouts = dayWorkouts.length > 0;
              const hasScheduled = dayScheduled.length > 0;
              const dateStr = formatDateForLink(day);
              const isSelected = selectedDate === dateStr;
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-300 group relative ${
                    isToday(day)
                      ? 'bg-accent/30 text-accent border border-accent/50'
                      : hasWorkouts
                      ? 'bg-main/30 text-bright-accent hover:bg-main/50'
                      : hasScheduled
                      ? 'bg-accent/10 text-bright-accent hover:bg-accent/20 border border-dashed border-accent/30'
                      : 'hover:bg-muted-main/50 text-muted-accent hover:text-bright-accent'
                  } ${isSelected ? 'ring-2 ring-accent shadow-glow-accent' : ''}`}
                >
                  <span className={`text-sm ${isToday(day) ? 'font-bold' : ''}`}>
                    {day}
                  </span>
                  <div className="flex gap-0.5">
                    {/* Completed workout dots */}
                    {dayWorkouts.slice(0, 2).map((_, i) => (
                      <div
                        key={`w-${i}`}
                        className="w-1.5 h-1.5 rounded-full bg-main group-hover:bg-accent transition-colors"
                      />
                    ))}
                    {/* Scheduled workout dots (hollow) */}
                    {dayScheduled.slice(0, 2).map((_, i) => (
                      <div
                        key={`s-${i}`}
                        className="w-1.5 h-1.5 rounded-full border border-accent bg-transparent"
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card opacity-0 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-6">
            <CalendarIcon className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-bright-accent">
              {selectedDate 
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'short', 
                    day: 'numeric' 
                  })
                : 'Select a Day'}
            </h2>
          </div>

          {selectedDate ? (
            <div className="space-y-4">
              {/* Scheduled Workouts */}
              {selectedDateScheduled.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-accent flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Scheduled
                  </h3>
                  {selectedDateScheduled.map((scheduled) => (
                    <div
                      key={scheduled.id}
                      className="p-4 bg-accent/10 rounded-lg border border-dashed border-accent/30"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-bright-accent">{scheduled.title}</h4>
                          {scheduled.notes && (
                            <p className="text-xs text-muted-accent mt-1 line-clamp-2">{scheduled.notes}</p>
                          )}
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteScheduled(scheduled.id)}
                          className="p-1.5 text-muted-accent hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete this workout"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <Button 
                        size="sm" 
                        glow 
                        className="w-full"
                        onClick={() => handleStartScheduled(scheduled.id)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start Workout
                      </Button>
                      {scheduled.program_id && (
                        <Link 
                          href={`/dashboard/programs/${scheduled.program_id}`}
                          className="block text-xs text-main hover:text-accent mt-2 transition-colors"
                        >
                          View Program ?
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Workouts */}
              {selectedDateWorkouts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-accent flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Completed
                  </h3>
                  {selectedDateWorkouts.map((workout) => (
                    <Link
                      key={workout.id}
                      href={`/dashboard/workouts/${workout.id}`}
                      className="group block p-4 bg-muted-main/40 rounded-lg border border-main/35 hover:border-accent/50 hover:bg-main/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-main"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-main/30 rounded-lg flex items-center justify-center group-hover:bg-main/50 transition-colors">
                          <Dumbbell className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-medium text-bright-accent group-hover:text-accent transition-colors">
                            {workout.title}
                          </h3>
                          <p className="text-sm text-muted-accent">
                            {workout.workout_exercises?.length || 0} exercises
                            {workout.duration_minutes && ` - ${workout.duration_minutes} min`}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {selectedDateWorkouts.length === 0 && selectedDateScheduled.length === 0 && (
                <div className="text-center py-8">
                  <Dumbbell className="w-12 h-12 text-main/40 mx-auto mb-4" />
                  <p className="text-muted-accent mb-4">No workouts on this day</p>
                  <Link href="/dashboard/workouts/new">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Log Workout
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-accent">
              <CalendarIcon className="w-12 h-12 text-main/40 mx-auto mb-4" />
              <p>Click on a day to see workout details</p>
            </div>
          )}
        </div>
      </div>

      <div className="card opacity-0 animate-fade-in-up stagger-4">
        <h2 className="text-lg font-semibold text-bright-accent mb-4">
          Monthly Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted-main/30 rounded-lg border border-main/20">
            <div className="text-2xl font-bold text-accent">{workouts.length}</div>
            <div className="text-sm text-muted-accent">Total Workouts</div>
          </div>
          <div className="text-center p-4 bg-muted-main/30 rounded-lg border border-main/20">
            <div className="text-2xl font-bold text-bright-accent">
              {new Set(workouts.map(w => w.workout_date)).size}
            </div>
            <div className="text-sm text-muted-accent">Active Days</div>
          </div>
          <div className="text-center p-4 bg-muted-main/30 rounded-lg border border-main/20">
            <div className="text-2xl font-bold text-bright-accent">
              {workouts.reduce((acc, w) => acc + (w.workout_exercises?.length || 0), 0)}
            </div>
            <div className="text-sm text-muted-accent">Total Exercises</div>
          </div>
          <div className="text-center p-4 bg-muted-main/30 rounded-lg border border-main/20">
            <div className="text-2xl font-bold text-bright-accent">
              {Math.round(workouts.reduce((acc, w) => acc + (w.duration_minutes || 0), 0))}
            </div>
            <div className="text-sm text-muted-accent">Total Minutes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
