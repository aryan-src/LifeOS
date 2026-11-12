'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BENEFITS } from './demo-data';

export function Benefits() {
  const shouldReduceMotion = useReducedMotion();

  const getMotionProps = (delay = 0) => ({
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: shouldReduceMotion ? 0 : delay,
    },
  });

  return (
    <section className="sec" aria-labelledby="ben-title">
      <div className="sec-in">
        <motion.span className="lab" {...getMotionProps(0)}>
          What you get
        </motion.span>

        <motion.h2
          id="ben-title"
          style={{ marginTop: '12px' }}
          {...getMotionProps(0.06)}
        >
          Five trackers, one dashboard
        </motion.h2>

        <div className="ben-grid">
          {BENEFITS.map((item, idx) => (
            <motion.article
              key={idx}
              className={`bcard ${item.gridSpan}`}
              {...getMotionProps(0.12 + idx * 0.06)}
            >
              <span className="lab">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
