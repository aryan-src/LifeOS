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

export function PocketMoneyWidget({
  telemetry,
  latestExpense,
  monthLabel = 'Oct 2026',
  className = '',
}: PocketMoneyWidgetProps) {
  const {
    monthlyAllowance = 5000,
    remainingAllowance = 987,
    allowanceUsagePercent = 80,
    monthlySpent = 4013,
    todaySpent = 0,
    safeDailyBudget = 98.7,
    daysLeftInMonth = 10,
    currencySymbol = '₹',
    weeklyDays = [],
  } = telemetry;

  const remainingPercent = Math.max(0, Math.min(100, Math.round(100 - allowanceUsagePercent)));

  const defaultWeeklyDays = [
    { dayLabel: 'M', spent: 60, isToday: false },
    { dayLabel: 'T', spent: 120, isToday: false },
    { dayLabel: 'W', spent: 80, isToday: false },
    { dayLabel: 'T', spent: 210, isToday: true },
    { dayLabel: 'F', spent: 40, isToday: false },
    { dayLabel: 'S', spent: 70, isToday: false },
    { dayLabel: 'S', spent: 30, isToday: false },
  ];

  const days = weeklyDays.length >= 7 ? weeklyDays.slice(-7) : defaultWeeklyDays;
  const maxSpent = Math.max(...days.map((d) => d.spent || 0), 100);
  const avgSpent = Math.round(days.reduce((acc, d) => acc + (d.spent || 0), 0) / (days.length || 1));

  return (
    <article
      className={`bg-white dark:bg-zinc-900/70 rounded-2xl border border-stone-200/70 dark:border-zinc-800/60 p-5 flex flex-col justify-between shadow-sm transition-colors ${className}`}
      data-purpose="card-pocket-money"
    >
      {/* Card Header */}
      <div className="shrink-0 flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800/60">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-zinc-500 font-semibold block leading-none mb-1">
            FINANCIAL TELEMETRY
          </span>
          <h2 className="text-sm font-semibold text-stone-900 dark:text-zinc-100 tracking-tight leading-none">
            Pocket Money
          </h2>
        </div>
        <span className="text-[10px] font-mono bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border border-stone-200/70 dark:border-zinc-700/60 px-2.5 py-0.5 rounded-full font-medium">
          {monthLabel}
        </span>
      </div>

      {/* Card Content */}
      <div className="py-3.5 flex flex-col gap-3.5 flex-1 justify-between">
        {/* Balance & Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-stone-950 dark:text-zinc-50 leading-none">
                {currencySymbol}
                {formatCurrency(remainingAllowance)}
              </span>
              <span className="text-[11px] text-stone-400 dark:text-zinc-500 font-sans">
                remaining of {currencySymbol}
                {formatCurrency(monthlyAllowance)}
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full font-semibold">
              {remainingPercent}% left
            </span>
          </div>

          <div className="w-full bg-stone-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, Math.min(100, allowanceUsagePercent))}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 dark:text-zinc-500">
            <span>
              {currencySymbol}
              {formatCurrency(monthlySpent)} spent
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {remainingPercent}% remaining
            </span>
          </div>
        </div>

        {/* Metric Tiles */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-stone-50/80 dark:bg-zinc-950/60 rounded-xl p-2.5 border border-stone-200/60 dark:border-zinc-800/60 flex flex-col justify-between">
            <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-sans leading-none block">
              Spent Today
            </span>
            <span className="text-sm font-mono font-bold text-stone-800 dark:text-zinc-200 leading-normal block pt-1">
              {currencySymbol}
              {formatCurrency(todaySpent)}
            </span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium block leading-none pt-0.5">
              ● {todaySpent === 0 ? 'No outflows' : 'Recorded'}
            </span>
          </div>

          <div className="bg-stone-50/80 dark:bg-zinc-950/60 rounded-xl p-2.5 border border-stone-200/60 dark:border-zinc-800/60 flex flex-col justify-between">
            <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-sans leading-none block">
              Safe Daily Limit
            </span>
            <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 leading-normal block pt-1">
              {currencySymbol}
              {formatCurrency(safeDailyBudget)}
              <span className="text-[9px] text-stone-400 dark:text-zinc-500 font-normal">/d</span>
            </span>
            <span className="text-[9px] text-stone-500 dark:text-zinc-400 block leading-none pt-0.5">
              On pace ({daysLeftInMonth}d left)
            </span>
          </div>
        </div>

        {/* 7-Day Outflow Activity Bar Chart */}
        <div className="space-y-1.5 pt-0.5 shrink-0">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-stone-400 dark:text-zinc-500 uppercase tracking-wider text-[9px] font-semibold">
              7-Day Outflow Activity
            </span>
            <span className="text-stone-500 dark:text-zinc-400 text-[10px]">
              avg {currencySymbol}
              {avgSpent}
            </span>
          </div>

          <div className="pt-1">
            <div className="grid grid-cols-7 gap-1.5 h-12 items-end px-1">
              {days.map((d, idx) => {
                const heightPercent = Math.max(15, Math.min(100, Math.round((d.spent / maxSpent) * 100)));
                return (
                  <div key={idx} className="flex flex-col items-center justify-end h-full group relative">
                    <div
                      className={`w-full rounded-xs transition-all ${
                        d.isToday
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : d.spent > 0
                          ? 'bg-stone-200 dark:bg-zinc-700 group-hover:bg-stone-300'
                          : 'bg-stone-100 dark:bg-zinc-800'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-[9px] font-mono text-stone-400 dark:text-zinc-500 px-1 pt-1.5 border-t border-stone-100 dark:border-zinc-800/60 text-center">
              {days.map((d, idx) => (
                <span
                  key={idx}
                  className={`w-full ${
                    d.isToday
                      ? 'font-bold text-stone-900 dark:text-zinc-100 bg-stone-100 dark:bg-zinc-800 rounded'
                      : ''
                  }`}
                >
                  {d.dayLabel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-3 shrink-0 pt-2.5 border-t border-stone-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-zinc-600 shrink-0" />
          <span className="text-stone-700 dark:text-zinc-300 truncate text-[11px]">
            {latestExpense ? latestExpense.description : 'Chocolate · Food'}
          </span>
          <span className="font-mono text-stone-500 dark:text-zinc-400 font-medium text-[11px]">
            {latestExpense
              ? `-${currencySymbol}${formatCurrency(Math.abs(latestExpense.amount))}`
              : '-₹40'}
          </span>
        </div>
        <div className="flex items-center space-x-2 pl-2 shrink-0">
          <Link
            href="/finances"
            className="text-stone-400 hover:text-stone-800 dark:hover:text-zinc-200 transition-colors font-medium text-[11px]"
          >
            Ledger →
          </Link>
          <Link
            href="/finances"
            className="bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 font-medium px-2 py-0.5 rounded text-[10px] transition-colors border border-stone-200/60 dark:border-zinc-700/60"
          >
            + Log expense
          </Link>
        </div>
      </div>
    </article>
  );
}
