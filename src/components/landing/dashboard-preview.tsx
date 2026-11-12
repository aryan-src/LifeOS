'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  SAMPLE_POCKET_MONEY,
  SAMPLE_SPENDING,
  SAMPLE_PROJECTS,
  SAMPLE_FOCUS,
  SAMPLE_HABIT,
  SAMPLE_IDEA,
} from './demo-data';

export function DashboardPreview() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="frame"
      role="img"
      aria-label="Sample LifeOS dashboard showing a monthly budget, today’s focus timer, habit streak, active projects and a saved idea"
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    >
      <div className="board" aria-hidden="true">
        {/* Card 1 (Row 1, 2 cols): Pocket Money */}
        <div className="card s2">
          <span className="lab">{SAMPLE_POCKET_MONEY.label}</span>
          <span className="big">{SAMPLE_POCKET_MONEY.amount}</span>
          <div className="bar">
            <i style={{ width: `${SAMPLE_POCKET_MONEY.progressPercent}%` }}></i>
          </div>
          <span className="small">{SAMPLE_POCKET_MONEY.caption}</span>
        </div>

        {/* Card 2 (Row 1, 4 cols): 7 Days Spending Chart */}
        <div className="card s4">
          <span className="lab">{SAMPLE_SPENDING.label}</span>
          <div className="row">
            <span className="big">{SAMPLE_SPENDING.amount}</span>
            <span className="small">{SAMPLE_SPENDING.sublabel}</span>
          </div>
          <div className="chart">
            {SAMPLE_SPENDING.days.map((item, idx) => (
              <i
                key={idx}
                className={item.isToday ? 'today' : undefined}
                style={{ height: item.height }}
              />
            ))}
          </div>
          <div className="days">
            {SAMPLE_SPENDING.days.map((item, idx) => (
              <span key={idx}>{item.day}</span>
            ))}
          </div>
        </div>

        {/* Card 3 (Row 2, 4 cols): Active Projects */}
        <div className="card s4">
          <span className="lab">Active projects</span>
          {SAMPLE_PROJECTS.map((proj, idx) => (
            <div key={idx} className="row">
              <span className="small">{proj.title}</span>
              <span
                className={`chip ${
                  proj.variant === 'backlog'
                    ? 'mute'
                    : proj.variant === 'paused'
                    ? 'warm'
                    : ''
                }`}
              >
                {proj.status}
              </span>
            </div>
          ))}
        </div>

        {/* Card 4 (Row 2, 2 cols): Today's Focus */}
        <div className="card s2">
          <span className="lab">{SAMPLE_FOCUS.label}</span>
          <div className="row">
            <span className="timer">{SAMPLE_FOCUS.timer}</span>
            <span className="chip">{SAMPLE_FOCUS.chip}</span>
          </div>
          <div className="bar">
            <i style={{ width: `${SAMPLE_FOCUS.progressPercent}%` }}></i>
          </div>
          <span className="small">{SAMPLE_FOCUS.caption}</span>
        </div>

        {/* Card 5 (Row 3, 2 cols): Habits */}
        <div className="card s2">
          <span className="lab">{SAMPLE_HABIT.label}</span>
          <div className="row">
            <span className="small">{SAMPLE_HABIT.name}</span>
            <span className="chip warm">{SAMPLE_HABIT.streak}</span>
          </div>
          <div className="dots">
            {SAMPLE_HABIT.dots.map((active, idx) => (
              <i key={idx} className={active ? 'on' : undefined} />
            ))}
          </div>
          <span className="small">{SAMPLE_HABIT.caption}</span>
        </div>

        {/* Card 6 (Row 3, 4 cols): Recent Ideas */}
        <div className="card s4">
          <span className="lab">{SAMPLE_IDEA.label}</span>
          <span className="small">{SAMPLE_IDEA.text}</span>
          <span className="chip mute">{SAMPLE_IDEA.action}</span>
        </div>
      </div>
    </motion.div>
  );
}
