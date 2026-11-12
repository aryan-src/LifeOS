'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export function ProblemSolution() {
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
    <section className="sec" aria-labelledby="problem-title">
      <div className="sec-in">
        <motion.span className="lab" {...getMotionProps(0)}>
          The problem
        </motion.span>

        <motion.h2
          id="problem-title"
          style={{ marginTop: '12px' }}
          {...getMotionProps(0.06)}
        >
          Money in one app, tasks in another, ideas in a third
        </motion.h2>

        <motion.p className="lead" {...getMotionProps(0.12)}>
          Most students end up juggling a budget sheet, a to do list, a habit app, a notes app and
          a project board. Each one works fine alone. Together they mean five places to check
          before you know how your day is going.
        </motion.p>

        <div className="cmp">
          {/* Before Pane */}
          <motion.div className="pane" {...getMotionProps(0.18)}>
            <span className="lab">Before</span>
            <div className="tags scatter">
              <span className="chip">Budget sheet</span>
              <span className="chip">To do app</span>
              <span className="chip">Habit app</span>
              <span className="chip">Notes app</span>
              <span className="chip">Project board</span>
            </div>
            <p>Five tabs, five logins, and no single view of where you stand.</p>
          </motion.div>

          {/* With LifeOS Pane */}
          <motion.div className="pane after" {...getMotionProps(0.24)}>
            <span className="lab">With LifeOS</span>
            <div className="tags">
              <span className="chip">Pocket money</span>
              <span className="chip">Tasks</span>
              <span className="chip">Habits</span>
              <span className="chip">Projects</span>
              <span className="chip">Ideas</span>
            </div>
            <p>
              One dashboard shows all five side by side, and each page goes deeper when you need
              it.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
