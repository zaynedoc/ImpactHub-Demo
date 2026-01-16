'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/workouts', label: 'Workouts', icon: Dumbbell, exact: false },
  { href: '/dashboard/programs', label: 'Programs', icon: BookOpen, exact: false },
  { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp, exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <Link href="/dashboard" className="flex items-center gap-2">
              <Dumbbell className="w-8 h-8 text-main" />
              <span className="text-xl font-bold text-bright-accent">ImpactHub</span>
            </Link>
          </div>

          <nav className="flex-1 py-6 px-3 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              // For exact match (Dashboard), only match exact path
              // For other links, match if path starts with the link href
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

          <div className="p-3 border-t border-main/30">
            <button
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-muted-accent hover:text-accent hover:bg-main/20 transition-all"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
