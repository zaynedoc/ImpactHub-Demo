'use client';

import { useState } from 'react';
import { X, Calendar, Play, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PlanData {
  name: string;
  description: string;
  weeks: number;
  daysPerWeek: number;
  workouts: Array<{
    day: number;
    name: string;
    focus: string;
    exercises: Array<{
      name: string;
      sets: number | string;
      reps: string;
      restSeconds: number;
      notes?: string;
    }>;
  }>;
}

interface SavedProgram {
  id: string;
  name: string;
  weeks: number;
  days_per_week: number;
  plan_data: PlanData;
}

interface ApplyProgramModalProps {
  program: SavedProgram;
  onClose: () => void;
  onApplied: () => void;
}

export function ApplyProgramModal({ program, onClose, onApplied }: ApplyProgramModalProps) {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  });
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const res = await fetch('/api/programs/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: program.id,
          start_date: startDate,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        onApplied();
      } else {
        setError(data.error || 'Failed to apply program');
      }
    } catch (err) {
      console.error('Failed to apply program:', err);
      setError('Failed to apply program. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const calculateEndDate = () => {
    if (!startDate) return '';
    // Parse date correctly to avoid timezone issues
    const start = new Date(startDate + 'T00:00:00');
    const totalDays = program.plan_data.weeks * 7 - 1;
    const end = new Date(start);
    end.setDate(start.getDate() + totalDays);
    return end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const totalWorkouts = program.plan_data.weeks * program.plan_data.daysPerWeek;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-muted-main border border-main/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between p-4 border-b border-main/30">
          <h3 className="text-lg font-semibold text-bright-accent">Apply Program</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-main/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-accent" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-main/10 border border-main/30 rounded-xl p-4">
            <h4 className="font-semibold text-bright-accent mb-2">{program.name}</h4>
            <div className="flex flex-wrap gap-4 text-sm text-muted-accent">
              <span>{program.plan_data.weeks} weeks</span>
              <span>{program.plan_data.daysPerWeek} days/week</span>
              <span>{totalWorkouts} total workouts</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-bright-accent mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-accent mt-2">
              Program will run from {new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })} to {calculateEndDate()}
            </p>
          </div>

          <div className="bg-muted-main/50 border border-main/20 rounded-xl p-4">
            <h4 className="text-sm font-medium text-bright-accent mb-2">What happens next:</h4>
            <ul className="space-y-2 text-sm text-muted-accent">
              <li className="flex items-start gap-2">
                <span className="text-main">*</span>
                {totalWorkouts} workouts will be scheduled on your calendar
              </li>
              <li className="flex items-start gap-2">
                <span className="text-main">*</span>
                Workouts will repeat each week based on the program
              </li>
              <li className="flex items-start gap-2">
                <span className="text-main">*</span>
                Start each scheduled workout when you are ready
              </li>
            </ul>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-main/30">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button glow className="flex-1" onClick={handleApply} disabled={isApplying}>
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Apply Program
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
