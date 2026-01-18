'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Sparkles, Loader2, Calendar, Dumbbell, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AIPlanGenerator, type GeneratedPlan } from '@/components/ai/AIPlanGenerator';
import { GeneratedPlanDisplay } from '@/components/ai/GeneratedPlanDisplay';
import { ProPaywall } from '@/components/billing/ProPaywall';

interface SavedProgram {
  id: string;
  name: string;
  description: string | null;
  weeks: number;
  days_per_week: number;
  goal: string | null;
  experience_level: string | null;
  source: 'ai' | 'manual' | 'template';
  is_active: boolean;
  plan_data: GeneratedPlan;
  created_at: string;
}

interface SubscriptionInfo {
  tier: 'free' | 'pro';
  canUseAI: boolean;
  aiTokensRemaining: number;
  aiTokensUsedThisMonth: number;
}

export default function ProgramsPage() {
  const [activeTab, setActiveTab] = useState<'my' | 'ai'>('ai');
  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // AI Plan Generator state
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    fetchPrograms();
    fetchSubscription();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs');
      const data = await res.json();
      if (data.success) {
        setPrograms(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscription = async () => {
    setIsLoadingSubscription(true);
    try {
      const res = await fetch('/api/billing/subscription');
      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const handlePlanGenerated = (plan: GeneratedPlan) => {
    setGeneratedPlan(plan);
    setIsSaved(false);
    // Refresh subscription info after generation
    fetchSubscription();
  };

  const handleResetPlan = () => {
    setGeneratedPlan(null);
    setIsSaved(false);
  };

  const handleSavePlan = async (plan: GeneratedPlan) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          description: plan.description,
          weeks: plan.weeks,
          days_per_week: plan.daysPerWeek,
          source: 'ai',
          plan_data: plan,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setIsSaved(true);
        // Refresh programs list
        fetchPrograms();
      } else {
        alert(data.error || 'Failed to save program');
      }
    } catch (err) {
      console.error('Failed to save program:', err);
      alert('Failed to save program');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    
    try {
      const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPrograms(programs.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete program:', err);
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to start checkout');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Prepare AI usage info for the generator
  const aiUsageInfo = subscription ? {
    used: subscription.aiTokensUsedThisMonth,
    limit: subscription.tier === 'pro' ? 3 : 0,
    remaining: subscription.aiTokensRemaining,
    canGenerate: subscription.canUseAI,
  } : null;

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
          <p className="text-muted-accent mt-1">Create and follow structured training programs</p>
        </div>
        <Button glow className="group" disabled>
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Create Program
        </Button>
      </div>

      <div className="flex gap-2 border-b border-main/30 opacity-0 animate-fade-in-up stagger-2">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'ai'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-accent hover:text-bright-accent'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Generator
        </button>
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
      </div>

      {/* AI Generator Tab */}
      {activeTab === 'ai' && (
        <div className="opacity-0 animate-fade-in-up stagger-3">
          {/* Show paywall for free users */}
          {!isLoadingSubscription && subscription?.tier === 'free' && !generatedPlan && (
            <ProPaywall onUpgrade={handleUpgrade} isLoading={isUpgrading} feature="ai" />
          )}
          
          {/* Show generator for Pro users */}
          {!isLoadingSubscription && subscription?.tier === 'pro' && !generatedPlan && (
            <AIPlanGenerator
              onPlanGenerated={handlePlanGenerated}
              usageInfo={aiUsageInfo}
              isLoadingUsage={isLoadingSubscription}
            />
          )}
          
          {/* Show generated plan */}
          {generatedPlan && (
            <GeneratedPlanDisplay 
              plan={generatedPlan} 
              onReset={handleResetPlan}
              onSave={handleSavePlan}
              isSaving={isSaving}
              isSaved={isSaved}
            />
          )}
          
          {/* Loading state */}
          {isLoadingSubscription && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-main animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* My Programs Tab */}
      {activeTab === 'my' && (
        <div className="opacity-0 animate-fade-in-up stagger-3">
          {programs.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-8 h-8 text-muted-accent" />}
              title="No saved programs"
              description={subscription?.tier === 'pro' 
                ? "Use the AI Generator to create a personalized program and save it here."
                : "Upgrade to Pro to generate and save AI workout programs."
              }
              action={
                <div className="flex gap-3">
                  {subscription?.tier === 'pro' ? (
                    <Button glow onClick={() => setActiveTab('ai')}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate with AI
                    </Button>
                  ) : (
                    <Button glow onClick={handleUpgrade} isLoading={isUpgrading}>
                      Upgrade to Pro
                    </Button>
                  )}
                  <Link href="/dashboard/workouts/new">
                    <Button variant="outline">Log Workout</Button>
                  </Link>
                </div>
              }
            />
          ) : (
            <div className="grid gap-4">
              {programs.map((program) => (
                <Link
                  key={program.id}
                  href={`/dashboard/programs/${program.id}`}
                  className="group bg-muted-main/50 rounded-xl border border-main/30 p-5 hover:border-accent/50 hover:bg-main/10 transition-all block"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-bright-accent group-hover:text-accent transition-colors">
                          {program.name}
                        </h3>
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
                        <p className="text-sm text-muted-accent mb-3 line-clamp-2">{program.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-accent">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-main" />
                          {program.weeks} weeks
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-4 h-4 text-main" />
                          {program.days_per_week} days/week
                        </span>
                        {program.goal && (
                          <span className="capitalize">{program.goal.replace('_', ' ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteProgram(program.id);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

