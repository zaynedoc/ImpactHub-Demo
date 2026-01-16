import { Target, Heart, Zap, Users } from 'lucide-react';
import { AuroraText } from '@/components/effects/AuroraText';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-bright-accent mb-6">
              Built by Athletes,{' '}
              <AuroraText>
                For Athletes
              </AuroraText>
            </h1>
            <p className="text-xl text-muted-accent">
              ImpactHub was born from a simple frustration: existing fitness apps
              did not meet the needs of serious strength athletes. So we built one that does.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto mb-24">
            <div>
              <h2 className="text-2xl font-bold text-bright-accent mb-4">Our Mission</h2>
              <p className="text-muted-accent leading-relaxed">
                We believe everyone deserves access to professional-grade training tools.
                Our mission is to democratize fitness tracking by providing powerful,
                intuitive software that helps athletes of all levels achieve their goals.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-bright-accent mb-4">Our Vision</h2>
              <p className="text-muted-accent leading-relaxed">
                We envision a world where every athlete can train smarter, not just harder.
                Where data-driven decisions replace guesswork, and where progress is
                measurable, visible, and celebrated.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-24">
            <ValueCard
              icon={<Target className="w-6 h-6" />}
              title="Focus"
              description="We build features that matter. No bloat, no distractions."
            />
            <ValueCard
              icon={<Heart className="w-6 h-6" />}
              title="Passion"
              description="We are lifters ourselves. We use what we build every day."
            />
            <ValueCard
              icon={<Zap className="w-6 h-6" />}
              title="Speed"
              description="Fast app, fast development. We ship improvements weekly."
            />
            <ValueCard
              icon={<Users className="w-6 h-6" />}
              title="Community"
              description="Our users shape the product. We listen and we deliver."
            />
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted-main/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-bright-accent mb-8 text-center">
              The Story Behind <AuroraText>ImpactHub</AuroraText>
            </h2>
            
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-muted-accent mb-6">
                ImpactHub started as a side project in 2024. After years of using
                spreadsheets, note apps, and various fitness trackers that never quite
                fit our needs, we decided to build something better.
              </p>
              <p className="text-muted-accent mb-6">
                We wanted an app that was fast enough to use between sets, powerful
                enough to provide real insights, and simple enough that logging a
                workout did not feel like a chore.
              </p>
              <p className="text-muted-accent mb-6">
                Today, ImpactHub is used by athletes around the world - from beginners
                just starting their fitness journey to competitive powerlifters tracking
                every kilogram.
              </p>
              <p className="text-muted-accent">
                We are just getting started. Every feature we build is driven by real
                feedback from real athletes. If you have ideas on how we can improve,
                we would love to hear from you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-bright-accent mb-12 text-center">
              By the <AuroraText>Numbers</AuroraText>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard number="10K+" label="Active Users" />
              <StatCard number="500K+" label="Workouts Logged" />
              <StatCard number="2M+" label="Sets Tracked" />
              <StatCard number="50K+" label="PRs Celebrated" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6 rounded-xl border border-main/30 hover:border-main/60 transition-all duration-300 hover:shadow-glow-main hover:-translate-y-1 group">
      <div className="w-14 h-14 bg-main/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-main group-hover:bg-main group-hover:text-bright-accent transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-bright-accent mb-2 group-hover:text-accent transition-colors">{title}</h3>
      <p className="text-muted-accent text-sm">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-4">
      <div className="text-4xl font-bold text-accent mb-2">{number}</div>
      <div className="text-muted-accent">{label}</div>
    </div>
  );
}
