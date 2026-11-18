'use client';

import React from 'react';
import type { WeeklySpendDay } from '@/lib/finances/derived';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3 } from 'lucide-react';

interface ExpensesPaceChartProps {
  weeklyDays: WeeklySpendDay[];
  safeDailyPace: number;
  paceStatusText: string;
  currencySymbol: string;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function ExpensesPaceChart({
  weeklyDays,
  safeDailyPace,
  paceStatusText,
  currencySymbol,
}: ExpensesPaceChartProps) {
  const days = weeklyDays.slice(-7);
  const maxDaySpend = Math.max(0, ...days.map((d) => d.spent));
  const hasAnySpend = maxDaySpend > 0;
  const chartScaleMax = Math.max(10, Math.ceil(Math.max(maxDaySpend, safeDailyPace) * 1.25));
  const paceLinePercent = Math.min(92, Math.max(8, (safeDailyPace / chartScaleMax) * 100));

  return (
    <Card
      padding="md"
      surface="lowest"
      className="flex flex-col justify-between gap-5 h-full"
      data-purpose="expenses-pace-chart"
    >
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
            7-Day Spending Pattern
          </h2>
          <p className="mt-0.5 font-sans text-body-sm text-on-surface-variant">
            Daily outflows benchmarked against safe daily pace
          </p>
        </div>

        <Pill tone="secondary" dot={true}>
          {paceStatusText}
        </Pill>
      </div>

      {days.length === 0 ? (
        <EmptyState
          compact={true}
          icon={<BarChart3 className="h-5 w-5" />}
          title="No 7-day spending history yet"
          description="Log expenses to compare daily pace against your monthly budget."
        />
      ) : (
        <div className="relative flex h-52 w-full flex-col justify-end pt-6">
          {/* Dashed Safe Daily Pace Guideline */}
          {safeDailyPace > 0 && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
              style={{ bottom: `calc(${paceLinePercent}% * 0.78 + 26px)` }}
            >
              <div className="w-full border-b border-dashed border-on-tertiary-container/70" />
              <span
                className="absolute -top-4 right-0 bg-surface-container-lowest pl-1.5 font-mono text-[10px] font-semibold text-on-tertiary-container"
                style={LINING_NUMS_STYLE}
              >
                {currencySymbol}
                {safeDailyPace} safe pace
              </span>
            </div>
          )}

          {/* 7 Bars */}
          <div className="z-20 grid h-full grid-cols-7 items-end gap-2 sm:gap-4 px-1">
            {days.map((day, index) => {
              const barHeightPct =
                hasAnySpend && day.spent > 0
                  ? Math.max(6, Math.round((day.spent / chartScaleMax) * 100))
                  : 2;
              const isOverPace = safeDailyPace > 0 && day.spent > safeDailyPace;

              const barColorClass = day.isToday
                ? isOverPace
                  ? 'bg-error'
                  : 'bg-secondary'
                : isOverPace
                ? 'bg-on-tertiary-container/80'
                : day.spent > 0
                ? 'bg-surface-container-highest hover:bg-outline/50'
                : 'bg-surface-container';

              return (
                <div
                  key={`${day.date ?? day.dayLabel}-${index}`}
                  className="group flex h-full flex-col items-center justify-end gap-1.5"
                >
                  <span
                    className={`font-mono text-[10px] transition-opacity ${
                      day.isToday
                        ? 'font-semibold text-secondary'
                        : 'text-on-surface-variant opacity-75 group-hover:opacity-100'
                    }`}
                    style={LINING_NUMS_STYLE}
                  >
                    {day.spent > 0 ? `${currencySymbol}${Math.round(day.spent)}` : '—'}
                  </span>
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className={`w-full max-w-[38px] rounded-t-md transition-all duration-300 ${barColorClass}`}
                      style={{ height: `${barHeightPct}%` }}
                      title={`${day.dayLabel}: ${currencySymbol}${Math.round(day.spent)}`}
                    />
                  </div>
                  <span
                    className={`font-mono text-[11px] ${
                      day.isToday
                        ? 'font-semibold text-secondary'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {day.isToday ? 'Today' : day.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
