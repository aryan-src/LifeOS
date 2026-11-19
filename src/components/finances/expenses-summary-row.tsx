'use client';

import React from 'react';
import { Wallet, PiggyBank, Gauge } from 'lucide-react';
import type { ExpensesDerivedSummary } from '@/lib/finances/derived';
import { formatCurrency } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';

interface ExpensesSummaryRowProps {
  summary: ExpensesDerivedSummary;
  currencySymbol: string;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function ExpensesSummaryRow({
  summary,
  currencySymbol,
}: ExpensesSummaryRowProps) {
  const fillClass =
    summary.barTone === 'error'
      ? 'bg-error'
      : summary.barTone === 'tertiary'
      ? 'bg-on-tertiary-container'
      : 'bg-secondary';

  return (
    <div className="space-y-4" data-purpose="expenses-summary-section">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Spent"
          value={`${currencySymbol}${formatCurrency(summary.totalSpent)}`}
          badge={{
            text: `${summary.percentUtilized}% utilized`,
            tone: summary.barTone,
          }}
          icon={<Wallet className="h-4 w-4" />}
          sublabel={
            <span className="font-mono text-label-sm" style={LINING_NUMS_STYLE}>
              Limit: {currencySymbol}
              {formatCurrency(summary.monthlyLimit)}
            </span>
          }
        />

        <StatCard
          label="Left"
          value={`${currencySymbol}${formatCurrency(summary.remainingBalance)}`}
          badge={{
            text: `${summary.daysLeft} ${summary.daysLeft === 1 ? 'day' : 'days'} left`,
            tone: 'secondary',
          }}
          icon={<PiggyBank className="h-4 w-4 text-secondary" />}
          sublabel="Remaining this month"
        />

        <StatCard
          label="Safe pace"
          value={`${currencySymbol}${summary.safeDailyPace.toLocaleString('en-IN')}`}
          unit="/day"
          icon={<Gauge className="h-4 w-4 text-on-tertiary-container" />}
          sublabel={
            <span className="font-mono text-label-sm" style={LINING_NUMS_STYLE}>
              {currencySymbol}
              {Math.round(summary.remainingBalance).toLocaleString('en-IN')} ÷ {summary.daysLeft}d
            </span>
          }
        />
      </div>

      {/* Monthly Limit Progress Card with 75% Advisory Notch */}
      <Card padding="md" surface="lowest" className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
              Monthly limit
            </h2>
            <span
              className="font-mono text-label-sm text-on-surface-variant"
              style={LINING_NUMS_STYLE}
            >
              {currencySymbol}
              {formatCurrency(summary.monthlyLimit)} total
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-4 font-mono text-label-sm text-on-surface-variant"
            style={LINING_NUMS_STYLE}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${fillClass}`} aria-hidden="true" />
              Spent ({currencySymbol}
              {formatCurrency(summary.totalSpent)})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full bg-surface-container-highest"
                aria-hidden="true"
              />
              Left ({currencySymbol}
              {formatCurrency(summary.remainingBalance)})
            </span>
          </div>
        </div>

        <div className="relative pt-5">
          <div
            role="progressbar"
            aria-label="Monthly budget utilized"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(summary.percentUtilized)}
            className="relative h-3 w-full rounded-full bg-surface-container"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${fillClass}`}
              style={{ width: `${Math.min(100, summary.percentUtilized)}%` }}
            />
            <div
              className="absolute -bottom-1.5 -top-1.5 z-10 w-0.5 bg-on-tertiary-container"
              style={{ left: '75%' }}
              title="75% advisory threshold"
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] font-semibold uppercase tracking-wider text-on-tertiary-container">
                75% Limit
              </span>
            </div>
          </div>

          <div
            className="mt-2.5 flex items-center justify-between font-mono text-label-sm text-on-surface-variant"
            style={LINING_NUMS_STYLE}
          >
            <span>{currencySymbol}0</span>
            <span className="font-semibold text-on-surface">
              {summary.percentUtilized}% utilized
            </span>
            <span>
              {currencySymbol}
              {formatCurrency(summary.monthlyLimit)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
