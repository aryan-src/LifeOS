'use client';

import React from 'react';
import type { HabitWithLog } from '@/lib/actions/habits';
import { Award, Flame } from 'lucide-react';

interface StreakRecordsCardProps {
  habits: HabitWithLog[];
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

/**
 * Top active protocols ranked by current streak length.
 * Uses real habit data and the semantic `secondary` token.
 */
export function StreakRecordsCard({ habits }: StreakRecordsCardProps) {
  // Sort habits by current streak descending
  const ranked = [...habits]
    .filter((h) => h.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 4);

  const maxStreak = ranked.length > 0 ? Math.max(...ranked.map((h) => h.streak), 30) : 30;

  return (
    <div
      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-xs space-y-4"
      data-purpose="streak-records-card"
    >
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-secondary" aria-hidden="true" />
          <h2 className="font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
            Streak Records
          </h2>
        </div>
        <span
          className="font-mono text-label-sm text-on-surface-variant"
          style={LINING_NUMS_STYLE}
        >
          {ranked.length} active
        </span>
      </div>

      {ranked.length === 0 ? (
        <div className="py-6 text-center">
          <p className="font-sans text-body-sm text-on-surface-variant">
            No active streaks recorded yet. Complete protocols daily to unlock streaks.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ranked.map((habit) => {
            const percent = Math.min(100, Math.round((habit.streak / maxStreak) * 100));

            return (
              <div key={habit.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="truncate max-w-[190px] font-sans font-medium text-on-surface">
                    {habit.title}
                  </span>
                  <div
                    className="flex items-center gap-1 font-mono font-semibold text-on-surface"
                    style={LINING_NUMS_STYLE}
                  >
                    <Flame className="h-3 w-3 text-secondary" aria-hidden="true" />
                    <span>{habit.streak}D</span>
                  </div>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-secondary transition-all duration-500 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
