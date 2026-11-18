'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { computeFocusRemaining } from '@/lib/daily-loop/dashboard-derived';

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
  const remaining = computeFocusRemaining(timeFocused.minutes, timeFocused.goalMinutes);

  return (
    <Link
      href="/focus"
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
      aria-label="Open Focus History"
    >
      <Card
        padding="md"
        surface="lowest"
        interactive={true}
        className="flex h-full flex-col justify-between gap-3 min-w-0"
        data-purpose="time-focused-card"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
            Time Focused
          </span>
          <span
            className="font-mono text-label-sm font-semibold text-secondary"
            style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
          >
            {Math.min(100, Math.round(timeFocused.percent))}%
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 min-w-0">
          <span
            className="font-mono text-numeric-timer font-semibold tracking-tight text-on-surface truncate"
            style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
          >
            {timeFocused.formattedTime}
          </span>
          <span
            className="font-mono text-label-md text-outline shrink-0"
            style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
          >
            / {timeFocused.formattedGoal}
          </span>
        </div>

        <div className="space-y-2">
          <ProgressBar
            value={timeFocused.percent}
            tone="secondary"
            size="xs"
            label="Daily focus goal progress"
          />
          <div className="flex items-center justify-between font-mono text-label-sm text-on-surface-variant">
            <span>{remaining.isGoalMet ? 'Daily goal met' : `${remaining.formattedRemaining} left`}</span>
            <span className="text-secondary">History →</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
