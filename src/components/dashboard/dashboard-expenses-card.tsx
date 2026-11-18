'use client';

import React from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import type { FinancialAnalytics } from '@/lib/actions/finances';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';

interface DashboardExpensesCardProps {
  financialAnalytics: FinancialAnalytics | null;
  currentMonth: string;
  onOpenQuickCapture: (prefix: string) => void;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function DashboardExpensesCard({
  financialAnalytics,
  currentMonth,
  onOpenQuickCapture,
}: DashboardExpensesCardProps) {
  const categoryMap = (financialAnalytics?.categoryBreakdown || []).reduce<Record<string, number>>(
    (acc, cat) => {
      acc[cat.name.toLowerCase()] = cat.value;
      return acc;
    },
    {}
  );

  const booksSpend = categoryMap['books'] || categoryMap['education'] || 0;
  const cafeSpend = categoryMap['cafe'] || categoryMap['food'] || categoryMap['dining'] || 0;
  const transitSpend = categoryMap['transit'] || categoryMap['travel'] || categoryMap['transport'] || 0;

  // Semantic Stitch token colors — zero hardcoded hex codes
  const categories = [
    {
      key: 'books',
      name: 'Books',
      strokeColor: 'rgb(var(--color-secondary))',
      dotClass: 'bg-secondary',
      spend: booksSpend,
    },
    {
      key: 'cafe',
      name: 'Cafe',
      strokeColor: 'rgb(var(--color-on-tertiary-container))',
      dotClass: 'bg-on-tertiary-container',
      spend: cafeSpend,
    },
    {
      key: 'transit',
      name: 'Transit',
      strokeColor: 'rgb(var(--color-outline))',
      dotClass: 'bg-outline',
      spend: transitSpend,
    },
  ];

  const categoryTotal = booksSpend + cafeSpend + transitSpend;
  const todaySpent = financialAnalytics?.todaySpent ?? 0;
  const totalExpenses =
    todaySpent > 0 ? todaySpent : (financialAnalytics?.monthlySpent ?? categoryTotal);

  const donutCircumference = 2 * Math.PI * 78;
  const activeCategories = categories.filter((c) => c.spend > 0);
  let cumulativeDonutLength = 0;
  const donutSlices = activeCategories.map((cat) => {
    const fraction = categoryTotal > 0 ? cat.spend / categoryTotal : 0;
    const sliceLen = fraction * donutCircumference;
    const gap = activeCategories.length > 1 ? 3 : 0;
    const dash = Math.max(0, sliceLen - gap);
    const offset = -cumulativeDonutLength;
    cumulativeDonutLength += sliceLen;
    return {
      key: cat.key,
      strokeColor: cat.strokeColor,
      dash,
      circumference: donutCircumference,
      offset,
    };
  });

  return (
    <Card
      as="article"
      padding="md"
      surface="lowest"
      className="flex flex-col justify-between gap-4 min-w-0"
      data-purpose="pocket-money-card"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
            Expenses
          </h2>
          <Pill tone="neutral">{currentMonth}</Pill>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="font-mono text-numeric-stat font-semibold text-on-surface"
            style={LINING_NUMS_STYLE}
          >
            ₹{Math.round(totalExpenses).toLocaleString('en-IN')}
          </span>
          <button
            type="button"
            onClick={() => onOpenQuickCapture('Expense: ')}
            aria-label="Log quick expense"
            title="Log expense"
            className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
        {/* Slim Semantic Donut */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            className="h-32 w-32 -rotate-90"
            viewBox="0 0 200 200"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="100"
              cy="100"
              r="78"
              fill="none"
              stroke="rgb(var(--color-surface-container-high))"
              strokeWidth="16"
            />
            {categoryTotal > 0 &&
              donutSlices.map((slice) => (
                <circle
                  key={slice.key}
                  cx="100"
                  cy="100"
                  r="78"
                  fill="none"
                  stroke={slice.strokeColor}
                  strokeWidth="16"
                  strokeDasharray={`${slice.dash} ${slice.circumference - slice.dash}`}
                  strokeDashoffset={slice.offset}
                  strokeLinecap={activeCategories.length === 1 ? 'butt' : 'round'}
                  className="transition-all duration-500 ease-out"
                />
              ))}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-outline">
              {currentMonth}
            </span>
            <span
              className="mt-0.5 font-mono text-numeric-stat font-semibold text-on-surface leading-tight"
              style={LINING_NUMS_STYLE}
            >
              ₹{Math.round(totalExpenses).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="flex flex-1 flex-col justify-center gap-2 min-w-0">
          {categories.map((cat) => {
            const pct = categoryTotal > 0 ? Math.round((cat.spend / categoryTotal) * 100) : 0;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onOpenQuickCapture(`Expense ${cat.name}: `)}
                className="flex min-w-0 items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low/70 px-3 py-2 text-left transition-colors hover:bg-surface-container cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${cat.dotClass}`} aria-hidden="true" />
                  <span className="truncate font-sans text-body-sm font-medium text-on-surface">
                    {cat.name}
                  </span>
                </div>
                <span
                  className="ml-2 shrink-0 font-mono text-label-sm text-on-surface-variant"
                  style={LINING_NUMS_STYLE}
                >
                  {pct}% · ₹{Math.round(cat.spend).toLocaleString('en-IN')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
        <span className="font-mono text-label-sm text-outline">
          {categoryTotal === 0 ? 'No outflows recorded this cycle' : 'Category distribution'}
        </span>
        <Link
          href="/finances"
          className="font-mono text-label-sm font-medium text-secondary hover:underline"
        >
          Open Ledger →
        </Link>
      </div>
    </Card>
  );
}
