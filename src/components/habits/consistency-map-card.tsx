'use client';

import React, { useMemo } from 'react';
import type { HabitWithLog } from '@/lib/actions/habits';

interface ConsistencyMapCardProps {
  habits: HabitWithLog[];
  todayStr: string;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

/**
 * 35-day (5 weeks x 7 days) calendar consistency heatmap.
 * Uses real habit completion history across all protocols with the semantic `secondary` token.
 */
export function ConsistencyMapCard({ habits, todayStr }: ConsistencyMapCardProps) {
  // Generate 35 trailing days aligned to Mon-Sun
  const days = useMemo(() => {
    const result: Array<{
      dateStr: string;
      label: string;
      completedCount: number;
      totalCount: number;
      ratio: number;
      isToday: boolean;
      isFuture: boolean;
    }> = [];

    const today = new Date(todayStr + 'T00:00:00Z');
    // Find current week Monday
    const dayOfWeek = (today.getUTCDay() + 6) % 7; // 0=Mon, 6=Sun
    // Start from 4 weeks prior to current week Monday (total 5 weeks = 35 days)
    const startDate = new Date(today);
    startDate.setUTCDate(today.getUTCDate() - dayOfWeek - 28);

    for (let i = 0; i < 35; i++) {
      const d = new Date(startDate);
      d.setUTCDate(startDate.getUTCDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const isToday = iso === todayStr;
      const isFuture = iso > todayStr;

      let completedCount = 0;
      const totalCount = habits.length;

      if (!isFuture && totalCount > 0) {
        for (const h of habits) {
          if (isToday ? h.is_completed_today : !!h.weekly_history?.[iso]) {
            completedCount++;
          }
        }
      }

      const ratio = totalCount > 0 ? completedCount / totalCount : 0;
      const monthShort = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
      const dayNum = d.getUTCDate();

      result.push({
        dateStr: iso,
        label: `${monthShort} ${dayNum}`,
        completedCount,
        totalCount,
        ratio,
        isToday,
        isFuture,
      });
    }

    return result;
  }, [habits, todayStr]);

  const activeMonthName = useMemo(() => {
    const today = new Date(todayStr + 'T00:00:00Z');
    return today.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }, [todayStr]);

  return (
    <div
      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-xs space-y-4"
      data-purpose="consistency-map-card"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
          Activity
        </h2>
        <span
          className="rounded-md border border-outline-variant/40 bg-surface-container px-2 py-0.5 font-mono text-label-sm text-on-surface-variant"
          style={LINING_NUMS_STYLE}
        >
          35 days
        </span>
      </div>

      {/* M-S Day Header */}
      <div className="grid grid-cols-7 gap-1.5 text-center pt-1" aria-hidden="true">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
          <span
            key={`${day}-${idx}`}
            className="font-mono text-[11px] font-medium text-on-surface-variant"
          >
            {day}
          </span>
        ))}
      </div>

      {/* 35-Day Grid (5 rows of 7) */}
      <div
        className="grid grid-cols-7 gap-1.5"
        role="grid"
        aria-label="35-day habit completion heatmap"
      >
        {days.map((d) => {
          let bgClass = 'bg-surface-container-high/60';
          if (d.isFuture) {
            bgClass = 'bg-surface-container-low/40 opacity-40';
          } else if (d.totalCount === 0 || d.completedCount === 0) {
            bgClass = 'bg-surface-container-high/60';
          } else if (d.ratio <= 0.4) {
            bgClass = 'bg-secondary/30';
          } else if (d.ratio <= 0.8) {
            bgClass = 'bg-secondary/70';
          } else {
            bgClass = 'bg-secondary text-on-secondary';
          }

          const ringClass = d.isToday ? 'ring-2 ring-secondary ring-offset-1 ring-offset-surface' : '';

          return (
            <div
              key={d.dateStr}
              role="gridcell"
              tabIndex={0}
              className={`aspect-square rounded-[4px] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 cursor-default ${bgClass} ${ringClass}`}
              title={`${d.label}: ${d.completedCount}/${d.totalCount} completed`}
              aria-label={`${d.label}: ${d.completedCount} of ${d.totalCount} protocols completed`}
            />
          );
        })}
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30 text-body-sm text-on-surface-variant">
        <span className="font-mono text-label-sm text-outline">Less</span>
        <div className="flex items-center gap-1" aria-hidden="true">
          <div className="h-2.5 w-2.5 rounded-[2px] bg-surface-container-high/60" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-secondary/30" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-secondary/70" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-secondary" />
        </div>
        <span className="font-mono text-label-sm text-outline">More</span>
      </div>
    </div>
  );
}
