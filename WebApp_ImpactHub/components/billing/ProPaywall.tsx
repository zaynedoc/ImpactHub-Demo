'use client';

import { Crown, Sparkles, Dumbbell, TrendingUp, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProPaywallProps {
  onUpgrade: () => void;
  isLoading?: boolean;
  feature?: 'ai' | 'progress' | 'general';
}

const PRO_FEATURES = [
  { icon: Sparkles, text: '3 AI-generated workout plans per month' },
  { icon: TrendingUp, text: 'Instant access to Progress tracking' },
  { icon: Dumbbell, text: '90 workouts per month (vs 45 free)' },
  { icon: Zap, text: 'Priority support' },
];

export function ProPaywall({ onUpgrade, isLoading, feature = 'general' }: ProPaywallProps) {
  const featureMessages = {
    ai: 'Unlock AI-powered workout plan generation',
    progress: 'Unlock detailed progress tracking',
    general: 'Unlock all Pro features',
  };

  return (
    <div className="bg-gradient-to-br from-muted-main via-main/10 to-muted-main rounded-xl border border-accent/30 p-8 text-center">
      {/* Crown icon */}
      <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Crown className="w-8 h-8 text-accent" />
      </div>

      {/* Header */}
      <h2 className="text-2xl font-bold text-bright-accent mb-2">
        Upgrade to Pro
      </h2>
      <p className="text-muted-accent mb-6">
        {featureMessages[feature]}
      </p>

      {/* Price */}
      <div className="mb-6">
        <span className="text-4xl font-bold text-accent">$4.99</span>
        <span className="text-muted-accent">/month</span>
      </div>

      {/* Features list */}
      <div className="bg-muted-main/50 rounded-lg p-4 mb-6 text-left">
        <ul className="space-y-3">
          {PRO_FEATURES.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-main/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-accent" />
              </div>
              <span className="text-bright-accent text-sm">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <Button
        glow
        size="lg"
        onClick={onUpgrade}
        isLoading={isLoading}
        className="w-full"
      >
        <Crown className="w-5 h-5 mr-2" />
        {isLoading ? 'Processing...' : 'Upgrade to Pro'}
      </Button>

      {/* Footer */}
      <p className="text-xs text-muted-accent mt-4">
        Cancel anytime. Secure payment via Stripe.
      </p>
    </div>
  );
}

/**
 * Smaller inline paywall for specific features
 */
interface InlinePaywallProps {
  title: string;
  description: string;
  onUpgrade: () => void;
  isLoading?: boolean;
}

export function InlinePaywall({ title, description, onUpgrade, isLoading }: InlinePaywallProps) {
  return (
    <div className="bg-muted-main/50 rounded-xl border border-accent/20 p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Crown className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-bright-accent mb-1">{title}</h3>
          <p className="text-sm text-muted-accent mb-4">{description}</p>
          <Button glow size="sm" onClick={onUpgrade} isLoading={isLoading}>
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro - $4.99/mo
          </Button>
        </div>
      </div>
    </div>
  );
}
