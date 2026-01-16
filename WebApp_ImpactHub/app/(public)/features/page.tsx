import {
  BarChart3,
  Dumbbell,
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  Shield,
  Smartphone,
  Clock,
  BarChart2,
  Users,
} from 'lucide-react';
import { AuroraText } from '@/components/effects/AuroraText';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-bright-accent mb-6">
              Powerful Features for{' '}
              <AuroraText>
                Serious Athletes
              </AuroraText>
            </h1>
            <p className="text-xl text-muted-accent max-w-2xl mx-auto">
              Everything you need to track, analyze, and optimize your training.
              Built by lifters, for lifters.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Dumbbell className="w-6 h-6" />}
              title="Workout Logging"
              description="Log exercises, sets, reps, and weight with an intuitive interface. Add notes and track rest times between sets."
            />
            <FeatureCard
              icon={<Trophy className="w-6 h-6" />}
              title="Personal Records"
              description="Automatic PR detection across all exercises. Celebrate milestones and track your strength progression."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Progress Analytics"
              description="Visualize your gains with detailed charts. Track volume, frequency, and strength trends over time."
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Workout History"
              description="Access your complete workout history. Review past sessions and compare performance across time."
            />
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title="Goal Setting"
              description="Set strength and volume goals. Track your progress towards targets with visual indicators."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Smart Programs"
              description="Follow structured training programs or create custom routines. Progressive overload made easy."
            />
            <FeatureCard
              icon={<BarChart2 className="w-6 h-6" />}
              title="Volume Tracking"
              description="Monitor weekly volume per muscle group. Ensure balanced training and optimal recovery."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Rest Timers"
              description="Built-in rest timers with customizable durations. Never cut rest short or wait too long."
            />
            <FeatureCard
              icon={<Smartphone className="w-6 h-6" />}
              title="Mobile Friendly"
              description="Responsive design works perfectly on any device. Log workouts from your phone at the gym."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Secure & Private"
              description="Your data is encrypted and secure. We never sell your information to third parties."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Community Features"
              description="Share achievements, compare stats, and connect with other dedicated athletes."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Export Data"
              description="Download your workout data anytime. Your training history belongs to you."
            />
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted-main/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-bright-accent mb-8 text-center">
              How It <AuroraText>Works</AuroraText>
            </h2>
            
            <div className="space-y-8">
              <Step
                number={1}
                title="Create Your Account"
                description="Sign up for free in seconds. No credit card required to get started."
              />
              <Step
                number={2}
                title="Log Your Workouts"
                description="Add exercises, sets, reps, and weight. The interface is designed for speed at the gym."
              />
              <Step
                number={3}
                title="Track Your Progress"
                description="Watch your analytics update in real-time. See PRs, volume trends, and strength gains."
              />
              <Step
                number={4}
                title="Achieve Your Goals"
                description="Use insights to optimize your training. Celebrate milestones and keep pushing forward."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-muted-main/80 rounded-xl border border-main/30 hover:border-main/60 transition-all duration-300 group hover:shadow-glow-main hover:-translate-y-1">
      <div className="w-12 h-12 bg-main/20 rounded-lg flex items-center justify-center mb-4 text-main group-hover:bg-main group-hover:text-bright-accent transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-bright-accent mb-2 group-hover:text-accent transition-colors">{title}</h3>
      <p className="text-muted-accent text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0 w-12 h-12 bg-main rounded-full flex items-center justify-center text-bright-accent font-bold text-lg shadow-glow-main">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-bright-accent mb-2">{title}</h3>
        <p className="text-muted-accent">{description}</p>
      </div>
    </div>
  );
}
