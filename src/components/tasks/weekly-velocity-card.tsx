'use client';

import React, { useState } from 'react';
import { Flame, TrendingUp, CheckCircle, Circle, Sparkles } from 'lucide-react';

interface RoutineCheckpoint {
  id: string;
  title: string;
  time: string;
  status: 'done' | 'next';
  is_completed: boolean;
}

const DEFAULT_CHECKPOINTS: RoutineCheckpoint[] = [
  {
    id: 'c1',
    title: 'Morning Standup',
    time: '09:00 AM',
    status: 'done',
    is_completed: true,
  },
  {
    id: 'c2',
    title: 'Code Review',
    time: '11:30 AM',
    status: 'done',
    is_completed: true,
  },
  {
    id: 'c3',
    title: 'Backlog Review',
    time: '05:30 PM',
    status: 'next',
    is_completed: false,
  },
];

export function WeeklyVelocityCard() {
  const [checkpoints, setCheckpoints] = useState<RoutineCheckpoint[]>(DEFAULT_CHECKPOINTS);

  const toggleCheckpoint = (id: string) => {
    setCheckpoints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              is_completed: !c.is_completed,
              status: !c.is_completed ? 'done' : 'next',
            }
          : c
      )
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900/70 rounded-2xl p-5 border border-stone-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-stone-900 dark:text-stone-100 font-semibold">
            Weekly Velocity &amp; Routines
          </h2>
        </div>
        <span className="font-mono text-xs text-stone-400 dark:text-zinc-500">
          Sprint W41
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Metric 1: Sprint Pts */}
        <div className="flex flex-col p-3 rounded-xl bg-stone-50/80 dark:bg-zinc-800/40 border border-stone-200/40 dark:border-zinc-800/60">
          <span className="font-mono text-[10px] text-stone-400 dark:text-zinc-500 uppercase tracking-wider">
            Sprint Pts
          </span>
          <span className="text-base font-semibold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
            18 <span className="text-stone-400 dark:text-zinc-500 text-xs font-normal">/ 24</span>
          </span>
          <div className="w-full h-1 bg-stone-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }} />
          </div>
        </div>

        {/* Metric 2: Active Streak */}
        <div className="flex flex-col p-3 rounded-xl bg-stone-50/80 dark:bg-zinc-800/40 border border-stone-200/40 dark:border-zinc-800/60">
          <span className="font-mono text-[10px] text-stone-400 dark:text-zinc-500 uppercase tracking-wider">
            Active Streak
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-current" />
            <span className="text-base font-semibold text-stone-900 dark:text-stone-100 font-mono">
              6 Days
            </span>
          </div>
          <span className="font-mono text-[10px] text-stone-400 dark:text-zinc-500 mt-1.5">
            Personal best
          </span>
        </div>

        {/* Metric 3: Avg Focus */}
        <div className="flex flex-col p-3 rounded-xl bg-stone-50/80 dark:bg-zinc-800/40 border border-stone-200/40 dark:border-zinc-800/60">
          <span className="font-mono text-[10px] text-stone-400 dark:text-zinc-500 uppercase tracking-wider">
            Avg Focus
          </span>
          <span className="text-base font-semibold text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
            3.2h <span className="text-stone-400 dark:text-zinc-500 text-xs font-normal">/ day</span>
          </span>
          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +18% vs last wk
          </span>
        </div>
      </div>

      {/* Daily Habit Micro-Checkins */}
      <div className="flex flex-col gap-2 pt-1">
        <span className="font-mono text-[11px] text-stone-400 dark:text-zinc-500 uppercase tracking-wider">
          Daily Execution Checkpoints
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {checkpoints.map((cp) => (
            <div
              key={cp.id}
              onClick={() => toggleCheckpoint(cp.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl transition-all cursor-pointer border ${
                cp.is_completed
                  ? 'bg-stone-50 dark:bg-zinc-800/50 hover:bg-stone-100/80 dark:hover:bg-zinc-800 border-stone-200/50 dark:border-zinc-800/60'
                  : 'bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800/30 border-dashed border-stone-300 dark:border-zinc-700'
              }`}
            >
              {cp.is_completed ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-stone-300 dark:text-zinc-600 shrink-0" />
              )}
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-xs font-medium truncate ${
                    cp.is_completed
                      ? 'text-stone-800 dark:text-zinc-200'
                      : 'text-stone-500 dark:text-zinc-400'
                  }`}
                >
                  {cp.title}
                </span>
                <span className="font-mono text-[10px] text-stone-400 dark:text-zinc-500">
                  {cp.time} · {cp.is_completed ? 'Done' : 'Next'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
