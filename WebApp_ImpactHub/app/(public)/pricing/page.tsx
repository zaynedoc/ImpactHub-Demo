import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { AuroraText } from '@/components/effects/AuroraText';

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-bright-accent mb-6">
              Simple, <AuroraText>Transparent</AuroraText> Pricing
            </h1>
            <p className="text-xl text-muted-accent max-w-2xl mx-auto">
              Start free and upgrade when you need more power.
              No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              description="Everything you need to start tracking your fitness journey."
              features={[
                { text: 'Log up to 45 workouts/month', included: true },
                { text: 'Personal record tracking', included: true },
                { text: 'Workout calendar view', included: true },
                { text: 'Mobile-friendly interface', included: true },
                { text: 'Progress tracking (after 10 workouts)', included: true },
                { text: 'AI workout plan generation', included: false },
              ]}
              buttonText="Get Started Free"
              buttonHref="/auth/signup"
              highlighted={false}
            />

            <PricingCard
              name="Pro"
              price="$4.99"
              period="per month"
              description="For dedicated athletes who want AI-powered training."
              features={[
                { text: 'Log up to 90 workouts/month', included: true },
                { text: 'Personal record tracking', included: true },
                { text: 'Workout calendar view', included: true },
                { text: 'Mobile-friendly interface', included: true },
                { text: 'Instant progress tracking access', included: true },
                { text: 'AI workout plan generation (3/month)', included: true },
              ]}
              buttonText="Upgrade to Pro"
              buttonHref="/auth/signup"
              highlighted={true}
            />
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted-main/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-bright-accent mb-8 text-center">
              Frequently Asked <AuroraText>Questions</AuroraText>
            </h2>

            <div className="space-y-6">
              <FAQ
                question="What is included in the free plan?"
                answer="The free plan includes up to 45 workout logs per month, personal record tracking, calendar view, and progress tracking after you log 10 workouts."
              />
              <FAQ
                question="What do I get with Pro?"
                answer="Pro unlocks AI-powered workout plan generation (3 per month), doubles your workout limit to 90/month, and gives you instant access to progress tracking."
              />
              <FAQ
                question="Can I cancel anytime?"
                answer="Yes, you can cancel your Pro subscription at any time. You'll keep access until the end of your billing period."
              />
              <FAQ
                question="Is my payment secure?"
                answer="Absolutely. All payments are processed securely through Stripe. We never store your card details."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  buttonText,
  buttonHref,
  highlighted,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: { text: string; included: boolean }[];
  buttonText: string;
  buttonHref: string;
  highlighted: boolean;
}) {
  return (
    <div
      className={`relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
        highlighted
          ? 'bg-gradient-to-b from-main/30 to-accent/10 border-main shadow-glow-main'
          : 'bg-muted-main/80 border-main/30 hover:border-main/60 hover:shadow-glow-main'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-main text-bright-accent text-sm font-semibold rounded-full shadow-glow-main">
          Most Popular
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-bright-accent mb-2">{name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-bright-accent">{price}</span>
          <span className="text-muted-accent">/{period}</span>
        </div>
        <p className="text-muted-accent text-sm mt-2">{description}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            {feature.included ? (
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-muted-accent/40 flex-shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? 'text-bright-accent/80' : 'text-muted-accent/50'}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={buttonHref}
        className={`block w-full py-3 px-4 text-center font-semibold rounded-lg transition-all duration-300 ${
          highlighted
            ? 'bg-main text-bright-accent hover:shadow-glow-main hover:scale-105'
            : 'bg-muted-main text-bright-accent border border-main/30 hover:border-main/60 hover:bg-main/20'
        }`}
      >
        {buttonText}
      </Link>
    </div>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="p-6 bg-muted-main/80 rounded-xl border border-main/30 hover:border-main/60 transition-all duration-300">
      <h3 className="text-lg font-semibold text-bright-accent mb-2">{question}</h3>
      <p className="text-muted-accent">{answer}</p>
    </div>
  );
}
