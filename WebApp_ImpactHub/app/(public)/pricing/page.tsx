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

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              description="Perfect for getting started with workout tracking."
              features={[
                { text: 'Log up to 20 workouts/month', included: true },
                { text: 'Basic progress charts', included: true },
                { text: 'Personal record tracking', included: true },
                { text: 'Mobile-friendly interface', included: true },
                { text: 'Unlimited workout history', included: false },
                { text: 'Advanced analytics', included: false },
                { text: 'Custom programs', included: false },
                { text: 'Priority support', included: false },
              ]}
              buttonText="Get Started"
              buttonHref="/auth/signup"
              highlighted={false}
            />

            <PricingCard
              name="Pro"
              price="$9"
              period="per month"
              description="For dedicated athletes who want to maximize their gains."
              features={[
                { text: 'Unlimited workouts', included: true },
                { text: 'Advanced progress analytics', included: true },
                { text: 'Personal record tracking', included: true },
                { text: 'Mobile-friendly interface', included: true },
                { text: 'Unlimited workout history', included: true },
                { text: 'Advanced analytics', included: true },
                { text: 'Custom programs', included: true },
                { text: 'Priority support', included: false },
              ]}
              buttonText="Start Pro Trial"
              buttonHref="/auth/signup?plan=pro"
              highlighted={true}
            />

            <PricingCard
              name="Lifetime"
              price="$99"
              period="one-time"
              description="Pay once, own forever. Best value for committed lifters."
              features={[
                { text: 'Everything in Pro', included: true },
                { text: 'Lifetime access', included: true },
                { text: 'All future features', included: true },
                { text: 'Priority support', included: true },
                { text: 'Early access to beta', included: true },
                { text: 'Export all data', included: true },
                { text: 'API access', included: true },
                { text: 'Custom integrations', included: true },
              ]}
              buttonText="Get Lifetime Access"
              buttonHref="/auth/signup?plan=lifetime"
              highlighted={false}
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
                question="Can I try Pro features before paying?"
                answer="Yes! Start with a 14-day free trial of Pro. No credit card required. Cancel anytime."
              />
              <FAQ
                question="What happens to my data if I cancel?"
                answer="Your workout data is always yours. You can export it anytime, and it stays accessible on the free plan."
              />
              <FAQ
                question="Is there a refund policy?"
                answer="Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked."
              />
              <FAQ
                question="Can I switch between plans?"
                answer="Absolutely. Upgrade, downgrade, or switch to Lifetime anytime. We'll prorate any differences."
              />
              <FAQ
                question="Do you offer team or gym pricing?"
                answer="We're working on team features. Contact us for early access or custom pricing for gyms."
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
