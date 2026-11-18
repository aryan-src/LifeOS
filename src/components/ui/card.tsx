import React from 'react';
import { cn } from '@/lib/utils';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardSurface = 'lowest' | 'low' | 'default';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  surface?: CardSurface;
  interactive?: boolean;
  as?: 'div' | 'article' | 'section';
}

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const SURFACE_CLASSES: Record<CardSurface, string> = {
  lowest: 'bg-surface-container-lowest',
  low: 'bg-surface-container-low',
  default: 'bg-surface-container',
};

/**
 * Shared Stitch Card surface primitive.
 * Automatically adapts between Light and Dark themes via CSS-variable tokens.
 */
export function Card({
  padding = 'md',
  surface = 'lowest',
  interactive = false,
  as: Component = 'div',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-2xl border border-outline-variant/40 text-on-surface shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition-colors',
        SURFACE_CLASSES[surface],
        PADDING_CLASSES[padding],
        interactive && 'hover:border-outline/60 cursor-pointer',
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
