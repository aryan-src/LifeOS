'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils/format';

export interface CategoryOutflowItem {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
  count?: number;
}

export interface WhereDidMoneyGoCardProps {
  currencySymbol?: string;
  totalSpent?: number;
  categoryBreakdown?: CategoryOutflowItem[];
  subtitle?: string;
  className?: string;
}

const DEFAULT_SEGMENTS = [
  { name: 'Grocery', percentage: 56, color: '#059669', value: 2108.0 },
  { name: 'Commute', percentage: 15, color: '#3b82f6', value: 577.0 },
  { name: 'Juice', percentage: 12, color: '#f59e0b', value: 450.0 },
  { name: 'Junk Food', percentage: 9, color: '#f05a28', value: 332.0 },
  { name: 'Other', percentage: 5, color: '#34d399', value: 189.0 },
  { name: 'Misc', percentage: 3, color: '#a855f7', value: 132.0 },
];

export function WhereDidMoneyGoCard({
  currencySymbol = '₹',
  totalSpent,
  categoryBreakdown,
  subtitle = 'October categorical outflow',
  className = '',
}: WhereDidMoneyGoCardProps) {
  const hasCustomData =
    Boolean(categoryBreakdown && categoryBreakdown.length > 0 && categoryBreakdown.some((c) => c.value > 0));

  const displayTotal =
    typeof totalSpent === 'number' && (totalSpent > 0 || hasCustomData)
      ? totalSpent
      : 3788.0;

  const activeCategories: CategoryOutflowItem[] = hasCustomData && categoryBreakdown
    ? categoryBreakdown.filter((c) => c.value > 0)
    : DEFAULT_SEGMENTS;

  const totalCalculated = activeCategories.reduce((sum, c) => sum + c.value, 0) || displayTotal;

  // Normalize percentages
  const categoriesWithPercent = activeCategories.map((cat, idx) => {
    const rawPercent =
      cat.percentage ??
      (totalCalculated > 0 ? Math.round((cat.value / totalCalculated) * 100) : 0);
    const color =
      cat.color ||
      DEFAULT_SEGMENTS[idx % DEFAULT_SEGMENTS.length]?.color ||
      '#059669';
    return {
      ...cat,
      percentage: rawPercent,
      color,
    };
  });

  const topListItems = categoriesWithPercent.slice(0, 4);
  const activeCount = hasCustomData ? activeCategories.length : 7;

  return (
    <article
      data-purpose="category-breakdown-card"
      className={`h-full flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-xs dark:bg-zinc-900/60 dark:border-zinc-800/80 transition-all duration-200 ${className}`}
    >
      {/* Inner Main Content Area: flex-1 flex flex-col justify-between */}
      <div className="flex-1 flex flex-col justify-between">
        {/* Top Header */}
        <header className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-zinc-100 font-sans tracking-tight">
              Where Did Money Go?
            </h2>
            <p className="text-xs font-mono text-stone-400 dark:text-stone-400 mt-0.5">
              {subtitle}
            </p>
          </div>
          {/* Header Telemetry Badge */}
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono text-stone-400 dark:text-stone-400 bg-stone-100/70 dark:bg-zinc-800/70 border border-stone-200/60 dark:border-zinc-700/60 font-medium">
            100% Accounted
          </span>
        </header>

        {/* Middle Section: Outflow Bar & Category List */}
        <div className="flex-1 flex flex-col justify-center my-2">
          {/* Category Outflow Stacked Horizontal Bar */}
          <div className="mb-4" data-purpose="progress-segmented-bar">
            <div className="w-full h-3 bg-stone-100 dark:bg-zinc-800 rounded-full flex overflow-hidden p-0.5 space-x-0.5">
              {categoriesWithPercent.map((cat, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === categoriesWithPercent.length - 1;
                return (
                  <div
                    key={`seg-${idx}-${cat.name}`}
                    className={`h-full transition-all ${isFirst ? 'rounded-l-full' : ''} ${isLast ? 'rounded-r-full' : ''}`}
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                    title={`${cat.name}: ${cat.percentage}%`}
                  />
                );
              })}
            </div>
            {/* Outflow Metadata Line */}
            <div className="flex items-center justify-between text-xs font-mono text-stone-600 dark:text-stone-400 mt-2 px-0.5">
              <span className="font-semibold text-stone-900 dark:text-zinc-200 tabular-nums font-mono">
                {currencySymbol}
                {formatCurrency(displayTotal)} spent
              </span>
              <span className="text-stone-400 dark:text-zinc-500 font-mono">
                {activeCount} {activeCount === 1 ? 'Category' : 'Categories'} active
              </span>
            </div>
          </div>

          {/* Category Breakdown List */}
          <ul
            aria-label="Category Spending Breakdown"
            className="flex flex-col gap-2.5 my-1"
          >
            {topListItems.map((cat, idx) => (
              <li
                key={`cat-${idx}-${cat.name}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 transition-colors hover:bg-amber-100/40 dark:hover:bg-amber-950/40"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span
                    aria-hidden="true"
                    className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-stone-800 dark:text-zinc-200 truncate font-sans">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4 font-mono text-sm shrink-0">
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 font-medium">
                    {cat.percentage}%
                  </span>
                  <span className="font-semibold text-stone-900 dark:text-zinc-100 tabular-nums font-mono">
                    {currencySymbol}
                    {formatCurrency(cat.value)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Anchored Bottom Footer */}
        <footer
          className="mt-auto pt-4 border-t border-stone-100 dark:border-zinc-800/50 flex items-center justify-between text-xs font-mono"
          data-purpose="right-card-footer"
        >
          <div className="text-stone-500 dark:text-zinc-400">
            Zero emergency debits logged
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Discipline Index: 98/100</span>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default WhereDidMoneyGoCard;
