'use client';

import { useState } from 'react';
import { Mail, MessageSquare, HelpCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuroraText } from '@/components/effects/AuroraText';

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-bright-accent mb-6">
              Get in <AuroraText>Touch</AuroraText>
            </h1>
            <p className="text-xl text-muted-accent max-w-2xl mx-auto">
              Have a question, feedback, or just want to say hi?
              We'd love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="lg:col-span-1 space-y-6">
              <ContactCard
                icon={<Mail className="w-6 h-6" />}
                title="Email Us"
                description="For general inquiries and support"
                contact="hello@impacthub.app"
              />
              <ContactCard
                icon={<MessageSquare className="w-6 h-6" />}
                title="Feedback"
                description="Help us improve ImpactHub"
                contact="feedback@impacthub.app"
              />
              <ContactCard
                icon={<HelpCircle className="w-6 h-6" />}
                title="Support"
                description="Need help with your account?"
                contact="support@impacthub.app"
              />
            </div>

            <div className="lg:col-span-2">
              <div className="bg-muted-main/80 rounded-2xl border border-main/30 p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-main/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Send className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-2xl font-bold text-bright-accent mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-muted-accent mb-6">
                      Thanks for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <Button onClick={() => setSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Input
                        label="Your Name"
                        placeholder="John Doe"
                        value={formState.name}
                        onChange={(e) =>
                          setFormState({ ...formState, name: e.target.value })
                        }
                        required
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="john@example.com"
                        value={formState.email}
                        onChange={(e) =>
                          setFormState({ ...formState, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <Input
                      label="Subject"
                      placeholder="How can we help?"
                      value={formState.subject}
                      onChange={(e) =>
                        setFormState({ ...formState, subject: e.target.value })
                      }
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-bright-accent/80 mb-1">
                        Message
                      </label>
                      <textarea
                        className="w-full px-4 py-3 bg-muted-main border border-main/30 rounded-lg text-bright-accent placeholder-muted-accent focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent resize-none"
                        rows={6}
                        placeholder="Tell us more about your inquiry..."
                        value={formState.message}
                        onChange={(e) =>
                          setFormState({ ...formState, message: e.target.value })
                        }
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      isLoading={isSubmitting}
                      className="w-full md:w-auto"
                    >
                      Send Message
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted-main/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-bright-accent mb-4">
              Response <AuroraText>Time</AuroraText>
            </h2>
            <p className="text-muted-accent mb-8">
              We typically respond within 24 hours during business days.
              For urgent issues, please include "URGENT" in your subject line.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-muted-main/80 rounded-xl border border-main/30 hover:border-main/60 transition-all duration-300">
                <div className="text-3xl font-bold text-accent mb-2">&lt; 24h</div>
                <div className="text-muted-accent">General Inquiries</div>
              </div>
              <div className="p-6 bg-muted-main/80 rounded-xl border border-main/30 hover:border-main/60 transition-all duration-300">
                <div className="text-3xl font-bold text-accent mb-2">&lt; 4h</div>
                <div className="text-muted-accent">Pro Support</div>
              </div>
              <div className="p-6 bg-muted-main/80 rounded-xl border border-main/30 hover:border-main/60 transition-all duration-300">
                <div className="text-3xl font-bold text-accent mb-2">&lt; 1h</div>
                <div className="text-muted-accent">Critical Issues</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  description,
  contact,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  contact: string;
}) {
  return (
    <div className="p-6 bg-muted-main/80 rounded-xl border border-main/30 hover:border-main/60 transition-all duration-300 group">
      <div className="w-12 h-12 bg-main/20 rounded-lg flex items-center justify-center mb-4 text-main group-hover:bg-main group-hover:text-bright-accent transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-bright-accent mb-1">{title}</h3>
      <p className="text-muted-accent text-sm mb-2">{description}</p>
      <a href={`mailto:${contact}`} className="text-accent hover:text-bright-accent transition-colors">
        {contact}
      </a>
    </div>
  );
}
