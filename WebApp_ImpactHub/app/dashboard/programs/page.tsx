'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Calendar, Users, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

const mockPrograms = [
  {
    id: '1',
    name: 'Push/Pull/Legs',
    description: 'Classic 6-day split for building muscle and strength',
    weeks: 8,
    daysPerWeek: 6,
    difficulty: 'Intermediate',
    isPublic: true,
    workoutsCompleted: 12,
    totalWorkouts: 48,
  },
  {
    id: '2',
    name: 'Starting Strength',
    description: 'Beginner-friendly program focused on compound lifts',
    weeks: 12,
    daysPerWeek: 3,
    difficulty: 'Beginner',
    isPublic: true,
    workoutsCompleted: 8,
    totalWorkouts: 36,
  },
  {
    id: '3',
    name: 'Custom Upper/Lower',
    description: 'My personalized 4-day upper/lower split',
    weeks: 6,
    daysPerWeek: 4,
    difficulty: 'Intermediate',
    isPublic: false,
    workoutsCompleted: 0,
    totalWorkouts: 24,
  },
];

const publicPrograms = [
  {
    id: 'p1',
    name: '5/3/1 BBB',
    description: 'Jim Wendler\'s famous strength program with Boring But Big accessory work',
    weeks: 16,
    daysPerWeek: 4,
    difficulty: 'Intermediate',
    author: 'ImpactHub',
    users: 1250,
  },
  {
    id: 'p2',
    name: 'GZCLP',
    description: 'Linear progression program for beginners with tier system',
    weeks: 12,
    daysPerWeek: 4,
    difficulty: 'Beginner',
    author: 'ImpactHub',
    users: 890,
  },
  {
    id: 'p3',
    name: 'Reddit PPL',
    description: 'Popular push/pull/legs program from Reddit fitness',
    weeks: 8,
    daysPerWeek: 6,
    difficulty: 'Beginner',
    author: 'Community',
    users: 2100,
  },
];

export default function ProgramsPage() {
  const [activeTab, setActiveTab] = useState<'my' | 'browse'>('my');
  const [programs] = useState(mockPrograms);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-bright-accent">Programs</h1>
          <p className="text-muted-accent mt-1">Follow structured training programs</p>
        </div>
        <Button glow className="group">
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
        <>
          {programs.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-8 h-8 text-muted-accent" />}
              title="No programs yet"
              description="Create your own program or browse community templates"
              action={
                <div className="flex gap-3">
                  <Button glow>Create Program</Button>
                  <Button variant="outline" onClick={() => setActiveTab('browse')}>
                    Browse Programs
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'browse' && (
        <div className="space-y-6 opacity-0 animate-fade-in-up stagger-3">
          <p className="text-muted-accent">
            Discover popular training programs created by the community
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicPrograms.map((program) => (
              <PublicProgramCard key={program.id} program={program} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgramCard({ program }: { program: (typeof mockPrograms)[0] }) {
  const progress = (program.workoutsCompleted / program.totalWorkouts) * 100;

  return (
    <Link
      href={`/dashboard/programs/${program.id}`}
      className="block glass-surface rounded-xl p-6 hover:border-main/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-main group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center group-hover:bg-accent/30 group-hover:shadow-glow-accent transition-all duration-300">
          <BookOpen className="w-6 h-6 text-accent" />
        </div>
        {!program.isPublic && (
          <div className="flex items-center gap-1 text-muted-accent text-xs">
            <Lock className="w-3 h-3" />
            Private
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-bright-accent mb-2 group-hover:text-accent transition-colors">
        {program.name}
      </h3>
      <p className="text-sm text-muted-accent mb-4 line-clamp-2">{program.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 bg-main/20 rounded text-xs text-accent border border-main/30">
          {program.weeks} weeks
        </span>
        <span className="px-2 py-1 bg-main/20 rounded text-xs text-accent border border-main/30">
          {program.daysPerWeek}x/week
        </span>
        <span className="px-2 py-1 bg-main/20 rounded text-xs text-accent border border-main/30">
          {program.difficulty}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-accent">Progress</span>
          <span className="text-bright-accent">
            {program.workoutsCompleted}/{program.totalWorkouts}
          </span>
        </div>
        <div className="h-2 bg-muted-main/50 rounded-full overflow-hidden border border-main/20">
          <div
            className="h-full bg-gradient-to-r from-main to-accent rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function PublicProgramCard({ program }: { program: (typeof publicPrograms)[0] }) {
  return (
    <div className="glass-surface rounded-xl p-6 hover:border-main/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-main group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-main/20 rounded-lg flex items-center justify-center group-hover:bg-main/30 group-hover:shadow-glow-main transition-all duration-300">
          <BookOpen className="w-6 h-6 text-main" />
        </div>
        <div className="flex items-center gap-1 text-muted-accent text-xs">
          <Users className="w-3 h-3" />
          {program.users.toLocaleString()} users
        </div>
      </div>

      <h3 className="text-lg font-semibold text-bright-accent mb-2 group-hover:text-accent transition-colors">{program.name}</h3>
      <p className="text-sm text-muted-accent mb-4 line-clamp-2">{program.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 bg-main/20 rounded text-xs text-accent border border-main/30">
          {program.weeks} weeks
        </span>
        <span className="px-2 py-1 bg-main/20 rounded text-xs text-accent border border-main/30">
          {program.daysPerWeek}x/week
        </span>
        <span className="px-2 py-1 bg-main/20 rounded text-xs text-accent border border-main/30">
          {program.difficulty}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-accent">by {program.author}</span>
        <Button size="sm" variant="outline" className="group-hover:border-main/60">
          Start Program
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
