'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { HOW_IT_WORKS_STEPS } from './demo-data';

export function HowItWorks() {
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
    <section className="sec" aria-labelledby="how-title">
      <div className="sec-in">
        <motion.span className="lab" {...getMotionProps(0)}>
          How it works
        </motion.span>

        <motion.h2
          id="how-title"
          style={{ marginTop: '12px' }}
          {...getMotionProps(0.06)}
        >
          Set up once, then open it each morning
        </motion.h2>

        <ol className="steps">
          {HOW_IT_WORKS_STEPS.map((step, idx) => (
            <motion.li
              key={step.number}
              className="step"
              {...getMotionProps(0.12 + idx * 0.06)}
            >
              <span className="num" aria-hidden="true">
                {step.number}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </motion.li>
          ))}
        </ol>

        <motion.div className="after-steps" {...getMotionProps(0.3)}>
          <Link className="btn btn-lg" href="/login">
            Start free
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
