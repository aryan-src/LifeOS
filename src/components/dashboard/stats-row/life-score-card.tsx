'use client';

import React from 'react';
import type { LifeScoreBreakdown } from '@/lib/daily-loop/types';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { ProgressBar } from '@/components/ui/progress-bar';

interface LifeScoreCardProps {
  lifeScore: LifeScoreBreakdown;
}

export function LifeScoreCard({ lifeScore }: LifeScoreCardProps) {
  const delta = lifeScore.deltaVsYesterday;
  const isPositive = delta > 0;
  const hasDelta = typeof delta === 'number' && delta !== 0;

  const deltaText = `${isPositive ? '+' : ''}${delta} vs yesterday`;
  const statusLabel =
    lifeScore.total >= 70
      ? 'Strong rhythm'
      : lifeScore.total >= 40
      ? 'Building momentum'
      : 'Starting today';

  return (
    <Card
      padding="md"
      surface="lowest"
      className="flex flex-col justify-between gap-3 min-w-0"
      data-purpose="life-score-card"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
          Life Score
        </span>
        {hasDelta && (
          <Pill tone={isPositive ? 'secondary' : 'tertiary'}>
            {deltaText}
          </Pill>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className="font-mono text-numeric-timer font-semibold tracking-tight text-on-surface"
          style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
        >
          {lifeScore.total}
        </span>
        <span
          className="font-mono text-label-md text-outline"
          style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
        >
          / 100
        </span>
      </div>

      <div className="space-y-2">
        <ProgressBar
          value={lifeScore.total}
          tone="secondary"
          size="xs"
          label="Life Score"
        />
        <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
          <span className="font-mono text-label-sm text-outline">Daily index</span>
          <span className="font-mono text-label-sm text-secondary">{statusLabel}</span>
        </div>
      </div>
    </Card>
  );
}
