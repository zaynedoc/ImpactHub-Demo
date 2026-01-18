'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Dumbbell,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { GeneratedPlan } from './AIPlanGenerator';

interface GeneratedPlanDisplayProps {
  plan: GeneratedPlan;
  onReset: () => void;
  onSave?: (plan: GeneratedPlan) => Promise<void>;
  isSaving?: boolean;
  isSaved?: boolean;
}

export function GeneratedPlanDisplay({ 
  plan, 
  onReset, 
  onSave,
  isSaving = false,
  isSaved = false,
}: GeneratedPlanDisplayProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [copied, setCopied] = useState(false);

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
    setExpandedDays(new Set(plan.workouts.map((w) => w.day)));
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
  };

  const copyPlanAsText = async () => {
    let text = `${plan.name}\n${'='.repeat(plan.name.length)}\n\n`;
    text += `${plan.description}\n\n`;
    text += `Duration: ${plan.weeks} weeks | ${plan.daysPerWeek} days/week\n\n`;

    plan.workouts.forEach((workout) => {
      text += `--- Day ${workout.day}: ${workout.name} (${workout.focus}) ---\n\n`;
      workout.exercises.forEach((ex, i) => {
        text += `${i + 1}. ${ex.name}\n`;
        text += `   ${ex.sets} sets x ${ex.reps} reps | Rest: ${ex.restSeconds}s\n`;
        if (ex.notes) {
          text += `   Note: ${ex.notes}\n`;
        }
        text += '\n';
      });
    });

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <div className="bg-gradient-to-r from-main/30 to-main/10 rounded-xl border border-main/40 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400 font-medium">
                {isSaved ? 'Plan Saved!' : 'Plan Generated!'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-bright-accent mb-2">{plan.name}</h2>
            <p className="text-muted-accent">{plan.description}</p>
          </div>
          <div className="flex gap-2">
            {onSave && !isSaved && (
              <Button 
                glow 
                size="sm" 
                onClick={() => onSave(plan)}
                disabled={isSaving}
                isLoading={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Program'}
              </Button>
            )}
            {isSaved && (
              <Button variant="outline" size="sm" disabled>
                <Check className="w-4 h-4 mr-2 text-green-400" />
                Saved
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </div>
        </div>

        {/* Plan stats */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-main/30">
          <div className="flex items-center gap-2 text-sm text-muted-accent">
            <Calendar className="w-4 h-4 text-main" />
            {plan.weeks} weeks
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-accent">
            <Dumbbell className="w-4 h-4 text-main" />
            {plan.daysPerWeek} days/week
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-accent">
            <Clock className="w-4 h-4 text-main" />
            {plan.workouts.reduce((acc, w) => acc + w.exercises.length, 0)} total exercises
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="ghost" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
        <Button variant="ghost" size="sm" onClick={copyPlanAsText}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy as Text
            </>
          )}
        </Button>
      </div>

      {/* Workout Days */}
      <div className="space-y-3">
        {plan.workouts.map((workout) => (
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
                      <th className="text-center pb-3 font-medium w-20">Sets</th>
                      <th className="text-center pb-3 font-medium w-20">Reps</th>
                      <th className="text-center pb-3 font-medium w-20">Rest</th>
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

      {/* Footer note */}
      <p className="text-center text-sm text-muted-accent">
        This plan is generated by AI. Always consult a fitness professional before starting a new
        program, especially if you have any health concerns.
      </p>
    </div>
  );
}
