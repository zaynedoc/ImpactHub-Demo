'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Dumbbell,
  ChevronDown,
  ChevronRight,
  Play,
  Trash2,
  Sparkles,
  Clock,
  Target,
  Loader2,
  Edit,
  StopCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ApplyProgramModal } from '@/components/programs/ApplyProgramModal';

interface Exercise {
  name: string;
  sets: number | string;
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
  created_at: string;
}

export default function ProgramDetailPage() {
const router = useRouter();
const params = useParams();
const programId = params.id as string;
  
const [program, setProgram] = useState<SavedProgram | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
const [showApplyModal, setShowApplyModal] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const [isDiscontinuing, setIsDiscontinuing] = useState(false);

  useEffect(() => {
    if (programId) {
      fetchProgram();
    }
  }, [programId]);

  const fetchProgram = async () => {
    try {
      const res = await fetch(`/api/programs/${programId}`);
      const data = await res.json();
      if (data.success) {
        setProgram(data.data);
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/programs/${programId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard/programs');
      }
    } catch (err) {
      console.error('Failed to delete program:', err);
      alert('Failed to delete program');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDiscontinue = async () => {
    if (!confirm('This will remove all future scheduled workouts from this program. Continue?')) return;
    
    setIsDiscontinuing(true);
    try {
      // Delete all future scheduled workouts for this program
      const res = await fetch(`/api/programs/${programId}/discontinue`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setProgram(prev => prev ? { ...prev, is_active: false } : null);
        alert(`Removed ${data.data?.deletedCount || 0} scheduled workouts.`);
      }
    } catch (err) {
      console.error('Failed to discontinue program:', err);
      alert('Failed to discontinue program');
    } finally {
      setIsDiscontinuing(false);
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

  const expandAll = () => {
    if (program?.plan_data?.workouts) {
      setExpandedDays(new Set(program.plan_data.workouts.map((w) => w.day)));
    }
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
  };

  const formatGoal = (goal: string | null) => {
    if (!goal) return null;
    return goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  const planData = program.plan_data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 opacity-0 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/programs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-bright-accent">{program.name}</h1>
              {program.is_active && (
                <span className="px-2 py-0.5 bg-main/30 text-accent text-xs rounded-full">
                  Active
                </span>
              )}
              {program.source === 'ai' && (
                <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              )}
            </div>
            {program.description && (
              <p className="text-muted-accent">{program.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {/* Edit button - only when not active */}
          {!program.is_active && (
            <Link href={`/dashboard/programs/${programId}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </Link>
          )}
          {/* Discontinue button - only when active */}
          {program.is_active && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscontinue}
              disabled={isDiscontinuing}
              className="text-orange-400 hover:text-orange-300 border-orange-400/50"
            >
              <StopCircle className="w-4 h-4 mr-1" />
              {isDiscontinuing ? 'Stopping...' : 'Discontinue'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || program.is_active}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            title={program.is_active ? 'Discontinue program first' : 'Delete program'}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Program Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 opacity-0 animate-fade-in-up stagger-1">
        <div className="bg-muted-main/50 border border-main/30 rounded-xl p-4 text-center">
          <Calendar className="w-5 h-5 text-main mx-auto mb-2" />
          <div className="text-lg font-bold text-bright-accent">{planData.weeks}</div>
          <div className="text-xs text-muted-accent">Weeks</div>
        </div>
        <div className="bg-muted-main/50 border border-main/30 rounded-xl p-4 text-center">
          <Dumbbell className="w-5 h-5 text-main mx-auto mb-2" />
          <div className="text-lg font-bold text-bright-accent">{planData.daysPerWeek}</div>
          <div className="text-xs text-muted-accent">Days/Week</div>
        </div>
        <div className="bg-muted-main/50 border border-main/30 rounded-xl p-4 text-center">
          <Target className="w-5 h-5 text-main mx-auto mb-2" />
          <div className="text-lg font-bold text-bright-accent">
            {planData.workouts?.reduce((acc, w) => acc + w.exercises.length, 0) || 0}
          </div>
          <div className="text-xs text-muted-accent">Total Exercises</div>
        </div>
        <div className="bg-muted-main/50 border border-main/30 rounded-xl p-4 text-center">
          <Clock className="w-5 h-5 text-main mx-auto mb-2" />
          <div className="text-lg font-bold text-bright-accent capitalize">
            {formatGoal(program.goal) || 'General'}
          </div>
          <div className="text-xs text-muted-accent">Goal</div>
        </div>
      </div>

      {/* Apply Program CTA */}
      <div className="bg-gradient-to-r from-main/20 to-accent/10 border border-main/40 rounded-xl p-6 opacity-0 animate-fade-in-up stagger-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-bright-accent mb-1">
              {program.is_active ? 'Program is Active' : 'Ready to start this program?'}
            </h3>
            <p className="text-sm text-muted-accent">
              {program.is_active 
                ? 'This program is already scheduled on your calendar' 
                : 'Apply it to your calendar and schedule your workouts'}
            </p>
          </div>
          <Button 
            glow={!program.is_active} 
            variant={program.is_active ? 'outline' : undefined}
            onClick={() => setShowApplyModal(true)}
            disabled={program.is_active}
            className={program.is_active ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <Play className="w-4 h-4 mr-2" />
            {program.is_active ? 'Already Active' : 'Apply to Calendar'}
          </Button>
        </div>
      </div>

      {/* Workout Days */}
      <div className="opacity-0 animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-bright-accent">Workouts</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {planData.workouts?.map((workout) => (
            <div
              key={workout.day}
              className="bg-muted-main/50 rounded-xl border border-main/30 overflow-hidden"
            >
              {/* Day Header */}
              <button
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

              {/* Exercises */}
              {expandedDays.has(workout.day) && (
                <div className="border-t border-main/20 p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-muted-accent uppercase">
                        <th className="text-left pb-3 font-medium">Exercise</th>
                        <th className="text-center pb-3 font-medium w-16">Sets</th>
                        <th className="text-center pb-3 font-medium w-20">Reps</th>
                        <th className="text-center pb-3 font-medium w-16">Rest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-main/10">
                      {workout.exercises.map((exercise, idx) => (
                        <tr key={idx} className="group">
                          <td className="py-3">
                            <div className="flex items-start gap-3">
                              <span className="text-muted-accent text-sm w-5 shrink-0">
                                {idx + 1}.
                              </span>
                              <div>
                                <span className="text-bright-accent font-medium">
                                  {exercise.name}
                                </span>
                                {exercise.notes && (
                                  <p className="text-xs text-muted-accent mt-1">
                                    {exercise.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center text-muted-accent py-3">
                            {exercise.sets}
                          </td>
                          <td className="text-center text-muted-accent py-3">
                            {exercise.reps}
                          </td>
                          <td className="text-center text-muted-accent py-3">
                            {exercise.restSeconds}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Program Notes */}
      {planData.notes && (
        <div className="bg-muted-main/30 border border-main/20 rounded-xl p-4 opacity-0 animate-fade-in-up stagger-4">
          <h3 className="text-sm font-medium text-bright-accent mb-2">Program Notes</h3>
          <p className="text-sm text-muted-accent">{planData.notes}</p>
        </div>
      )}

      {/* Apply Program Modal */}
      {showApplyModal && (
        <ApplyProgramModal
          program={program}
          onClose={() => setShowApplyModal(false)}
          onApplied={() => {
            setShowApplyModal(false);
            router.push('/dashboard/calendar');
          }}
        />
      )}
    </div>
  );
}
