'use client';

import { useEffect, useState } from 'react';

interface FloatingOrbProps {
  className?: string;
  color?: 'main' | 'accent' | 'bright';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  position?: { top?: string; left?: string; right?: string; bottom?: string };
  delay?: number;
}

function FloatingOrb({ 
  color = 'main', 
  size = 'md', 
  position = {}, 
  delay = 0 
}: FloatingOrbProps) {
  const colors = {
    main: 'bg-main',
    accent: 'bg-accent',
    bright: 'bg-bright-accent',
  };

  const sizes = {
    sm: 'w-32 h-32',
    md: 'w-64 h-64',
    lg: 'w-96 h-96',
    xl: 'w-[500px] h-[500px]',
  };

  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${colors[color]} ${sizes[size]} animate-float`}
      style={{
        ...position,
        animationDelay: `${delay}s`,
        animationDuration: `${8 + Math.random() * 4}s`,
      }}
    />
  );
}

interface AnimatedBackgroundProps {
  variant?: 'orbs' | 'gradient' | 'mesh';
  intensity?: 'subtle' | 'medium' | 'strong';
}

export default function AnimatedBackground({ 
  variant = 'orbs',
  intensity = 'subtle'
}: AnimatedBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 -z-10 bg-muted-main" />;
  }

  const opacityMap = {
    subtle: 'opacity-30',
    medium: 'opacity-50',
    strong: 'opacity-70',
  };

  if (variant === 'gradient') {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 animated-gradient-bg" />
        <div className="absolute inset-0 bg-muted-main/60" />
      </div>
    );
  }

  if (variant === 'mesh') {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden bg-muted-main">
        <div className={`absolute inset-0 ${opacityMap[intensity]}`}>
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(at 40% 20%, rgba(17, 100, 102, 0.4) 0px, transparent 50%),
                radial-gradient(at 80% 0%, rgba(255, 203, 154, 0.3) 0px, transparent 50%),
                radial-gradient(at 0% 50%, rgba(17, 100, 102, 0.3) 0px, transparent 50%),
                radial-gradient(at 80% 50%, rgba(209, 232, 226, 0.2) 0px, transparent 50%),
                radial-gradient(at 0% 100%, rgba(255, 203, 154, 0.3) 0px, transparent 50%),
                radial-gradient(at 80% 100%, rgba(17, 100, 102, 0.4) 0px, transparent 50%)
              `,
            }}
          />
        </div>
      </div>
    );
  }

  // Default: orbs variant
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-muted-main">
      <div className={opacityMap[intensity]}>
        {/* Floating orbs with different positions and timings */}
        <FloatingOrb color="main" size="xl" position={{ top: '-10%', left: '-5%' }} delay={0} />
        <FloatingOrb color="accent" size="lg" position={{ top: '20%', right: '-10%' }} delay={2} />
        <FloatingOrb color="bright" size="md" position={{ bottom: '10%', left: '10%' }} delay={4} />
        <FloatingOrb color="main" size="lg" position={{ bottom: '-5%', right: '20%' }} delay={1} />
        <FloatingOrb color="accent" size="sm" position={{ top: '50%', left: '30%' }} delay={3} />
      </div>
      {/* Subtle overlay for readability */}
      <div className="absolute inset-0 bg-muted-main/40" />
    </div>
  );
}
