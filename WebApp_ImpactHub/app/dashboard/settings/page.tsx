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
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [isChangingPassword, setIsChangingPassword] = useState(false);
const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
const supabase = createClient();

const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault();
  setPasswordMessage(null);

  // Validation
  if (!newPassword || !confirmPassword) {
    setPasswordMessage({ type: 'error', text: 'Please fill in all password fields' });
    return;
  }

  if (newPassword.length < 6) {
    setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
    return;
  }

  setIsChangingPassword(true);

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Password update error:', error);
      setPasswordMessage({ type: 'error', text: error.message });
    } else {
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    }
  } catch (error) {
    console.error('Password update exception:', error);
    setPasswordMessage({ type: 'error', text: 'Failed to update password. Please try again.' });
  } finally {
    setIsChangingPassword(false);
  }
};

return (
  <div className="space-y-6 opacity-0 animate-fade-in-up stagger-3">
    <form onSubmit={handlePasswordChange} className="glass-surface rounded-xl p-6">
      <h2 className="text-xl font-semibold text-bright-accent mb-6">Change Password</h2>
      <div className="space-y-4 max-w-md">
        <Input 
          label="New Password" 
          type="password" 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
        <Input 
          label="Confirm New Password" 
          type="password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />
            
        {passwordMessage && (
          <div className={`p-3 rounded-lg ${passwordMessage.type === 'success' ? 'bg-main/20 border border-main/40 text-main' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {passwordMessage.text}
          </div>
        )}
            
        <Button type="submit" glow disabled={isChangingPassword}>
          {isChangingPassword ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Password'
          )}
        </Button>
      </div>
    </form>

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
            <p className="text-sm text-muted-accent">45 workouts per month</p>
          </div>
          <Button glow>Upgrade to Pro</Button>
        </div>
      </div>

      <div className="glass-surface rounded-xl p-6">
        <h2 className="text-xl font-semibold text-bright-accent mb-4">Plan Features</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted-main/30 rounded-lg border border-main/20">
            <span className="text-bright-accent">Workout Logging</span>
            <span className="text-accent">45/month</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted-main/30 rounded-lg border border-main/20">
            <span className="text-bright-accent">Progress Tracking</span>
            <span className="text-muted-accent">Pro Only</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted-main/30 rounded-lg border border-main/20">
            <span className="text-bright-accent">Programs</span>
            <span className="text-muted-accent">Pro Only</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted-main/30 rounded-lg border border-main/20">
            <span className="text-bright-accent">Data Export</span>
            <span className="text-accent">Included</span>
          </div>
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
const [isExporting, setIsExporting] = useState(false);
const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
// Delete account state
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [deletePassword, setDeletePassword] = useState('');
const [deleteConfirmText, setDeleteConfirmText] = useState('');
const [isDeleting, setIsDeleting] = useState(false);
const [deleteError, setDeleteError] = useState<string | null>(null);

const exportData = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    setExportMessage(null);

    try {
      // Fetch all workouts with exercises and sets
      const response = await fetch('/api/workouts?pageSize=1000');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      const workouts = result.data || [];

      if (workouts.length === 0) {
        setExportMessage({ type: 'error', text: 'No workout data to export' });
        setIsExporting(false);
        return;
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(workouts, null, 2);
        filename = `impacthub-workouts-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // CSV format - flatten the data
        const csvRows: string[] = [];
        csvRows.push('Workout Title,Date,Exercise,Set Number,Weight (lbs),Reps,RIR');

        workouts.forEach((workout: {
          title: string;
          workout_date: string;
          workout_exercises?: Array<{
            exercise_name: string;
            sets?: Array<{
              set_number: number;
              weight: number;
              reps: number;
              rir: number | null;
            }>;
          }>;
        }) => {
          if (workout.workout_exercises && workout.workout_exercises.length > 0) {
            workout.workout_exercises.forEach((exercise) => {
              if (exercise.sets && exercise.sets.length > 0) {
                exercise.sets.forEach((set) => {
                  csvRows.push(
                    `"${workout.title}","${workout.workout_date}","${exercise.exercise_name}",${set.set_number},${set.weight},${set.reps},${set.rir ?? ''}`
                  );
                });
              } else {
                csvRows.push(
                  `"${workout.title}","${workout.workout_date}","${exercise.exercise_name}",,,, `
                );
              }
            });
          } else {
            csvRows.push(`"${workout.title}","${workout.workout_date}",,,,,`);
          }
        });

        content = csvRows.join('\n');
        filename = `impacthub-workouts-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage({ type: 'success', text: `Successfully exported ${workouts.length} workouts as ${format.toUpperCase()}` });
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });

      const result = await response.json();

      if (!result.success) {
        setDeleteError(result.error || 'Failed to delete account');
        setIsDeleting(false);
        return;
      }

      // Sign out and redirect to home
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/?deleted=true';
    } catch (error) {
      console.error('Delete account error:', error);
      setDeleteError('An unexpected error occurred');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 opacity-0 animate-fade-in-up stagger-3">
      <div className="glass-surface rounded-xl p-6">
        <h2 className="text-xl font-semibold text-bright-accent mb-4">Export Your Data</h2>
        <p className="text-muted-accent mb-4">
          Download a copy of all your workout data in CSV or JSON format.
        </p>
        
        {exportMessage && (
          <div className={`p-3 rounded-lg mb-4 ${exportMessage.type === 'success' ? 'bg-main/20 border border-main/40 text-main' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {exportMessage.text}
          </div>
        )}
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => exportData('csv')}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportData('json')}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export JSON
          </Button>
        </div>
      </div>

      <div className="glass-surface rounded-xl border border-red-500/30 p-6">
        <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
        <p className="text-muted-accent mb-4">
          Once you delete your account, there is no going back. All your data including workouts, progress, and settings will be permanently removed.
        </p>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteModal(false);
              setDeletePassword('');
              setDeleteConfirmText('');
              setDeleteError(null);
            }}
          />
          <div className="relative glass-surface rounded-2xl p-6 max-w-md w-full border border-red-500/30 animate-fade-in-up">
            <h3 className="text-xl font-bold text-red-400 mb-4">Delete Account</h3>
            <p className="text-muted-accent mb-6">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-muted-accent mb-2">
                  Enter your password to confirm
                </label>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  disabled={isDeleting}
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-accent mb-2">
                  Type <span className="text-red-400 font-mono font-bold">DELETE</span> to confirm
                </label>
                <Input
                  type="text"
                  placeholder="Type DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={isDeleting}
                  className={deleteConfirmText === 'DELETE' ? 'border-red-500' : ''}
                />
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                <p className="text-sm text-red-400">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteConfirmText('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'DELETE' || !deletePassword}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Forever
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
