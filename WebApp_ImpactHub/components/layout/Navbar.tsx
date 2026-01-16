'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-surface animate-fade-in-down">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo with hover animation */}
          <Link href="/" className="group flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-main group-hover:text-accent transition-colors duration-300 group-hover:rotate-12" />
            <span className="text-xl font-bold text-bright-accent group-hover:text-gradient transition-all duration-300">
              ImpactHub
            </span>
          </Link>

          {/* Desktop nav links with underline animation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'link-underline text-sm font-medium transition-all duration-300',
                  pathname === link.href
                    ? 'text-accent'
                    : 'text-bright-accent/80 hover:text-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-bright-accent/80 hover:text-accent transition-all duration-300 hover:-translate-y-0.5"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="group px-4 py-2 bg-main text-bright-accent text-sm font-semibold rounded-lg transition-all duration-300 shadow-glow-main hover:shadow-glow-accent hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-bright-accent/80 hover:text-accent transition-colors p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className="relative w-6 h-6">
              <Menu className={cn(
                "w-6 h-6 absolute transition-all duration-300",
                mobileMenuOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
              )} />
              <X className={cn(
                "w-6 h-6 absolute transition-all duration-300",
                mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
              )} />
            </div>
          </button>
        </div>

        {/* Mobile menu with slide animation */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="py-4 border-t border-main/30">
            <div className="flex flex-col gap-4">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-all duration-300',
                    pathname === link.href
                      ? 'text-accent'
                      : 'text-bright-accent/80 hover:text-accent hover:translate-x-2'
                  )}
                  style={{ transitionDelay: `${index * 50}ms` }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-main/30">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-bright-accent/80 hover:text-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-main text-bright-accent text-sm font-semibold rounded-lg hover:bg-main/80 transition-all shadow-glow-main text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
