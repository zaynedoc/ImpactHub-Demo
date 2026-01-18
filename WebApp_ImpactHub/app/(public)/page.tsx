'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Zap, Trophy, Users, Sparkles } from 'lucide-react';
import { AuroraText } from '@/components/effects/AuroraText';

export default function HomePage() {
  return (
    <div className="relative">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-accent rounded-full animate-float opacity-60" />
          <div className="absolute top-40 right-20 w-3 h-3 bg-main rounded-full animate-float-delayed opacity-40" />
          <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-bright-accent rounded-full animate-float-slow opacity-50" />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-accent rounded-full animate-float opacity-30" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <div className="opacity-0 animate-fade-in-up stagger-1 inline-flex items-center gap-2 px-4 py-2 bg-main/20 border border-main/30 rounded-full text-accent text-sm font-medium mb-8 glow-pulse">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Track. Progress. Transform.</span>
          </div>

          <h1 className="opacity-0 animate-fade-in-up stagger-2 text-5xl md:text-7xl font-bold text-bright-accent mb-6 leading-tight">
            Your Fitness Journey,{' '}
            <AuroraText>
              Supercharged
            </AuroraText>
          </h1>

          <p className="opacity-0 animate-fade-in-up stagger-3 text-xl text-muted-accent mb-10 max-w-2xl mx-auto">
            ImpactHub is the ultimate platform to log workouts, track personal records,
            and visualize your progress over time.
          </p>

          <div className="opacity-0 animate-fade-in-up stagger-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-main text-bright-accent font-semibold rounded-xl transition-all duration-300 shadow-glow-main hover:shadow-glow-accent hover:-translate-y-1"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/features"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-muted-main/80 text-bright-accent font-semibold rounded-xl transition-all duration-300 border border-main/30 hover:border-main/60 hover:bg-main/20 hover:-translate-y-1"
            >
              See Features
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-bright-accent mb-4">
              Everything You Need to <AuroraText>Level Up</AuroraText>
            </h2>
            <p className="text-muted-accent max-w-2xl mx-auto">
              Powerful tools designed for athletes who demand results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Track Progress"
              description="Log every workout and watch your strength grow with detailed analytics."
              color="main"
              delay={0}
            />
            <FeatureCard
              icon={<Trophy className="w-6 h-6" />}
              title="Celebrate PRs"
              description="Automatic personal record detection. Never miss a milestone."
              color="accent"
              delay={1}
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Smart Programs"
              description="Follow structured programs or create custom routines."
              color="main"
              delay={2}
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Community"
              description="Connect with athletes pushing their limits."
              color="accent"
              delay={3}
            />
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-main rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-bright-accent mb-4">
            Ready to Transform?
          </h2>
          <p className="text-muted-accent mb-10 max-w-xl mx-auto">
            Join thousands of athletes reaching their goals.
          </p>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-main text-bright-accent font-semibold rounded-xl transition-all duration-300 shadow-glow-main hover:shadow-glow-accent hover:-translate-y-1 hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'main' | 'accent';
  delay?: number;
}) {
  const colorClasses = {
    main: 'bg-main/20 text-main group-hover:bg-main/30 group-hover:shadow-glow-main',
    accent: 'bg-accent/20 text-accent group-hover:bg-accent/30 group-hover:shadow-glow-accent',
  };

  return (
    <div 
      className="group card-interactive opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${0.1 + delay * 0.1}s` }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${colorClasses[color]}`}>
        <div className="group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-bright-accent mb-2 group-hover:text-accent transition-colors">
        {title}
      </h3>
      <p className="text-muted-accent text-sm">{description}</p>
    </div>
  );
}
