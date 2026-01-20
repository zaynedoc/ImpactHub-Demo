'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Trophy,
  Flame,
  Calendar,
  BarChart3,
  Target,
  Loader2,
  Dumbbell,
  Plus,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTier } from '@/hooks/useTier';
import { useDemoStore } from '@/lib/demo';

interface PR {
  exercise_name: string;
  weight: number;
  reps: number;
  date: string;
}

interface VolumeData {
  date: string;
  total_volume: number;
  total_sets: number;
  total_reps: number;
}

interface VolumeSummary {
  total_volume: number;
  total_sets: number;
  total_reps: number;
  avg_volume_per_workout: number;
  workout_count: number;
}

interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
}

// Helper to get today's date string
function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function ProgressPage() {
  const { progressUnlocked, totalWorkouts, workoutsUntilProgressUnlock, isLoading: tierLoading } = useTier();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [prs, setPrs] = useState<PR[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [volumeSummary, setVolumeSummary] = useState<VolumeSummary | null>(null);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Demo store integration
  const { state: demoState } = useDemoStore();
  const isDemo = demoState.isDemo;

  const getDaysForRange = (range: 'week' | 'month' | 'year') => {
    switch (range) {
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
    }
  };

  useEffect(() => {
    // In demo mode, always show progress with demo data
    if (isDemo) {
      fetchDemoProgressData();
    } else if (progressUnlocked) {
      fetchProgressData();
    } else {
      setIsLoading(false);
    }
  }, [timeRange, progressUnlocked, isDemo, demoState.workouts, demoState.personalRecords]);

  const fetchDemoProgressData = () => {
    const days = getDaysForRange(timeRange);
    const todayStr = getTodayStr();
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;
    
    // Get PRs from demo store
    const demoPRs: PR[] = demoState.personalRecords.map(pr => ({
      exercise_name: pr.exercise_name,
      weight: pr.weight,
      reps: pr.reps,
      date: pr.achieved_at,
    }));
    setPrs(demoPRs);
    
    // Calculate volume data from demo workouts
    const completedWorkouts = demoState.workouts
      .filter(w => w.status === 'completed' && w.workout_date >= cutoffStr && w.workout_date <= todayStr);
    
    // Group by date for daily volume
    const dailyVolumeMap = new Map<string, VolumeData>();
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    
    completedWorkouts.forEach(w => {
      let dayVolume = 0;
      let daySets = 0;
      let dayReps = 0;
      
      w.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          const setVolume = s.weight * s.reps;
          dayVolume += setVolume;
          daySets++;
          dayReps += s.reps;
          totalVolume += setVolume;
          totalSets++;
          totalReps += s.reps;
        });
      });
      
      if (dailyVolumeMap.has(w.workout_date)) {
        const existing = dailyVolumeMap.get(w.workout_date)!;
        existing.total_volume += dayVolume;
        existing.total_sets += daySets;
        existing.total_reps += dayReps;
      } else {
        dailyVolumeMap.set(w.workout_date, {
          date: w.workout_date,
          total_volume: dayVolume,
          total_sets: daySets,
          total_reps: dayReps,
        });
      }
    });
    
    setVolumeData(Array.from(dailyVolumeMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
    setVolumeSummary({
      total_volume: totalVolume,
      total_sets: totalSets,
      total_reps: totalReps,
      avg_volume_per_workout: completedWorkouts.length > 0 ? Math.round(totalVolume / completedWorkouts.length) : 0,
      workout_count: completedWorkouts.length,
    });
    
    // Calculate streak from demo data
    let currentStreak = 0;
    const sortedDates = [...new Set(demoState.workouts
      .filter(w => w.status === 'completed')
      .map(w => w.workout_date))]
      .sort((a, b) => b.localeCompare(a));
    
    if (sortedDates.length > 0) {
      let checkDate = new Date(today);
      for (const dateStr of sortedDates) {
        const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (dateStr === checkDateStr) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (dateStr < checkDateStr) {
          break;
        }
      }
    }
    
    setStreakInfo({
      current_streak: currentStreak,
      longest_streak: Math.max(currentStreak, 3),
      last_workout_date: sortedDates[0] || null,
    });
    
    setIsLoading(false);
  };

  const fetchProgressData = async () => {
    setIsLoading(true);
    const days = getDaysForRange(timeRange);

    try {
      // Fetch PRs
      const prsRes = await fetch('/api/progress/prs?limit=10');
      const prsData = await prsRes.json();
      if (prsData.success) {
        setPrs(prsData.data || []);
      }

      // Fetch volume data
      const volumeRes = await fetch(`/api/progress/volume?days=${days}`);
      const volumeDataRes = await volumeRes.json();
      if (volumeDataRes.success) {
        setVolumeData(volumeDataRes.data?.daily || []);
        setVolumeSummary(volumeDataRes.data?.summary || null);
      }

      // Fetch streak info
      const streakRes = await fetch('/api/progress/streaks');
      const streakData = await streakRes.json();
      if (streakData.success) {
        setStreakInfo(streakData.data);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = prs.length > 0 || volumeData.length > 0 || (streakInfo && streakInfo.current_streak > 0);

  if (tierLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-main animate-spin" />
      </div>
    );
  }

  // In demo mode, always show progress page (skip unlock gate)
  // Show workout-based unlock gate only for non-demo users
  if (!isDemo && !progressUnlocked) {
    const progressPercent = Math.min(100, (totalWorkouts / 10) * 100);
    
    return (
      <div className="space-y-6">
        <div className="opacity-0 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-bright-accent">Progress</h1>
          <p className="text-muted-accent mt-1">Track your fitness journey over time</p>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[400px] opacity-0 animate-fade-in-up stagger-2">
          <div className="glass-surface rounded-2xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-main/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-main" />
            </div>
            <h2 className="text-2xl font-bold text-bright-accent mb-3">
              Unlock Progress Tracking
            </h2>
            <p className="text-muted-accent mb-6">
              Log 10 workouts to unlock detailed progress tracking, volume analytics, personal records history, and workout streaks.
            </p>
            
            {/* Progress meter */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-accent">Your progress</span>
                <span className="text-accent font-medium">{totalWorkouts} / 10 workouts</span>
              </div>
              <div className="h-3 bg-muted-main/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-main to-accent rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-accent mt-2">
                {workoutsUntilProgressUnlock > 0 
                  ? `${workoutsUntilProgressUnlock} more workout${workoutsUntilProgressUnlock === 1 ? '' : 's'} to unlock!`
                  : 'Almost there!'}
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/dashboard/workouts/new">
                <Button glow className="w-full">
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Log a Workout
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Volume"
          value={volumeSummary ? `${volumeSummary.total_volume.toLocaleString()} lbs` : '0 lbs'}
          change={volumeSummary && volumeSummary.total_sets > 0 ? `${volumeSummary.total_sets} sets` : 'No data yet'}
          changeType={volumeSummary && volumeSummary.total_volume > 0 ? 'positive' : 'neutral'}
          delay={0}
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Personal Records"
          value={prs.length.toString()}
          change="All time"
          changeType={prs.length > 0 ? 'positive' : 'neutral'}
          delay={1}
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Workout Streak"
          value={streakInfo ? `${streakInfo.current_streak} days` : '0 days'}
          change={streakInfo ? `Best: ${streakInfo.longest_streak} days` : 'Start training!'}
          changeType={streakInfo && streakInfo.current_streak > 0 ? 'positive' : 'neutral'}
          delay={2}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Workouts"
          value={volumeSummary ? volumeSummary.workout_count.toString() : '0'}
          change={`This ${timeRange}`}
          changeType={volumeSummary && volumeSummary.workout_count > 0 ? 'positive' : 'neutral'}
          delay={3}
        />
      </div>

      {!hasData ? (
        <EmptyState
          icon={<Dumbbell className="w-8 h-8 text-muted-accent" />}
          title="No progress data yet"
          description="Start logging workouts to track your progress over time"
          action={
            <Link href="/dashboard/workouts/new">
              <Button glow>
                <Plus className="w-4 h-4 mr-2" />
                Log First Workout
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Volume Chart */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-surface rounded-xl p-6 opacity-0 animate-fade-in-up stagger-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-bright-accent flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-main" />
                  Volume Over Time
                </h2>
              </div>
              
              {volumeData.length > 0 ? (
                <>
                  <div className="flex flex-col">
                    <div className="h-52 flex items-end gap-2">
                      {volumeData.slice(-7).map((data, index) => {
                        const maxVolume = Math.max(...volumeData.map((d) => d.total_volume));
                        const height = maxVolume > 0 ? (data.total_volume / maxVolume) * 100 : 0;
                        
                        return (
                          <div 
                            key={index} 
                            className="flex-1 flex items-end justify-center group"
                            style={{ height: '100%' }}
                          >
                            <div
                              className="w-full bg-gradient-to-t from-main to-accent rounded-t-md transition-all duration-300 group-hover:shadow-glow-main"
                              style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {volumeData.slice(-7).map((data, index) => (
                        <div key={index} className="flex-1 text-center">
                          <span className="text-xs text-muted-accent">
                            {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center text-sm text-muted-accent">
                    Total: <span className="text-accent font-medium">{volumeSummary?.total_volume.toLocaleString() || 0} lbs</span>
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-accent">
                  No volume data for this period
                </div>
              )}
            </div>

            {/* Sets Summary */}
            <div className="glass-surface rounded-xl p-6 opacity-0 animate-fade-in-up stagger-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-bright-accent flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  Training Summary
                </h2>
              </div>
              
              {volumeSummary && volumeSummary.total_sets > 0 ? (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-muted-main/30 rounded-xl border border-main/20">
                    <div className="text-4xl font-bold text-accent mb-2">
                      {volumeSummary.total_sets}
                    </div>
                    <div className="text-muted-accent">Total Sets</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted-main/30 rounded-lg border border-main/20">
                      <div className="text-2xl font-bold text-bright-accent">
                        {volumeSummary.total_reps}
                      </div>
                      <div className="text-sm text-muted-accent">Total Reps</div>
                    </div>
                    <div className="text-center p-4 bg-muted-main/30 rounded-lg border border-main/20">
                      <div className="text-2xl font-bold text-bright-accent">
                        {Math.round(volumeSummary.avg_volume_per_workout).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-accent">Avg Volume/Workout</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-accent">
                  No training data for this period
                </div>
              )}
            </div>
          </div>

          {/* Personal Records Table */}
          {prs.length > 0 && (
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
                      <th className="pb-3 font-medium">Weight</th>
                      <th className="pb-3 font-medium">Reps</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prs.map((pr, index) => (
                      <tr key={index} className="border-b border-main/20 hover:bg-main/10 transition-colors">
                        <td className="py-4">
                          <span className="font-medium text-bright-accent">{pr.exercise_name}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-accent font-semibold">
                            {pr.weight} lbs
                          </span>
                        </td>
                        <td className="py-4 text-muted-accent">
                          {pr.reps} reps
                        </td>
                        <td className="py-4 text-muted-accent">
                          {new Date(pr.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
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
