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
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/dashboard/programs', label: 'Programs', icon: BookOpen },
  { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
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
          'fixed top-0 left-0 h-full z-40 transition-all duration-300',
          'bg-muted-main/70 backdrop-blur-xl border-r border-main/40',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.3), inset -1px 0 0 rgba(17, 100, 102, 0.2)'
        }}
      >
        <div className="flex flex-col h-full">
          <div className={cn(
            'flex items-center h-16 px-4 border-b border-main/30',
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            {!collapsed && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <Dumbbell className="w-8 h-8 text-main" />
                <span className="text-xl font-bold text-bright-accent">ImpactHub</span>
              </Link>
            )}
            {collapsed && (
              <Dumbbell className="w-8 h-8 text-main" />
            )}
            <button
              className="hidden lg:block text-muted-accent hover:text-accent transition-colors"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft className={cn(
                'w-5 h-5 transition-transform',
                collapsed && 'rotate-180'
              )} />
            </button>
          </div>

          <nav className="flex-1 py-6 px-3 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all',
                    isActive
                      ? 'bg-main text-bright-accent shadow-glow-main'
                      : 'text-muted-accent hover:text-accent hover:bg-main/20',
                    collapsed && 'justify-center'
                  )}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-main/30">
            <button
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg font-medium text-muted-accent hover:text-accent hover:bg-main/20 transition-all',
                collapsed && 'justify-center'
              )}
              title={collapsed ? 'Log out' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
