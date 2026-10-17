'use client';

import React, { useEffect, useState } from 'react';
import { motion, type MotionStyle, type Transition } from 'motion/react';
import { cn } from '@/lib/utils';

export interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  borderRadius?: number | string;
  initialOffset?: number;
  reverse?: boolean;
  transition?: Transition;
  style?: MotionStyle;
}

/**
 * BorderBeam component inspired by Magic UI and 21st.dev (@larsen66/components/border-beam-search).
 *
 * Provides a fluid, subtle perimeter trace along the rounded border of any container.
 * Uses CSS mask clipping and motion paths to prevent layout shift and isolate rendering
 * to the hairline border area, overriding aggressive cyberpunk glow with a psychologically
 * calming, muted LifeOS aesthetic (soft sage green / low-contrast neutral).
 */
export function BorderBeam({
  className,
  size = 140,
  duration = 10,
  delay = 0,
  colorFrom = 'rgba(16, 185, 129, 0.45)', // soft sage green at low opacity
  colorTo = 'transparent',
  borderWidth = 1.5,
  borderRadius = 16,
  initialOffset = 0,
  reverse = false,
  transition,
  style,
}: BorderBeamProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const radius =
    typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;

  return (
    <div
      style={
        {
          '--size': `${size}px`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--border-width': `${borderWidth}px`,
          border: `${borderWidth}px solid transparent`,
          WebkitMaskImage:
            'linear-gradient(#000, #000), linear-gradient(#000, #000)',
          WebkitMaskClip: 'padding-box, border-box',
          WebkitMaskComposite: 'xor',
          maskImage:
            'linear-gradient(#000, #000), linear-gradient(#000, #000)',
          maskClip: 'padding-box, border-box',
          maskComposite: 'exclude',
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute -inset-px rounded-[inherit] overflow-hidden z-0',
        className
      )}
    >
      {mounted && (
        <motion.div
          className={cn(
            'absolute aspect-square',
            'bg-gradient-to-l from-[var(--color-from)] via-[var(--color-from)]/40 to-[var(--color-to)]'
          )}
          style={{
            width: 'var(--size)',
            offsetPath: `rect(0 auto auto 0 round ${radius})`,
          }}
          initial={{ offsetDistance: `${initialOffset}%` }}
          animate={{
            offsetDistance: reverse
              ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
              : [`${initialOffset}%`, `${100 + initialOffset}%`],
          }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration,
            delay,
            ...transition,
          }}
        />
      )}
    </div>
  );
}
