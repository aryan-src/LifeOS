'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';

export function FinalCTA() {
  const shouldReduceMotion = useReducedMotion();

  const getMotionProps = () => ({
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  });

  return (
    <section className="sec" id="signup" aria-labelledby="final-title">
      <div className="sec-in">
        <motion.div className="final" {...getMotionProps()}>
          <h2 id="final-title">Put your whole day on one screen</h2>
          <p>Free for now. Your dashboard is ready as soon as you sign up.</p>
          <Link className="btn btn-lg" href="/login">
            Start free
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
