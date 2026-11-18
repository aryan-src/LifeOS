import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * Shared calm EmptyState primitive for zero-data views across LifeOS.
 * Never shows fabricated numbers or placeholder content.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container-low/50',
        compact ? 'px-5 py-7 gap-2' : 'px-6 py-12 gap-3',
        className
      )}
    >
      {icon && (
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-sm">
        <p className="font-sans text-body-md font-medium text-on-surface">
          {title}
        </p>
        {description && (
          <p className="text-body-sm text-on-surface-variant leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
