'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Shield, CreditCard, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'data', label: 'Data', icon: Download },
  ];

  return (
    <div className="space-y-6">
      <div className="opacity-0 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-bright-accent">Settings</h1>
        <p className="text-muted-accent mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 flex-shrink-0 opacity-0 animate-fade-in-up stagger-2">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-main text-bright-accent shadow-glow-main'
                      : 'text-muted-accent hover:text-bright-accent hover:bg-main/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'data' && <DataSettings />}
        </main>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formState, setFormState] = useState({
    username: '',
    fullName: '',
    email: '',
    bio: '',
  });
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get profile data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('username, full_name, bio')
          .eq('id', user.id)
          .single();

        setFormState({
          username: profile?.username || '',
          fullName: profile?.full_name || user.user_metadata?.full_name || '',
          email: user.email || '',
          bio: profile?.bio || '',
        });
      }
      setIsLoading(false);
    }

    loadProfile();
  }, [supabase]);

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        return;
      }

      // Update profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          username: formState.username.toLowerCase() || null,
          full_name: formState.fullName || null,
          bio: formState.bio || null,
        })
        .eq('id', user.id);

      if (error) {
        if (error.code === '23505') {
          setMessage({ type: 'error', text: 'Username already taken' });
        } else {
          setMessage({ type: 'error', text: error.message });
        }
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  }

  const initials = formState.fullName
    ? formState.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : formState.email?.slice(0, 2).toUpperCase() || '??';

  if (isLoading) {
    return (
      <div className="glass-surface rounded-xl p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-main animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-surface rounded-xl p-6 opacity-0 animate-fade-in-up stagger-3">
      <h2 className="text-xl font-semibold text-bright-accent mb-6">Profile Information</h2>
      
      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-main to-accent rounded-full flex items-center justify-center text-2xl font-bold text-bright-accent shadow-glow-main">
            {initials}
          </div>
          <div>
            <Button variant="outline" size="sm">Change Avatar</Button>
            <p className="text-sm text-muted-accent mt-2">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Input
            label="Username"
            value={formState.username}
            onChange={(e) => setFormState({ ...formState, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
            placeholder="your_username"
          />
          <Input
            label="Full Name"
            value={formState.fullName}
            onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={formState.email}
          disabled
          helperText="Email cannot be changed here"
        />

        <div>
          <label className="block text-sm font-medium text-bright-accent/80 mb-1">Bio</label>
          <textarea
            className="w-full px-4 py-3 bg-muted-main border border-main/30 rounded-lg text-bright-accent placeholder-muted-accent focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent resize-none transition-all duration-300"
            rows={3}
            value={formState.bio}
            onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
            placeholder="Tell us about yourself..."
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-main/20 border border-main/40 text-main' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <Button glow onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    prNotifications: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  return (
    <div className="glass-surface rounded-xl p-6 opacity-0 animate-fade-in-up stagger-3">
      <h2 className="text-xl font-semibold text-bright-accent mb-6">Notification Preferences</h2>
      
      <div className="space-y-6">
        <NotificationToggle
          title="Workout Reminders"
          description="Get reminded to log your workouts"
          checked={notifications.workoutReminders}
          onChange={(checked) => setNotifications({ ...notifications, workoutReminders: checked })}
        />
        <NotificationToggle
          title="PR Notifications"
          description="Celebrate when you hit a new personal record"
          checked={notifications.prNotifications}
          onChange={(checked) => setNotifications({ ...notifications, prNotifications: checked })}
        />
        <NotificationToggle
          title="Weekly Digest"
          description="Receive a summary of your weekly progress"
          checked={notifications.weeklyDigest}
          onChange={(checked) => setNotifications({ ...notifications, weeklyDigest: checked })}
        />
        <NotificationToggle
          title="Marketing Emails"
          description="Updates about new features and promotions"
          checked={notifications.marketingEmails}
          onChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
        />
      </div>
    </div>
  );
}

function NotificationToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between group">
      <div>
        <h3 className="font-medium text-bright-accent group-hover:text-accent transition-colors">{title}</h3>
        <p className="text-sm text-muted-accent">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-all duration-300 ${
          checked ? 'bg-main shadow-glow-main' : 'bg-muted-main border border-main/30'
        }`}
      >
        <div
          className={`w-5 h-5 bg-bright-accent rounded-full transition-transform duration-300 ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6 opacity-0 animate-fade-in-up stagger-3">
      <div className="glass-surface rounded-xl p-6">
        <h2 className="text-xl font-semibold text-bright-accent mb-6">Change Password</h2>
        <div className="space-y-4 max-w-md">
          <Input label="Current Password" type="password" />
          <Input label="New Password" type="password" />
          <Input label="Confirm New Password" type="password" />
          <Button glow>Update Password</Button>
        </div>
      </div>

      <div className="glass-surface rounded-xl p-6">
        <h2 className="text-xl font-semibold text-bright-accent mb-4">Two-Factor Authentication</h2>
        <p className="text-muted-accent mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <Button variant="outline">Enable 2FA</Button>
      </div>

      <div className="glass-surface rounded-xl p-6">
        <h2 className="text-xl font-semibold text-bright-accent mb-4">Active Sessions</h2>
        <p className="text-muted-accent mb-4">
          You're currently logged in on these devices.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-main/10 rounded-lg border border-main/30">
            <div>
              <p className="text-bright-accent font-medium">Windows PC - Chrome</p>
              <p className="text-sm text-muted-accent">Last active: Now</p>
            </div>
            <span className="text-xs text-accent bg-main/20 px-2 py-1 rounded border border-main/30">Current</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-6 opacity-0 animate-fade-in-up stagger-3">
      <div className="glass-surface rounded-xl p-6">
        <h2 className="text-xl font-semibold text-bright-accent mb-4">Current Plan</h2>
        <div className="flex items-center justify-between p-4 bg-main/20 border border-main/40 rounded-lg">
          <div>
            <h3 className="text-lg font-semibold text-bright-accent">Free Plan</h3>
            <p className="text-sm text-muted-accent">20 workouts per month</p>
          </div>
          <Button glow>Upgrade to Pro</Button>
        </div>
      </div>

      <div className="glass-surface rounded-xl p-6">
        <h2 className="text-xl font-semibold text-bright-accent mb-4">Payment Method</h2>
        <p className="text-muted-accent mb-4">No payment method on file.</p>
        <Button variant="outline">Add Payment Method</Button>
      </div>

      <div className="glass-surface rounded-xl p-6">
        <h2 className="text-xl font-semibold text-bright-accent mb-4">Billing History</h2>
        <p className="text-muted-accent">No billing history available.</p>
      </div>
    </div>
  );
}

function DataSettings() {
  return (
    <div className="space-y-6 opacity-0 animate-fade-in-up stagger-3">
      <div className="glass-surface rounded-xl p-6">
        <h2 className="text-xl font-semibold text-bright-accent mb-4">Export Your Data</h2>
        <p className="text-muted-accent mb-4">
          Download a copy of all your workout data in CSV or JSON format.
        </p>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <div className="glass-surface rounded-xl border-red-500/30 p-6">
        <h2 className="text-xl font-semibold text-bright-accent mb-4">Danger Zone</h2>
        <p className="text-muted-accent mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="danger">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </div>
    </div>
  );
}
