'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Profile {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/workouts', label: 'Workouts', icon: Dumbbell, exact: false },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar, exact: false },
  { href: '/dashboard/programs', label: 'Programs', icon: BookOpen, exact: false },
  { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp, exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        setProfile(profileData);
      }
    }

    loadUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-muted-main/80 backdrop-blur-md border border-main/30 rounded-lg text-bright-accent/80 hover:text-accent"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-muted-main/70 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 z-40 transition-all duration-300',
          'bg-muted-main/70 backdrop-blur-xl border-r border-main/40',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.3), inset -1px 0 0 rgba(17, 100, 102, 0.2)'
        }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-4 border-b border-main/30">
            <Link href="/" className="group flex items-center gap-2">
              <Dumbbell className="w-8 h-8 text-white group-hover:text-accent transition-colors duration-300 group-hover:rotate-12" />
              <span className="text-xl font-bold text-white group-hover:text-accent transition-all duration-300">
                ImpactHub
              </span>
            </Link>
          </div>

          <nav className="flex-1 py-6 px-3 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact 
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(link.href + '/');
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all',
                    isActive
                      ? 'bg-main text-bright-accent shadow-glow-main'
                      : 'text-muted-accent hover:text-accent hover:bg-main/20'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile section */}
          <div className="p-3 border-t border-main/30">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-main/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-main" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-bright-accent truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-accent truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-muted-accent hover:text-accent hover:bg-main/20 transition-all disabled:opacity-50"
            >
              <LogOut className={cn("w-5 h-5 flex-shrink-0", isLoggingOut && "animate-pulse")} />
              <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
