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
              did not meet the needs of serious strength athletes. So, I built this app to address it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto mb-24">
            <div>
              <h2 className="text-2xl font-bold text-bright-accent mb-4">My Mission</h2>
              <p className="text-muted-accent leading-relaxed">
                              I believe that everyone deserves fair access to tools that help them reach their goals in fitness,
                              with little to no paywalls from hiding those necessary features. Therefore, my mission is to publicize
                              powerful, easy-to-use strength training software that empowers anyone, regardless of experience, to achieve their fitness goals.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-bright-accent mb-4">My Vision</h2>
              <p className="text-muted-accent leading-relaxed">
                              I envision a world where every athlete can train smarter, not just harder. Where people aren't shunned by subscription-based
                              services to achieve what they thought was impossible. I want to create a community-driven platform that evolves with the needs of its users,
                              while fostering a supportive environment for athletes of all levels.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-24">
            <ValueCard
              icon={<Target className="w-6 h-6" />}
              title="Focus"
              description="I build features that matter. No bloat, no distractions."
            />
            <ValueCard
              icon={<Heart className="w-6 h-6" />}
              title="Passion"
              description="I are lifters ourselves. I use what I build every day."
            />
            <ValueCard
              icon={<Zap className="w-6 h-6" />}
              title="Speed"
              description="Fast app, fast development. I ship improvements Iekly."
            />
            <ValueCard
              icon={<Users className="w-6 h-6" />}
              title="Community"
              description="Our users shape the product. I listen and I deliver."
            />
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
