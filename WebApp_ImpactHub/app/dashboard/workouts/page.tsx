'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Calendar, Dumbbell, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';

const mockWorkouts = [
  {
    id: '1',
    title: 'Push Day - Chest Focus',
    date: '2024-01-15',
    exercises: [
      { name: 'Bench Press', sets: 4 },
      { name: 'Incline Dumbbell Press', sets: 3 },
      { name: 'Cable Flyes', sets: 3 },
      { name: 'Tricep Pushdowns', sets: 3 },
      { name: 'Overhead Tricep Extension', sets: 2 },
    ],
    duration: '45 min',
    totalVolume: '8,450 lbs',
  },
  {
    id: '2',
    title: 'Pull Day - Back Focus',
    date: '2024-01-13',
    exercises: [
      { name: 'Deadlift', sets: 4 },
      { name: 'Barbell Rows', sets: 4 },
      { name: 'Lat Pulldowns', sets: 3 },
      { name: 'Face Pulls', sets: 3 },
      { name: 'Bicep Curls', sets: 3 },
      { name: 'Hammer Curls', sets: 2 },
    ],
    duration: '52 min',
    totalVolume: '12,200 lbs',
  },
  {
    id: '3',
    title: 'Leg Day',
    date: '2024-01-11',
    exercises: [
      { name: 'Squats', sets: 5 },
      { name: 'Romanian Deadlifts', sets: 4 },
      { name: 'Leg Press', sets: 3 },
      { name: 'Leg Curls', sets: 3 },
    ],
    duration: '38 min',
    totalVolume: '15,800 lbs',
  },
  {
    id: '4',
    title: 'Upper Body',
    date: '2024-01-09',
    exercises: [
      { name: 'Overhead Press', sets: 4 },
      { name: 'Pull-ups', sets: 4 },
      { name: 'Dumbbell Bench', sets: 3 },
      { name: 'Cable Rows', sets: 3 },
    ],
    duration: '42 min',
    totalVolume: '7,600 lbs',
  },
];

export default function WorkoutsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [workouts] = useState(mockWorkouts);

  const filteredWorkouts = workouts.filter((workout) =>
    workout.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-bright-accent">Workouts</h1>
          <p className="text-muted-accent mt-1">View and manage your workout history</p>
        </div>
        <Link href="/dashboard/workouts/new">
          <Button glow className="group">
            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            New Workout
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in-up stagger-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-accent" />
          <Input
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          Filter by Date
        </Button>
      </div>

      {filteredWorkouts.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="w-8 h-8 text-muted-accent" />}
          title="No workouts found"
          description={
            searchQuery
              ? "Try adjusting your search query"
              : "Start logging your first workout to track your progress"
          }
          action={
            !searchQuery && (
              <Link href="/dashboard/workouts/new">
                <Button glow>
                  <Plus className="w-4 h-4 mr-2" />
                  Log First Workout
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutCard({
  workout,
}: {
  workout: (typeof mockWorkouts)[0];
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="glass-surface rounded-xl p-6 hover:border-main/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-main group">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/dashboard/workouts/${workout.id}`} className="flex-1">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-main/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-main/30 group-hover:shadow-glow-main transition-all duration-300">
              <Dumbbell className="w-6 h-6 text-main" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-bright-accent mb-1 group-hover:text-accent transition-colors">
                {workout.title}
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-accent">
                <span>
                  {new Date(workout.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span>{workout.exercises.length} exercises</span>
                <span>{workout.duration}</span>
                <span>{workout.totalVolume} volume</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {workout.exercises.slice(0, 4).map((exercise, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-main/20 rounded text-xs text-accent border border-main/30"
                  >
                    {exercise.name}
                  </span>
                ))}
                {workout.exercises.length > 4 && (
                  <span className="px-2 py-1 bg-muted-main/50 rounded text-xs text-muted-accent border border-main/20">
                    +{workout.exercises.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-muted-accent hover:text-bright-accent hover:bg-main/20 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 glass-surface rounded-lg shadow-xl z-20">
                <button className="w-full px-4 py-2 text-left text-sm text-bright-accent hover:bg-main/20 flex items-center gap-2 rounded-t-lg transition-colors">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-b-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
