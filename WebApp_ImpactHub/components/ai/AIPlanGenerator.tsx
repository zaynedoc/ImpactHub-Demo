'use client';

import { useState } from 'react';
import {
  Sparkles,
  Dumbbell,
  Target,
  Calendar,
  Settings2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PlanGeneratorProps {
  onPlanGenerated: (plan: GeneratedPlan) => void;
  usageInfo: {
    used: number;
    limit: number;
    remaining: number;
    canGenerate: boolean;
  } | null;
  isLoadingUsage: boolean;
}

export interface GeneratedPlan {
  name: string;
  description: string;
  weeks: number;
  daysPerWeek: number;
  workouts: {
    day: number;
    name: string;
    focus: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      restSeconds: number;
      notes?: string;
    }[];
  }[];
}

type Goal = 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_fitness';
type Experience = 'beginner' | 'intermediate' | 'advanced';
type Equipment = 'full_gym' | 'home_basic' | 'bodyweight_only' | 'dumbbells_only';

const GOALS: { value: Goal; label: string; description: string }[] = [
  { value: 'strength', label: 'Strength', description: 'Build maximum strength' },
  { value: 'hypertrophy', label: 'Muscle Building', description: 'Increase muscle size' },
  { value: 'endurance', label: 'Endurance', description: 'Improve stamina' },
  { value: 'weight_loss', label: 'Weight Loss', description: 'Burn fat, stay lean' },
  { value: 'general_fitness', label: 'General Fitness', description: 'Overall health' },
];

const EXPERIENCE_LEVELS: { value: Experience; label: string }[] = [
  { value: 'beginner', label: 'Beginner (0-1 year)' },
  { value: 'intermediate', label: 'Intermediate (1-3 years)' },
  { value: 'advanced', label: 'Advanced (3+ years)' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'full_gym', label: 'Full Gym' },
  { value: 'home_basic', label: 'Home Gym' },
  { value: 'dumbbells_only', label: 'Dumbbells Only' },
  { value: 'bodyweight_only', label: 'Bodyweight Only' },
];

const DAYS_OPTIONS = [2, 3, 4, 5, 6, 7] as const;

export function AIPlanGenerator({ onPlanGenerated, usageInfo, isLoadingUsage }: PlanGeneratorProps) {
  const [goal, setGoal] = useState<Goal>('hypertrophy');
  const [experience, setExperience] = useState<Experience>('intermediate');
  const [equipment, setEquipment] = useState<Equipment>('full_gym');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [limitations, setLimitations] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = usageInfo?.canGenerate ?? false;

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          experienceLevel: experience,
          daysPerWeek,
          equipment,
          limitations: limitations.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      onPlanGenerated(data.data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-muted-main/50 rounded-xl border border-main/30 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-main/20 rounded-lg">
          <Sparkles className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-bright-accent">AI Plan Generator</h3>
          <p className="text-sm text-muted-accent">
            Get a personalized workout program in seconds
          </p>
        </div>
      </div>

      {/* Usage indicator */}
      {isLoadingUsage ? (
        <div className="flex items-center gap-2 text-muted-accent text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading usage...
        </div>
      ) : usageInfo && (
        <div className="flex items-center gap-2 text-sm">
          <span className={`font-medium ${canGenerate ? 'text-main' : 'text-red-400'}`}>
            {usageInfo.remaining} / {usageInfo.limit} generations remaining this month
          </span>
        </div>
      )}

      {/* Form */}
      <div className="space-y-5">
        {/* Goal Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-bright-accent mb-3">
            <Target className="w-4 h-4 text-main" />
            Training Goal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {GOALS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  goal === g.value
                    ? 'border-main bg-main/20 text-accent'
                    : 'border-main/30 hover:border-main/50 text-muted-accent hover:text-bright-accent'
                }`}
              >
                <div className="font-medium text-sm">{g.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{g.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-bright-accent mb-3">
            <Dumbbell className="w-4 h-4 text-main" />
            Experience Level
          </label>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((exp) => (
              <button
                key={exp.value}
                onClick={() => setExperience(exp.value)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  experience === exp.value
                    ? 'border-main bg-main/20 text-accent'
                    : 'border-main/30 hover:border-main/50 text-muted-accent hover:text-bright-accent'
                }`}
              >
                {exp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Days per Week */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-bright-accent mb-3">
            <Calendar className="w-4 h-4 text-main" />
            Days per Week
          </label>
          <div className="flex gap-2">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDaysPerWeek(d)}
                className={`w-12 h-12 rounded-lg border font-bold transition-all ${
                  daysPerWeek === d
                    ? 'border-main bg-main/20 text-accent'
                    : 'border-main/30 hover:border-main/50 text-muted-accent hover:text-bright-accent'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-bright-accent mb-3">
            <Settings2 className="w-4 h-4 text-main" />
            Available Equipment
          </label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <button
                key={eq.value}
                onClick={() => setEquipment(eq.value)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  equipment === eq.value
                    ? 'border-main bg-main/20 text-accent'
                    : 'border-main/30 hover:border-main/50 text-muted-accent hover:text-bright-accent'
                }`}
              >
                {eq.label}
              </button>
            ))}
          </div>
        </div>

        {/* Limitations (Optional) */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-bright-accent mb-2">
            <AlertCircle className="w-4 h-4 text-muted-accent" />
            Injuries or Limitations
            <span className="text-xs text-muted-accent font-normal">(optional)</span>
          </label>
          <textarea
            value={limitations}
            onChange={(e) => setLimitations(e.target.value)}
            placeholder="E.g., lower back issues, recovering from shoulder surgery..."
            className="w-full px-4 py-3 bg-muted-main border border-main/30 rounded-lg text-bright-accent placeholder-muted-accent/50 focus:outline-none focus:border-main resize-none"
            rows={2}
            maxLength={500}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        isLoading={isGenerating}
        glow
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          'Generating Your Plan...'
        ) : !canGenerate ? (
          'Monthly Limit Reached'
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate My Workout Plan
          </>
        )}
      </Button>

      {!canGenerate && usageInfo && (
        <p className="text-center text-sm text-muted-accent">
          You&apos;ve used all {usageInfo.limit} plan generations for this month.
          <br />
          Limit resets at the start of next month.
        </p>
      )}
    </div>
  );
}
