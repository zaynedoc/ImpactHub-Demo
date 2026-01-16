'use client';

import { useState } from 'react';
import {
  TrendingUp,
  Trophy,
  Flame,
  Calendar,
  BarChart3,
  Target,
} from 'lucide-react';

const mockPRs = [
  { exercise: 'Bench Press', current: 225, previous: 215, date: '2024-01-15', unit: 'lbs' },
  { exercise: 'Squat', current: 315, previous: 305, date: '2024-01-11', unit: 'lbs' },
  { exercise: 'Deadlift', current: 405, previous: 385, date: '2024-01-08', unit: 'lbs' },
  { exercise: 'Overhead Press', current: 145, previous: 140, date: '2024-01-05', unit: 'lbs' },
  { exercise: 'Barbell Row', current: 205, previous: 195, date: '2024-01-03', unit: 'lbs' },
];

const mockVolumeData = [
  { week: 'Week 1', volume: 45000 },
  { week: 'Week 2', volume: 48000 },
  { week: 'Week 3', volume: 52000 },
  { week: 'Week 4', volume: 49000 },
  { week: 'Week 5', volume: 55000 },
  { week: 'Week 6', volume: 58000 },
];

const mockMuscleVolume = [
  { muscle: 'Chest', sets: 18, target: 20 },
  { muscle: 'Back', sets: 22, target: 20 },
  { muscle: 'Shoulders', sets: 14, target: 15 },
  { muscle: 'Legs', sets: 16, target: 20 },
  { muscle: 'Arms', sets: 12, target: 12 },
  { muscle: 'Core', sets: 6, target: 10 },
];

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-bright-accent">Progress</h1>
          <p className="text-muted-accent mt-1">Track your fitness journey over time</p>
        </div>
        <div className="flex gap-2 glass-surface rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                timeRange === range
                  ? 'bg-main text-bright-accent shadow-glow-main'
                  : 'text-muted-accent hover:text-bright-accent hover:bg-main/20'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Volume"
          value="307,000 lbs"
          change="+15.2%"
          changeType="positive"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="New PRs"
          value="5"
          change="This month"
          changeType="neutral"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Workout Streak"
          value="14 days"
          change="Best: 21 days"
          changeType="neutral"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Workouts"
          value="18"
          change="This month"
          changeType="neutral"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-surface rounded-xl p-6 opacity-0 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-bright-accent flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-main" />
              Weekly Volume
            </h2>
          </div>
          
          <div className="h-64 flex items-end gap-2">
            {mockVolumeData.map((data, index) => {
              const maxVolume = Math.max(...mockVolumeData.map((d) => d.volume));
              const height = (data.volume / maxVolume) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                  <div
                    className="w-full bg-gradient-to-t from-main to-accent rounded-t-md transition-all duration-300 group-hover:shadow-glow-main"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-muted-accent group-hover:text-accent transition-colors">{data.week.split(' ')[1]}</span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-center text-sm text-muted-accent">
            Total: <span className="text-accent font-medium">{mockVolumeData.reduce((acc, d) => acc + d.volume, 0).toLocaleString()} lbs</span>
          </div>
        </div>

        <div className="glass-surface rounded-xl p-6 opacity-0 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-bright-accent flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Weekly Sets by Muscle
            </h2>
          </div>
          
          <div className="space-y-4">
            {mockMuscleVolume.map((muscle) => {
              const percentage = Math.min((muscle.sets / muscle.target) * 100, 100);
              const isOverTarget = muscle.sets >= muscle.target;
              
              return (
                <div key={muscle.muscle} className="group">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-bright-accent/80 group-hover:text-bright-accent transition-colors">{muscle.muscle}</span>
                    <span className={isOverTarget ? 'text-accent' : 'text-muted-accent'}>
                      {muscle.sets}/{muscle.target} sets
                    </span>
                  </div>
                  <div className="h-2 bg-muted-main/50 rounded-full overflow-hidden border border-main/20">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverTarget ? 'bg-gradient-to-r from-main to-accent' : 'bg-main'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-surface rounded-xl p-6 opacity-0 animate-fade-in-up stagger-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-bright-accent flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Personal Records
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-accent border-b border-main/30">
                <th className="pb-3 font-medium">Exercise</th>
                <th className="pb-3 font-medium">Current PR</th>
                <th className="pb-3 font-medium">Previous</th>
                <th className="pb-3 font-medium">Improvement</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockPRs.map((pr, index) => {
                const improvement = pr.current - pr.previous;
                const percentImprovement = ((improvement / pr.previous) * 100).toFixed(1);
                
                return (
                  <tr key={index} className="border-b border-main/20 hover:bg-main/10 transition-colors">
                    <td className="py-4">
                      <span className="font-medium text-bright-accent">{pr.exercise}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-accent font-semibold">
                        {pr.current} {pr.unit}
                      </span>
                    </td>
                    <td className="py-4 text-muted-accent">
                      {pr.previous} {pr.unit}
                    </td>
                    <td className="py-4">
                      <span className="text-main">
                        +{improvement} {pr.unit} ({percentImprovement}%)
                      </span>
                    </td>
                    <td className="py-4 text-muted-accent">
                      {new Date(pr.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}) {
  const changeColors = {
    positive: 'text-main',
    negative: 'text-red-400',
    neutral: 'text-muted-accent',
  };

  return (
    <div className="glass-surface rounded-xl p-6 hover:border-main/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-main group">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-main/20 rounded-lg flex items-center justify-center text-main group-hover:bg-main/30 group-hover:shadow-glow-main transition-all duration-300">
          {icon}
        </div>
        <span className="text-muted-accent text-sm">{label}</span>
      </div>
      <div className="text-3xl font-bold text-bright-accent mb-1 group-hover:text-accent transition-colors">{value}</div>
      <div className={`text-sm ${changeColors[changeType]}`}>{change}</div>
    </div>
  );
}
