'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  TrendingUp,
  Trophy,
  Plus,
  ArrowRight,
  Flame,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Workout {
  id: string;
  title: string;
  workout_date: string;
  duration_minutes: number | null;
  workout_exercises?: { id: string; exercise_name: string }[];
}

interface PR {
  exercise_name: string;
  weight: number;
  reps: number;
  date: string;
}

interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
}

interface VolumeSummary {
  total_volume: number;
  total_sets: number;
  total_reps: number;
  avg_volume_per_workout: number;
  workout_count: number;
}

export default function DashboardPage() {
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [recentPRs, setRecentPRs] = useState<PR[]>([]);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [volumeSummary, setVolumeSummary] = useState<VolumeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workoutDays, setWorkoutDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch recent workouts
      const workoutsRes = await fetch('/api/workouts?pageSize=3');
      const workoutsData = await workoutsRes.json();
      if (workoutsData.success) {
        setRecentWorkouts(workoutsData.data || []);
        
        // Calculate which days this week have workouts
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        
        const daysWithWorkouts = new Set<number>();
        (workoutsData.data || []).forEach((w: Workout) => {
          const workoutDate = new Date(w.workout_date);
          if (workoutDate >= startOfWeek) {
            const dayOfWeek = workoutDate.getDay();
            // Convert Sunday (0) to 6, Monday (1) to 0, etc.
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            daysWithWorkouts.add(adjustedDay);
          }
        });
        setWorkoutDays(daysWithWorkouts);
      }

      // Fetch PRs
      const prsRes = await fetch('/api/progress/prs?limit=3');
      const prsData = await prsRes.json();
      if (prsData.success) {
        setRecentPRs(prsData.data || []);
      }

      // Fetch streak info
      const streakRes = await fetch('/api/progress/streaks');
      const streakData = await streakRes.json();
      if (streakData.success) {
        setStreakInfo(streakData.data);
      }

      // Fetch volume for this week
      const volumeRes = await fetch('/api/progress/volume?days=7');
      const volumeData = await volumeRes.json();
      if (volumeData.success && volumeData.data?.summary) {
        setVolumeSummary(volumeData.data.summary);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate this week's workouts count
  const workoutsThisWeek = workoutDays.size;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-main animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-bright-accent">Dashboard</h1>
          <p className="text-muted-accent mt-1">Welcome back! Here is your training overview.</p>
        </div>
        <Link href="/dashboard/workouts/new">
          <Button glow className="group">
            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            New Workout
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Dumbbell className="w-5 h-5" />}
          label="Workouts This Week"
          value={workoutsThisWeek.toString()}
          change={workoutsThisWeek > 0 ? "Keep it up!" : "Start training!"}
          changeType={workoutsThisWeek > 0 ? "positive" : "neutral"}
          delay={0}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Volume (7d)"
          value={volumeSummary ? `${volumeSummary.total_volume.toLocaleString()} lbs` : "0 lbs"}
          change={volumeSummary && volumeSummary.total_sets > 0 ? `${volumeSummary.total_sets} sets completed` : "No data yet"}
          changeType={volumeSummary && volumeSummary.total_volume > 0 ? "positive" : "neutral"}
          delay={1}
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Recent PRs"
          value={recentPRs.length.toString()}
          change={recentPRs.length > 0 ? "Keep pushing!" : "Set some PRs!"}
          changeType={recentPRs.length > 0 ? "positive" : "neutral"}
          delay={2}
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Current Streak"
          value={streakInfo ? `${streakInfo.current_streak} days` : "0 days"}
          change={streakInfo && streakInfo.current_streak >= streakInfo.longest_streak && streakInfo.current_streak > 0 ? "Personal best!" : "Build your streak!"}
          changeType={streakInfo && streakInfo.current_streak > 0 ? "positive" : "neutral"}
          delay={3}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card opacity-0 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-bright-accent">Recent Workouts</h2>
            <Link
              href="/dashboard/workouts"
              className="group text-accent hover:text-bright-accent text-sm flex items-center gap-1 transition-colors font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentWorkouts.map((workout, index) => (
              <Link
                key={workout.id}
                href={`/dashboard/workouts/${workout.id}`}
                className="group block p-4 bg-muted-main/40 rounded-lg border border-main/35 hover:border-accent/50 hover:bg-main/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-main"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-bright-accent group-hover:text-accent transition-colors">
                      {workout.title}
                    </h3>
                    <p className="text-sm text-muted-accent">
                      {workout.workout_exercises?.length || 0} exercises
                      {workout.duration_minutes && ` - ${workout.duration_minutes} min`}
                    </p>
                  </div>
                  <div className="text-sm text-muted-accent">
                    {new Date(workout.workout_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {recentWorkouts.length === 0 && (
            <div className="text-center py-8">
              <Dumbbell className="w-12 h-12 text-main/40 mx-auto mb-4 animate-pulse" />
              <p className="text-muted-accent">No workouts yet. Start your first one!</p>
              <Link href="/dashboard/workouts/new">
                <Button glow className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Log First Workout
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="card opacity-0 animate-fade-in-up stagger-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-bright-accent">Recent PRs</h2>
            <Link
              href="/dashboard/progress"
              className="group text-accent hover:text-bright-accent text-sm flex items-center gap-1 transition-colors font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentPRs.map((pr, index) => (
              <div
                key={index}
                className="group flex items-center gap-4 p-4 bg-muted-main/40 rounded-lg border border-main/35 hover:border-accent/50 transition-all duration-300 hover:shadow-glow-accent"
              >
                <div className="w-10 h-10 bg-accent/30 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:shadow-glow-accent transition-all duration-300">
                  <Trophy className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-bright-accent">{pr.exercise_name}</h3>
                  <p className="text-sm text-accent font-medium">{pr.weight} lbs x {pr.reps} reps</p>
                </div>
                <div className="text-sm text-bright-accent/70">
                  {new Date(pr.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>

          {recentPRs.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-accent/40 mx-auto mb-4 animate-pulse" />
              <p className="text-muted-accent">No PRs yet. Keep training!</p>
            </div>
          )}
        </div>
      </div>

      <div className="card opacity-0 animate-fade-in-up stagger-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-bright-accent">This Week</h2>
          <Link
            href="/dashboard/calendar"
            className="group text-accent hover:text-bright-accent text-sm flex items-center gap-1 transition-colors font-medium"
          >
            Full Calendar
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
            const hasWorkout = workoutDays.has(index);
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + 1);
            const dateForDay = new Date(startOfWeek);
            dateForDay.setDate(startOfWeek.getDate() + index);
            const dayNumber = dateForDay.getDate();
            
            return (
              <div key={day} className="text-center group">
                <div className="text-xs text-muted-accent mb-2">{day}</div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto transition-all duration-300 cursor-pointer ${
                    hasWorkout
                      ? 'bg-main text-bright-accent shadow-glow-main group-hover:scale-110'
                      : 'bg-muted-main/50 text-muted-accent border border-main/20 group-hover:border-main/40 group-hover:text-accent'
                  }`}
                >
                  {hasWorkout ? (
                    <Dumbbell className="w-4 h-4" />
                  ) : (
                    <span className="text-sm">{dayNumber}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  change,
  changeType,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  delay?: number;
}) {
  const changeColors = {
    positive: 'text-accent',
    negative: 'text-red-400',
    neutral: 'text-muted-accent',
  };

  return (
    <div 
      className="group card-interactive opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${0.1 + delay * 0.1}s` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-main/30 rounded-lg flex items-center justify-center text-accent group-hover:bg-main/50 group-hover:shadow-glow-main transition-all duration-300">
          <div className="group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        <span className="text-bright-accent/80 text-sm font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-bright-accent mb-1 group-hover:text-accent transition-colors">
        {value}
      </div>
      <div className={`text-sm ${changeColors[changeType]}`}>{change}</div>
    </div>
  );
}
