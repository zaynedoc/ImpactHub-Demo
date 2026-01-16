'use client';

import Link from 'next/link';
import {
  Dumbbell,
  TrendingUp,
  Trophy,
  Plus,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const recentWorkouts = [
  { id: '1', title: 'Push Day', date: '2024-01-15', exercises: 5, duration: '45 min' },
  { id: '2', title: 'Pull Day', date: '2024-01-13', exercises: 6, duration: '52 min' },
  { id: '3', title: 'Leg Day', date: '2024-01-11', exercises: 4, duration: '38 min' },
];

const recentPRs = [
  { exercise: 'Bench Press', weight: '225 lbs', date: '2024-01-15' },
  { exercise: 'Squat', weight: '315 lbs', date: '2024-01-11' },
  { exercise: 'Deadlift', weight: '405 lbs', date: '2024-01-08' },
];

export default function DashboardPage() {
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
          value="4"
          change="+2 from last week"
          changeType="positive"
          delay={0}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Volume"
          value="28,450 lbs"
          change="+12% from last week"
          changeType="positive"
          delay={1}
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="PRs This Month"
          value="3"
          change="Keep pushing!"
          changeType="neutral"
          delay={2}
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Current Streak"
          value="7 days"
          change="Personal best!"
          changeType="positive"
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
                      {workout.exercises} exercises - {workout.duration}
                    </p>
                  </div>
                  <div className="text-sm text-muted-accent">
                    {new Date(workout.date).toLocaleDateString('en-US', {
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
                  <h3 className="font-medium text-bright-accent">{pr.exercise}</h3>
                  <p className="text-sm text-accent font-medium">{pr.weight}</p>
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
              href="/dashboard/workouts"
              className="group text-accent hover:text-bright-accent text-sm flex items-center gap-1 transition-colors font-medium"
            >
              Full Calendar
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={day} className="text-center group">
              <div className="text-xs text-muted-accent mb-2">{day}</div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto transition-all duration-300 cursor-pointer ${
                  index < 4
                    ? 'bg-main text-bright-accent shadow-glow-main group-hover:scale-110'
                    : 'bg-muted-main/50 text-muted-accent border border-main/20 group-hover:border-main/40 group-hover:text-accent'
                }`}
              >
                {index < 4 ? (
                  <Dumbbell className="w-4 h-4" />
                ) : (
                  <span className="text-sm">{13 + index}</span>
                )}
              </div>
            </div>
          ))}
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
