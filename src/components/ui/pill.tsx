import React from 'react';
import { cn } from '@/lib/utils';

export type PillTone = 'neutral' | 'secondary' | 'tertiary' | 'primary' | 'error';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  dot?: boolean;
  uppercase?: boolean;
}

const TONE_CLASSES: Record<PillTone, string> = {
  neutral:
    'bg-surface-container-high text-on-surface-variant border-outline-variant/40',
  secondary:
    'bg-secondary/12 text-secondary border-secondary/25',
  tertiary:
    'bg-tertiary-container/60 text-on-tertiary-container border-tertiary/30',
  primary:
    'bg-primary text-on-primary border-primary',
  error:
    'bg-error-container text-on-error-container border-error/30',
};

const DOT_CLASSES: Record<PillTone, string> = {
  neutral: 'bg-outline',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  primary: 'bg-on-primary',
  error: 'bg-error',
};

/**
 * Shared Stitch Pill primitive for status badges, tags, and metadata labels.
 * Uses JetBrains Mono label scale with tabular numerals.
 */
export function Pill({
  tone = 'neutral',
  dot = false,
  uppercase = false,
  className,
  children,
  ...rest
}: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-label-sm tracking-wide whitespace-nowrap',
        uppercase && 'uppercase',
        TONE_CLASSES[tone],
        className
      )}
      style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
      {...rest}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_CLASSES[tone])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
