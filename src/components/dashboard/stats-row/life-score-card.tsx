'use client';

import React from 'react';
import type { LifeScoreBreakdown } from '@/lib/daily-loop/types';

interface LifeScoreCardProps {
  lifeScore: LifeScoreBreakdown;
}

export function LifeScoreCard({ lifeScore }: LifeScoreCardProps) {
  const delta = lifeScore.deltaVsYesterday;
  const isPositive = delta > 0;
  const isZero = delta === 0;

  const deltaText = isZero ? '0 vs yesterday' : `${isPositive ? '+' : ''}${delta} vs yesterday`;
  const deltaBadgeClass = isPositive
    ? 'text-[#006c49] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60'
    : isZero
    ? 'text-stone-600 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60'
    : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60';

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200 min-w-0"
      data-purpose="life-score-card"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-sans">
          Life Score
        </span>
        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${deltaBadgeClass}`}>
          {deltaText}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span
          className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          {lifeScore.total}
        </span>
        <span className="text-xs text-stone-500 dark:text-zinc-400 font-sans">/ 100</span>
      </div>

      <div className="space-y-2">
        <div className="w-full h-1.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#006c49] dark:bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, lifeScore.total)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
