'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  className?: string;
  style?: React.CSSProperties;
}

const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width = '100%',
  height = 'auto',
  borderRadius = 16,
  borderWidth = 1,
  brightness = 50,
  opacity = 0.9,
  blur = 12,
  className = '',
  style = {}
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getContainerStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      ...style,
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: `${borderRadius}px`,
    };

    if (!mounted) {
      return {
        ...baseStyles,
        background: 'rgba(44, 53, 49, 0.8)',
        border: `${borderWidth}px solid rgba(17, 100, 102, 0.3)`,
      };
    }

    return {
      ...baseStyles,
      background: `rgba(44, 53, 49, ${opacity * 0.5})`,
      backdropFilter: `blur(${blur}px) saturate(1.2) brightness(${brightness / 100 + 0.5})`,
      WebkitBackdropFilter: `blur(${blur}px) saturate(1.2) brightness(${brightness / 100 + 0.5})`,
      border: `${borderWidth}px solid rgba(17, 100, 102, 0.25)`,
      boxShadow: `
        inset 0 1px 0 0 rgba(209, 232, 226, 0.15),
        inset 0 -1px 0 0 rgba(17, 100, 102, 0.1),
        0 8px 32px 0 rgba(44, 53, 49, 0.4),
        0 4px 16px 0 rgba(17, 100, 102, 0.1)
      `,
    };
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center justify-center overflow-hidden transition-all duration-300',
        className
      )}
      style={getContainerStyles()}
    >
      {/* Inner glow effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(209, 232, 226, 0.1) 0%, transparent 50%)',
          borderRadius: `${borderRadius}px`,
        }}
      />
      
      {/* Content */}
      <div className="relative w-full h-full z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;
