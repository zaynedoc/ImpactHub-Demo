'use client';

import { memo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: 'default' | 'accent' | 'bright';
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 0,
    spread = 20,
    variant = 'default',
    glow = false,
    className,
    movementDuration = 2,
    borderWidth = 1,
    disabled = true,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>(0);

    const handleMove = useCallback(
      (e?: MouseEvent | { x: number; y: number }) => {
        if (!containerRef.current) return;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;

          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = e?.x ?? lastPosition.current.x;
          const mouseY = e?.y ?? lastPosition.current.y;

          if (e) {
            lastPosition.current = { x: mouseX, y: mouseY };
          }

          const center = [left + width * 0.5, top + height * 0.5];
          const distanceFromCenter = Math.hypot(
            mouseX - center[0],
            mouseY - center[1]
          );
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

          if (distanceFromCenter < inactiveRadius) {
            element.style.setProperty('--active', '0');
            return;
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          element.style.setProperty('--active', isActive ? '1' : '0');

          if (!isActive) return;

          const currentAngle =
            parseFloat(element.style.getPropertyValue('--start')) || 0;
          let targetAngle =
            (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) /
              Math.PI +
            90;

          const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
          const newAngle = currentAngle + angleDiff;

          // Simple animation without framer-motion dependency
          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / (movementDuration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = currentAngle + (newAngle - currentAngle) * eased;
            element.style.setProperty('--start', String(value));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        });
      },
      [inactiveZone, proximity, movementDuration]
    );

    useEffect(() => {
      if (disabled) return;

      const handleScroll = () => handleMove();
      const handlePointerMove = (e: PointerEvent) => handleMove(e);

      window.addEventListener('scroll', handleScroll, { passive: true });
      document.body.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        window.removeEventListener('scroll', handleScroll);
        document.body.removeEventListener('pointermove', handlePointerMove);
      };
    }, [handleMove, disabled]);

    const getGradient = () => {
      switch (variant) {
        case 'accent':
          return `radial-gradient(circle, #FFCB9A 10%, transparent 20%),
            radial-gradient(circle at 40% 40%, #D9B08C 5%, transparent 15%),
            radial-gradient(circle at 60% 60%, #116466 10%, transparent 20%),
            repeating-conic-gradient(
              from 236.84deg at 50% 50%,
              #FFCB9A 0%,
              #D9B08C calc(25% / var(--repeating-conic-gradient-times)),
              #116466 calc(50% / var(--repeating-conic-gradient-times)),
              #D1E8E2 calc(75% / var(--repeating-conic-gradient-times)),
              #FFCB9A calc(100% / var(--repeating-conic-gradient-times))
            )`;
        case 'bright':
          return `radial-gradient(circle, #D1E8E2 10%, transparent 20%),
            radial-gradient(circle at 40% 40%, #116466 5%, transparent 15%),
            repeating-conic-gradient(
              from 236.84deg at 50% 50%,
              #D1E8E2 0%,
              #116466 calc(50% / var(--repeating-conic-gradient-times)),
              #D1E8E2 calc(100% / var(--repeating-conic-gradient-times))
            )`;
        default:
          return `radial-gradient(circle, #116466 10%, transparent 20%),
            radial-gradient(circle at 40% 40%, #FFCB9A 5%, transparent 15%),
            radial-gradient(circle at 60% 60%, #D9B08C 10%, transparent 20%),
            radial-gradient(circle at 40% 60%, #D1E8E2 10%, transparent 20%),
            repeating-conic-gradient(
              from 236.84deg at 50% 50%,
              #116466 0%,
              #FFCB9A calc(25% / var(--repeating-conic-gradient-times)),
              #D9B08C calc(50% / var(--repeating-conic-gradient-times)),
              #D1E8E2 calc(75% / var(--repeating-conic-gradient-times)),
              #116466 calc(100% / var(--repeating-conic-gradient-times))
            )`;
      }
    };

    return (
      <>
        <div
          className={cn(
            'pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity',
            glow && 'opacity-100',
            variant === 'bright' && 'border-bright-accent',
            disabled && '!block'
          )}
        />
        <div
          ref={containerRef}
          style={
            {
              '--blur': `${blur}px`,
              '--spread': spread,
              '--start': '0',
              '--active': '0',
              '--glowingeffect-border-width': `${borderWidth}px`,
              '--repeating-conic-gradient-times': '5',
              '--gradient': getGradient(),
            } as React.CSSProperties
          }
          className={cn(
            'pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity',
            glow && 'opacity-100',
            blur > 0 && 'blur-[var(--blur)]',
            className,
            disabled && '!hidden'
          )}
        >
          <div
            className={cn(
              'glow',
              'rounded-[inherit]',
              'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
              'after:[border:var(--glowingeffect-border-width)_solid_transparent]',
              'after:[background:var(--gradient)] after:[background-attachment:fixed]',
              'after:opacity-[var(--active)] after:transition-opacity after:duration-300',
              'after:[mask-clip:padding-box,border-box]',
              'after:[mask-composite:intersect]',
              'after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]'
            )}
          />
        </div>
      </>
    );
  }
);

GlowingEffect.displayName = 'GlowingEffect';

export { GlowingEffect };
