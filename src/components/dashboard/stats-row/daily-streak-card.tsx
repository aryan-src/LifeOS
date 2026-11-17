'use client';

import React, { useState } from 'react';
import type { StreakState } from '@/lib/daily-loop/types';
import type { WeekStripDay } from '@/lib/actions/daily-loop';
import { StreakPopover } from './streak-popover';

interface DailyStreakCardProps {
  streakState: StreakState;
  weekStrip: WeekStripDay[];
  onOpenQuickCapture?: (prefix: string) => void;
}

export function DailyStreakCard({
  streakState,
  weekStrip,
  onOpenQuickCapture,
}: DailyStreakCardProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { currentStreak, isTodayQualified, checklist, freezesLeft } = streakState;

  let badgeText = '2 of 3 today';
  let badgeClass =
    'text-stone-600 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60';

  if (isTodayQualified) {
    badgeText = 'Consistent';
    badgeClass =
      'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60';
  } else if (freezesLeft > 0) {
    badgeText = `${freezesLeft} freeze available`;
    badgeClass =
      'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200/60 dark:border-cyan-800/60';
  }

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200 min-w-0 relative"
      data-purpose="daily-streak-card"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-sans">
          Daily Streak
        </span>
        <button
          type="button"
          onClick={() => setIsPopoverOpen((prev) => !prev)}
          className={`text-[11px] font-sans px-2 py-0.5 rounded-full cursor-pointer hover:opacity-90 transition-opacity ${badgeClass}`}
        >
          {badgeText}
        </button>
      </div>

      <div
        className="flex items-baseline gap-2 mb-2 cursor-pointer group"
        onClick={() => setIsPopoverOpen((prev) => !prev)}
      >
        <span
          className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums group-hover:text-[#006c49] dark:group-hover:text-emerald-400 transition-colors"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
        </span>
      </div>

      {/* 7-Dot Strip */}
      <div
        className="flex items-center justify-between gap-1 pt-1 cursor-pointer"
        onClick={() => setIsPopoverOpen((prev) => !prev)}
        title="Click to view streak breakdown"
      >
        {weekStrip.map((day) => {
          let dotStyle = 'bg-stone-200 dark:bg-zinc-700';

          if (day.isQualified) {
            dotStyle = 'bg-[#006c49] dark:bg-emerald-500';
          } else if (day.isFrozen) {
            dotStyle = 'bg-cyan-500';
          } else if (day.isToday) {
            dotStyle = 'bg-amber-500 ring-2 ring-amber-100 dark:ring-amber-900/60';
          }

          return (
            <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
              <span
                className={`text-[10px] font-sans font-medium ${
                  day.isToday
                    ? 'text-amber-700 dark:text-amber-400 font-semibold'
                    : 'text-stone-400 dark:text-zinc-500'
                }`}
              >
                {day.dayLabel}
              </span>
              <span className={`w-2 h-2 rounded-full transition-all ${dotStyle}`} />
            </div>
          );
        })}
      </div>

      {/* Floating Popover */}
      <StreakPopover
        streakState={streakState}
        weekStrip={weekStrip}
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        onOpenQuickCapture={onOpenQuickCapture}
      />
    </div>
  );
}
