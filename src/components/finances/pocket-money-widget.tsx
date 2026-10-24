'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';
import type { PocketMoneyTelemetry } from '@/types/dashboard';
import type { TransactionWithRelations } from '@/lib/actions/finances';

interface PocketMoneyWidgetProps {
  telemetry: PocketMoneyTelemetry;
  latestExpense?: TransactionWithRelations | null;
  monthLabel?: string;
  className?: string;
}

function formatDayLabel(label: string): string {
  if (!label) return '';
  if (label.length >= 3) return label.slice(0, 3);
  const map: Record<string, string> = {
    M: 'Mon',
    T: 'Tue',
    W: 'Wed',
    R: 'Thu',
    F: 'Fri',
    S: 'Sat',
    U: 'Sun',
  };
  return map[label.toUpperCase()] || label;
}

export function PocketMoneyWidget({
  telemetry,
  latestExpense,
  monthLabel = 'Oct 2026',
  className = '',
}: PocketMoneyWidgetProps) {
  const {
    monthlyAllowance = 5000,
    remainingAllowance = 823.5,
    allowanceUsagePercent = 84,
    todaySpent = 0,
    daysLeftInMonth = 8,
    currencySymbol = '₹',
    weeklyDays = [],
  } = telemetry;

  const remainingPercent = Math.max(0, Math.min(100, Math.round(100 - allowanceUsagePercent)));

  const defaultWeeklyDays = [
    { dayLabel: 'Sun', spent: 60, isToday: false },
    { dayLabel: 'Mon', spent: 120, isToday: false },
    { dayLabel: 'Tue', spent: 80, isToday: false },
    { dayLabel: 'Wed', spent: 210, isToday: false },
    { dayLabel: 'Thu', spent: 40, isToday: false },
    { dayLabel: 'Fri', spent: 70, isToday: false },
    { dayLabel: 'Sat', spent: 30, isToday: true },
  ];

  const days = weeklyDays.length >= 7 ? weeklyDays.slice(-7) : defaultWeeklyDays;
  const maxSpent = Math.max(...days.map((d) => d.spent || 0), 100);
  const avgSpent = Math.round(days.reduce((acc, d) => acc + (d.spent || 0), 0) / (days.length || 1));

  const allowanceLimitFormatted = Number.isInteger(monthlyAllowance)
    ? monthlyAllowance
    : formatCurrency(monthlyAllowance);

  return (
    <article
      className={`h-full flex flex-col justify-between rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100/80 dark:border-zinc-800 p-6 sm:p-7 shadow-sm transition-colors ${className}`}
      data-purpose="widget-container"
    >
      {/* BEGIN: HeaderSection */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/80 pb-5">
        {/* Section: Left 2/3 */}
        <div className="space-y-1.5 w-2/3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Pocket Money
          </h1>
        </div>

        {/* Section: Right 1/3 */}
        <div className="w-1/3 flex flex-col items-end justify-start space-y-1">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono tracking-tight shadow-sm hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors active:scale-95 duration-200"
          >
            <span>{monthLabel}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight pt-0.5">
            {remainingPercent}% left
          </span>
        </div>
      </div>
      {/* END: HeaderSection */}

      {/* BEGIN: ActivityChartSection */}
      <section
        className="space-y-5 rounded-2xl bg-slate-50/70 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/80 p-5 my-2"
        data-purpose="7-day-chart"
      >
        {/* Embedded Metrics 1 & 2 */}
        <div
          className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200/60 dark:border-zinc-800/60"
          data-purpose="inline-metrics"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 block tracking-wider uppercase">
              Spent Today
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 tabular-nums leading-tight">
              {`${currencySymbol}${formatCurrency(todaySpent)}`}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium pt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-600" />
              <span>{todaySpent === 0 ? 'No outflows today' : 'Recorded today'}</span>
            </div>
          </div>

          <div className="space-y-1 pl-4 border-l border-slate-200/60 dark:border-zinc-800/60">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 block tracking-wider uppercase">
              Remaining Balance
            </span>
            <div className="flex items-baseline gap-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">
              {`${currencySymbol}${formatCurrency(remainingAllowance)}`}
              <span className="text-xs font-normal text-slate-400 dark:text-zinc-500 font-sans">
                {`/${allowanceLimitFormatted}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium pt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-600" />
              <span>{`${daysLeftInMonth}d left`}</span>
            </div>
          </div>
        </div>

        {/* 7-Day Outflow Activity Chart Header & Bars */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            <span>7-Day Outflow Activity</span>
            <span className="font-normal normal-case text-slate-500 dark:text-zinc-400">
              {`avg ${currencySymbol}${avgSpent}`}
            </span>
          </div>
          <div className="pt-1">
            <div className="grid grid-cols-7 gap-2.5 items-end h-28" data-purpose="bars-container">
              {days.map((d, idx) => {
                const heightPercent =
                  maxSpent > 0 ? Math.max(10, Math.min(100, Math.round((d.spent / maxSpent) * 100))) : 10;
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div
                      className={`w-full rounded-t transition-colors duration-200 ${
                        d.isToday
                          ? 'bg-emerald-500'
                          : 'bg-slate-200 dark:bg-zinc-700 group-hover:bg-slate-300 dark:group-hover:bg-zinc-600'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                      title={`${formatDayLabel(d.dayLabel)}: ${currencySymbol}${d.spent}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 gap-2.5 mt-2.5 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
              {days.map((d, idx) => (
                <span
                  key={idx}
                  className={
                    d.isToday
                      ? 'font-semibold text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 shadow-sm rounded py-0.5'
                      : ''
                  }
                >
                  {formatDayLabel(d.dayLabel)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* END: ActivityChartSection */}

      {/* BEGIN: FooterActionSection */}
      <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-zinc-800/80" data-purpose="footer-action">
        <div className="flex items-center space-x-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-600 shrink-0" />
          <span className="text-slate-600 dark:text-zinc-400 truncate text-[11px]">
            {latestExpense ? latestExpense.description : 'No recent expenses'}
          </span>
          {latestExpense && (
            <span className="font-mono text-slate-500 dark:text-zinc-400 font-medium text-[11px]">
              -{currencySymbol}
              {formatCurrency(Math.abs(latestExpense.amount))}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 pl-2 shrink-0">
          <Link
            href="/finances"
            className="text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors font-medium text-[11px]"
          >
            Ledger →
          </Link>
          <Link
            href="/finances"
            className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-medium px-2 py-0.5 rounded text-[10px] transition-colors border border-slate-200/60 dark:border-zinc-700/60"
          >
            + Log expense
          </Link>
        </div>
      </div>
      {/* END: FooterActionSection */}
    </article>
  );
}
