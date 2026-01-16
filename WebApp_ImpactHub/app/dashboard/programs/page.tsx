'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Calendar, Users, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

// Programs API not yet implemented - will show empty state for now
// These will be fetched from /api/programs when the API is built

interface Program {
  id: string;
  name: string;
  description: string | null;
  weeks: number;
  days_per_week: number;
  difficulty: string | null;
  is_public: boolean;
}

export default function ProgramsPage() {
  const [activeTab, setActiveTab] = useState<'my' | 'browse'>('my');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [publicPrograms, setPublicPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Programs API will be implemented in Phase 6
    // For now, show empty state
    setIsLoading(false);
  }, []);

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
          <h1 className="text-3xl font-bold text-bright-accent">Programs</h1>
          <p className="text-muted-accent mt-1">Follow structured training programs</p>
        </div>
        <Button glow className="group" disabled>
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Create Program
        </Button>
      </div>

      <div className="flex gap-2 border-b border-main/30 opacity-0 animate-fade-in-up stagger-2">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'my'
              ? 'border-main text-accent'
              : 'border-transparent text-muted-accent hover:text-bright-accent'
          }`}
        >
          My Programs
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'browse'
              ? 'border-main text-accent'
              : 'border-transparent text-muted-accent hover:text-bright-accent'
          }`}
        >
          Browse Programs
        </button>
      </div>

      {activeTab === 'my' && (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-muted-accent" />}
          title="No programs yet"
          description="Program templates feature coming soon! For now, use quick workouts to log your training."
          action={
            <div className="flex gap-3">
              <Link href="/dashboard/workouts/new">
                <Button glow>Log Workout</Button>
              </Link>
            </div>
          }
        />
      )}

      {activeTab === 'browse' && (
        <EmptyState
          icon={<Users className="w-8 h-8 text-muted-accent" />}
          title="Browse Programs Coming Soon"
          description="Community program templates will be available in a future update."
        />
      )}
    </div>
  );
}

