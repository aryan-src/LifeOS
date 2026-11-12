'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { DashboardPreview } from './dashboard-preview';

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  const getTransition = (delay = 0) => ({
    duration: shouldReduceMotion ? 0 : 0.8,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    delay: shouldReduceMotion ? 0 : delay,
  });

  return (
    <section className="hero" aria-labelledby="hero-title">
      <motion.h1
        id="hero-title"
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getTransition(0)}
      >
        Your whole student life, tracked on one calm screen
      </motion.h1>

      <motion.p
        className="sub"
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getTransition(0.06)}
      >
        LifeOS keeps your pocket money, daily tasks, habits, projects and ideas together, so you
        can see where your day and your money stand at a glance.
      </motion.p>

      <motion.div
        className="cta-row"
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getTransition(0.12)}
      >
        <Link className="btn btn-lg" href="/login">
          Start free
        </Link>
      </motion.div>

      <DashboardPreview />
    </section>
  );
}
