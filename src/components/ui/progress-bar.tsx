import React from 'react';
import { cn } from '@/lib/utils';

export type ProgressBarTone = 'secondary' | 'tertiary' | 'primary' | 'error';
export type ProgressBarSize = 'xs' | 'sm' | 'md';

export interface ProgressBarProps {
  /** Progress percentage (0 to 100). Values outside range are safely clamped. */
  value: number;
  label?: string;
  tone?: ProgressBarTone;
  size?: ProgressBarSize;
  className?: string;
}

const FILL_CLASSES: Record<ProgressBarTone, string> = {
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  primary: 'bg-primary',
  error: 'bg-error',
};

const SIZE_CLASSES: Record<ProgressBarSize, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
};

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Accessible Stitch ProgressBar primitive using semantic tokens.
 */
export function ProgressBar({
  value,
  label = 'Progress',
  tone = 'secondary',
  size = 'sm',
  className,
}: ProgressBarProps) {
  const clamped = clampPercent(value);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn(
        'w-full overflow-hidden rounded-full bg-surface-container-high',
        SIZE_CLASSES[size],
        className
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          FILL_CLASSES[tone]
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
