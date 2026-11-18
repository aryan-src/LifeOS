'use client';

import React, { useState } from 'react';
import type { StreakState } from '@/lib/daily-loop/types';
import type { WeekStripDay } from '@/lib/actions/daily-loop';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { StreakPopover } from './streak-popover';

interface DailyStreakCardProps {
  streakState: StreakState;
  weekStrip: WeekStripDay[];
  onOpenQuickCapture?: (prefix: string) => void;
  onOpenMilestones?: () => void;
}

export function DailyStreakCard({
  streakState,
  weekStrip,
  onOpenQuickCapture,
  onOpenMilestones,
}: DailyStreakCardProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { currentStreak, isTodayQualified, checklist } = streakState;

  const badgeText = isTodayQualified
    ? 'Consistent'
    : `${checklist.completedCount} of ${checklist.totalRequired} today`;
  const badgeTone = isTodayQualified
    ? 'secondary'
    : checklist.completedCount === 1
    ? 'tertiary'
    : 'neutral';

  return (
    <Card
      padding="md"
      surface="lowest"
      className="relative flex flex-col justify-between gap-3 min-w-0"
      data-purpose="daily-streak-card"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
          Daily Streak
        </span>
        <button
          type="button"
          onClick={() => setIsPopoverOpen((prev) => !prev)}
          aria-expanded={isPopoverOpen}
          aria-label="Toggle daily streak details"
          className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
        >
          <Pill tone={badgeTone}>{badgeText}</Pill>
        </button>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsPopoverOpen((prev) => !prev)}
          className="group flex items-baseline gap-1.5 text-left cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
        >
          <span
            className="font-mono text-numeric-timer font-semibold tracking-tight text-on-surface transition-colors group-hover:text-secondary"
            style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
          >
            {currentStreak}
          </span>
          <span className="font-sans text-body-sm text-on-surface-variant">
            {currentStreak === 1 ? 'day' : 'days'}
          </span>
        </button>

        {onOpenMilestones && (
          <button
            type="button"
            onClick={onOpenMilestones}
            className="font-mono text-label-sm text-on-surface-variant hover:text-secondary transition-colors cursor-pointer rounded-md px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
          >
            Milestones
          </button>
        )}
      </div>

      {/* 7-Day M–S Dot Strip */}
      <button
        type="button"
        onClick={() => setIsPopoverOpen((prev) => !prev)}
        title="Click to view streak breakdown"
        aria-label="Weekly streak progress strip"
        className="grid grid-cols-7 gap-1 pt-2 border-t border-outline-variant/30 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
      >
        {weekStrip.map((day) => {
          let dotStyle = 'bg-surface-container-highest';

          if (day.isQualified) {
            dotStyle = 'bg-secondary';
          } else if (day.isFrozen) {
            dotStyle = 'bg-secondary/45 ring-1 ring-secondary';
          } else if (day.isToday) {
            dotStyle = 'bg-on-tertiary-container ring-2 ring-tertiary-fixed/60';
          }

          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <span
                className={`font-mono text-[10px] ${
                  day.isToday
                    ? 'font-semibold text-on-surface'
                    : 'text-outline'
                }`}
              >
                {day.dayLabel}
              </span>
              <span className={`h-2.5 w-2.5 rounded-full transition-all ${dotStyle}`} />
            </div>
          );
        })}
      </button>

      <StreakPopover
        streakState={streakState}
        weekStrip={weekStrip}
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        onOpenQuickCapture={onOpenQuickCapture}
        onOpenMilestones={onOpenMilestones}
      />
    </Card>
  );
}
