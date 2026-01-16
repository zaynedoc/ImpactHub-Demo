'use client';

import React, { CSSProperties, useEffect, useRef, useState, useMemo } from 'react';

type GradualBlurProps = {
  position?: 'top' | 'bottom' | 'left' | 'right';
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  opacity?: number;
  target?: 'parent' | 'page';
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_CONFIG: Required<Omit<GradualBlurProps, 'className' | 'style'>> & { className: string; style: CSSProperties } = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  width: '100%',
  divCount: 10,
  exponential: true,
  zIndex: 1000,
  opacity: 1,
  target: 'parent',
  className: '',
  style: {}
};

const getGradientDirection = (position: string): string => {
  const directions: Record<string, string> = {
    top: 'to top',
    bottom: 'to bottom',
    left: 'to left',
    right: 'to right'
  };
  return directions[position] || 'to bottom';
};

const GradualBlur: React.FC<GradualBlurProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  const config = useMemo(() => {
    return { ...DEFAULT_CONFIG, ...props } as Required<GradualBlurProps> & { className: string; style: CSSProperties };
  }, [props]);

  const blurDivs = useMemo(() => {
    const divs: React.ReactNode[] = [];
    const increment = 100 / config.divCount;

    for (let i = 1; i <= config.divCount; i++) {
      const progress = i / config.divCount;

      let blurValue: number;
      if (config.exponential) {
        blurValue = Math.pow(2, progress * 4) * 0.0625 * config.strength;
      } else {
        blurValue = 0.0625 * (progress * config.divCount + 1) * config.strength;
      }

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const direction = getGradientDirection(config.position);

      const divStyle: CSSProperties = {
        maskImage: `linear-gradient(${direction}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        opacity: config.opacity,
      };

      divs.push(<div key={i} className="absolute inset-0" style={divStyle} />);
    }

    return divs;
  }, [config]);

  const containerStyle: CSSProperties = useMemo(() => {
    const isVertical = ['top', 'bottom'].includes(config.position);
    const isHorizontal = ['left', 'right'].includes(config.position);
    const isPageTarget = config.target === 'page';

    const baseStyle: CSSProperties = {
      position: isPageTarget ? 'fixed' : 'absolute',
      pointerEvents: 'none',
      opacity: isVisible ? 1 : 0,
      zIndex: isPageTarget ? config.zIndex + 100 : config.zIndex,
      ...config.style
    };

    if (isVertical) {
      baseStyle.height = config.height;
      baseStyle.width = config.width;
      baseStyle[config.position] = 0;
      baseStyle.left = 0;
      baseStyle.right = 0;
    } else if (isHorizontal) {
      baseStyle.width = config.width || config.height;
      baseStyle.height = '100%';
      baseStyle[config.position] = 0;
      baseStyle.top = 0;
      baseStyle.bottom = 0;
    }

    return baseStyle;
  }, [config, isVisible]);

  return (
    <div
      ref={containerRef}
      className={`gradual-blur relative isolate ${config.target === 'page' ? 'gradual-blur-page' : 'gradual-blur-parent'} ${config.className}`}
      style={containerStyle}
    >
      <div className="relative w-full h-full">{blurDivs}</div>
    </div>
  );
};

export default GradualBlur;
