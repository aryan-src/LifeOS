import React from 'react';

export interface PageTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3';
  isDashboardGreeting?: boolean;
  children: React.ReactNode;
}

/**
 * PageTitle provides the unified responsive Playfair Display headline style
 * for page headers across LifeOS.
 *
 * Spec:
 * - Font: Playfair Display, semibold (600), no italics
 * - Size: ~44px on desktop (clamp 1.75rem - 2.75rem), ~36px tablet, ~28px mobile
 * - Dashboard Greeting: ~48px on desktop (clamp 1.875rem - 3rem)
 * - Line-height: ~1.1
 * - Letter-spacing: -0.01em
 * - Color: on-surface
 * - Clean wrapping on narrow screens (break-words)
 */
export function PageTitle({
  as: Component = 'h1',
  isDashboardGreeting = false,
  className = '',
  children,
  ...props
}: PageTitleProps) {
  return (
    <Component
      className={`break-words font-serif text-page-title ${
        isDashboardGreeting ? 'text-dashboard-greeting' : ''
      } font-semibold tracking-tight text-on-surface ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

/**
 * PageHeader provides the standard hairline divider and ~32px bottom spacing
 * below page titles.
 */
export function PageHeader({ className = '', children, ...props }: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col justify-between gap-4 border-b border-outline-variant/40 pb-5 mb-8 sm:flex-row sm:items-end ${className}`}
      {...props}
    >
      {children}
    </header>
  );
}
