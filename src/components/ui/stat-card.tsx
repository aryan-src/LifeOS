import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';
import { Pill, type PillTone } from './pill';
import { ProgressBar, type ProgressBarTone } from './progress-bar';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sublabel?: React.ReactNode;
  badge?: {
    text: string;
    tone?: PillTone;
    dot?: boolean;
  };
  progress?: {
    value: number;
    tone?: ProgressBarTone;
    label?: string;
  };
  icon?: React.ReactNode;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  footer?: React.ReactNode;
}

/**
 * Shared Stitch StatCard primitive for KPI summary tiles across screens.
 * Renders numbers with JetBrains Mono / Geist lining tabular numerals.
 */
export function StatCard({
  label,
  value,
  unit,
  sublabel,
  badge,
  progress,
  icon,
  interactive = false,
  onClick,
  className,
  footer,
}: StatCardProps) {
  const isClickable = Boolean(onClick) || interactive;

  const content = (
    <Card
      padding="md"
      surface="lowest"
      interactive={isClickable}
      className={cn('flex flex-col justify-between gap-3 h-full text-left', className)}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
          {label}
        </span>
        {badge ? (
          <Pill tone={badge.tone ?? 'secondary'} dot={badge.dot}>
            {badge.text}
          </Pill>
        ) : icon ? (
          <span className="text-on-surface-variant" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>

      <div className="flex items-baseline gap-1.5 min-w-0">
        <span
          className="font-mono text-stat-lg font-medium tracking-tight text-on-surface truncate"
          style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-label-md text-on-surface-variant shrink-0">
            {unit}
          </span>
        )}
      </div>

      {progress && (
        <ProgressBar
          value={progress.value}
          tone={progress.tone ?? 'secondary'}
          label={progress.label ?? `${label} progress`}
          size="xs"
        />
      )}

      {sublabel && (
        <div className="text-body-sm text-on-surface-variant leading-snug">
          {sublabel}
        </div>
      )}

      {footer}
    </Card>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
      >
        {content}
      </button>
    );
  }

  return content;
}
