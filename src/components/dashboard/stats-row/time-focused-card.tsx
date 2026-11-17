'use client';

import React from 'react';

interface TimeFocusedCardProps {
  timeFocused: {
    minutes: number;
    goalMinutes: number;
    formattedTime: string;
    formattedGoal: string;
    percent: number;
  };
}

export function TimeFocusedCard({ timeFocused }: TimeFocusedCardProps) {
  return (
    <div
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200 min-w-0"
      data-purpose="time-focused-card"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-sans">
          Time Focused
        </span>
        <span className="w-2 h-2 rounded-full bg-[#006c49] dark:bg-emerald-500 animate-pulse" />
      </div>

      <div className="flex items-baseline gap-1.5 mb-3">
        <span
          className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums lining-nums"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontVariantNumeric: 'lining-nums tabular-nums',
          }}
        >
          {timeFocused.formattedTime} active
        </span>
        <span
          className="text-xs text-stone-500 dark:text-zinc-400 font-sans tabular-nums lining-nums"
          style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
        >
          / {timeFocused.formattedGoal}
        </span>
      </div>

      <div className="space-y-2">
        <div className="w-full h-1.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#006c49] dark:bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, timeFocused.percent)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
