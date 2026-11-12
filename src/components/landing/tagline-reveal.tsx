'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { TAGLINE_WORDS } from './demo-data';

export function TaglineReveal() {
  const containerRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [litCount, setLitCount] = useState<number>(() => (shouldReduceMotion ? TAGLINE_WORDS.length : 0));

  useEffect(() => {
    if (shouldReduceMotion) {
      setLitCount(TAGLINE_WORDS.length);
      return;
    }

    const updateTagline = () => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const progress = Math.min(
        1,
        Math.max(0, (window.innerHeight * 0.85 - rect.top) / (window.innerHeight * 0.5))
      );
      const activeCount = Math.round(progress * TAGLINE_WORDS.length);
      setLitCount(activeCount);
    };

    window.addEventListener('scroll', updateTagline, { passive: true });
    window.addEventListener('resize', updateTagline);
    updateTagline();

    return () => {
      window.removeEventListener('scroll', updateTagline);
      window.removeEventListener('resize', updateTagline);
    };
  }, [shouldReduceMotion]);

  return (
    <section ref={containerRef} className="tag-sec" aria-label="What LifeOS does">
      <p className="tg">
        {TAGLINE_WORDS.map((word, idx) => {
          const isLit = shouldReduceMotion || idx < litCount;
          return (
            <React.Fragment key={idx}>
              <span
                className="w"
                style={{
                  opacity: isLit ? 1 : 0.2,
                  transition: shouldReduceMotion
                    ? 'none'
                    : 'opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                  display: 'inline-block',
                }}
              >
                {word}
              </span>
              {idx < TAGLINE_WORDS.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </p>
    </section>
  );
}
