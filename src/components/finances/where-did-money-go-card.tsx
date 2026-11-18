'use client';

import React from 'react';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { resolveSemanticCategoryColor } from '@/lib/finances/derived';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { EmptyState } from '@/components/ui/empty-state';

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

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function WhereDidMoneyGoCard({
  currencySymbol = '₹',
  totalSpent,
  categoryBreakdown,
  subtitle = 'Categorical outflow breakdown',
  className = '',
}: WhereDidMoneyGoCardProps) {
  const activeCategories: CategoryOutflowItem[] = (categoryBreakdown || []).filter(
    (c) => c.value > 0
  );
  const hasData = activeCategories.length > 0;

  const totalCalculated = activeCategories.reduce((sum, c) => sum + c.value, 0);
  const displayTotal =
    typeof totalSpent === 'number' && totalSpent > 0 ? totalSpent : totalCalculated;

  const categoriesWithPercent = activeCategories.map((cat, idx) => {
    const rawPercent =
      cat.percentage ??
      (totalCalculated > 0 ? Math.round((cat.value / totalCalculated) * 100) : 0);
    const safeColor = resolveSemanticCategoryColor(cat.color, idx);

    return {
      ...cat,
      percentage: rawPercent,
      color: safeColor,
    };
  });

  const topListItems = categoriesWithPercent.slice(0, 5);
  const activeCount = activeCategories.length;

  return (
    <Card
      as="article"
      padding="md"
      surface="lowest"
      data-purpose="category-breakdown-card"
      className={`flex h-full flex-col justify-between ${className}`}
    >
      <div className="flex flex-1 flex-col justify-between gap-4">
        <header className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
              Where Did Money Go?
            </h2>
            <p className="mt-0.5 font-mono text-label-sm text-on-surface-variant">
              {subtitle}
            </p>
          </div>
          {hasData && <Pill tone="secondary">100% Accounted</Pill>}
        </header>

        {!hasData ? (
          <EmptyState
            compact={true}
            icon={<Wallet className="h-5 w-5" />}
            title="No categorical outflows yet"
            description="Recorded expenses will automatically group by category here."
          />
        ) : (
          <div className="flex flex-1 flex-col justify-center gap-4">
            {/* Segmented Horizontal Bar */}
            <div data-purpose="progress-segmented-bar">
              <div className="flex h-3 w-full space-x-0.5 overflow-hidden rounded-full bg-surface-container-high p-0.5">
                {categoriesWithPercent.map((cat, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === categoriesWithPercent.length - 1;
                  return (
                    <div
                      key={`seg-${idx}-${cat.name}`}
                      className={`h-full transition-all ${isFirst ? 'rounded-l-full' : ''} ${
                        isLast ? 'rounded-r-full' : ''
                      }`}
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                      title={`${cat.name}: ${cat.percentage}%`}
                    />
                  );
                })}
              </div>

              <div
                className="mt-2 flex items-center justify-between px-0.5 font-mono text-label-sm text-on-surface-variant"
                style={LINING_NUMS_STYLE}
              >
                <span className="font-semibold text-on-surface">
                  {currencySymbol}
                  {formatCurrency(displayTotal)} spent
                </span>
                <span className="text-outline">
                  {activeCount} {activeCount === 1 ? 'Category' : 'Categories'} active
                </span>
              </div>
            </div>

            {/* Category Breakdown List */}
            <ul aria-label="Category Spending Breakdown" className="flex flex-col gap-2">
              {topListItems.map((cat, idx) => (
                <li
                  key={`cat-${idx}-${cat.name}`}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low/70 p-2.5 transition-colors hover:bg-surface-container"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate font-sans text-body-sm font-medium text-on-surface">
                      {cat.name}
                    </span>
                  </div>
                  <div
                    className="flex shrink-0 items-center gap-3 font-mono text-label-sm"
                    style={LINING_NUMS_STYLE}
                  >
                    <span className="rounded bg-surface-container-high px-1.5 py-0.5 text-on-surface-variant">
                      {cat.percentage}%
                    </span>
                    <span className="font-semibold text-on-surface">
                      {currencySymbol}
                      {formatCurrency(cat.value)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

export default WhereDidMoneyGoCard;
