import React from 'react';
import Link from 'next/link';
import { getFinancialAnalytics, getTransactions, type TransactionWithRelations } from '@/lib/actions/finances';
import { getFallbackFinancialAnalytics } from '@/lib/finances/defaults';
import { formatCurrency } from '@/lib/utils/format';

export async function FinancesQuadrant() {
  let analytics = getFallbackFinancialAnalytics();
  let transactions: TransactionWithRelations[] = [];

  try {
    const [a, t] = await Promise.all([
      getFinancialAnalytics(),
      getTransactions(),
    ]);
    analytics = a || analytics;
    transactions = t || transactions;
  } catch (err) {
    console.error('FinancesQuadrant error:', err);
  }

  const {
    monthlyAllowance = 5000,
    remainingAllowance = 987,
    allowanceUsagePercent = 80,
    monthlySpent = 4013,
    todaySpent = 0,
    safeDailyBudget = 98.7,
    daysLeftInMonth = 10,
    weeklyDays = [],
    currencySymbol = '₹',
  } = analytics;

  const remainingPercent = Math.max(0, Math.min(100, Math.round(100 - allowanceUsagePercent)));
  const latestExpense = (transactions || []).find(
    (t) => t?.type === 'expense' || (t?.amount !== undefined && t.amount < 0)
  );

  // Fallback 7-day sparkline data if weeklyDays is empty
  const days = weeklyDays.length >= 7
    ? weeklyDays.slice(-7)
    : [
        { dayLabel: 'M', spent: 60, isToday: false },
        { dayLabel: 'T', spent: 120, isToday: false },
        { dayLabel: 'W', spent: 80, isToday: false },
        { dayLabel: 'T', spent: 210, isToday: true },
        { dayLabel: 'F', spent: 180, isToday: false },
        { dayLabel: 'S', spent: 90, isToday: false },
        { dayLabel: 'S', spent: 130, isToday: false },
      ];

  const maxSpent = Math.max(...days.map((d) => d.spent || 0), 100);
  const avgSpent = Math.round(
    days.reduce((acc, d) => acc + (d.spent || 0), 0) / (days.length || 1)
  );

  // Generate SVG points: viewBox="0 0 260 22"
  const sparklinePoints = days.map((d, i) => {
    const x = Math.round((i / (days.length - 1 || 1)) * 260);
    const spentVal = Math.max(0, d.spent || 0);
    const y = Math.round(18 - (spentVal / maxSpent) * 14);
    return { x, y, isToday: d.isToday, label: d.dayLabel ? d.dayLabel[0] : 'D' };
  });

  const pathD = sparklinePoints.length > 0
    ? `M ${sparklinePoints.map((p) => `${p.x} ${p.y}`).join(' L ')}`
    : 'M 0 18 L 260 18';

  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900/70 rounded-2xl p-4 xl:p-5 flex flex-col justify-between border border-[#07343C]/10 dark:border-zinc-800/60 shadow-xs text-[#07343C] dark:text-zinc-100 transition-colors">
      {/* Card Header */}
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-semibold text-[#07343C] dark:text-zinc-100">Pocket money</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F3F0EA] dark:bg-zinc-800 text-[#07343C]/70 dark:text-zinc-300 font-medium font-mono">
          {daysLeftInMonth} days left
        </span>
      </div>

      {/* 1. Allowance Remaining */}
      <div className="my-1">
        <div className="flex items-baseline">
          <span className="font-serif text-[40px] xl:text-[44px] leading-none text-[#07343C] dark:text-zinc-100 font-semibold tracking-tight font-mono tabular-nums">
            {currencySymbol}{formatCurrency(remainingAllowance)}
          </span>
          <span className="text-[12px] xl:text-[13px] text-[#07343C]/60 dark:text-zinc-400 ml-2 font-medium font-mono tabular-nums">
            left of {currencySymbol}{formatCurrency(monthlyAllowance)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2">
          <div className="h-2 w-full rounded-full overflow-hidden flex bg-[#F3F0EA] dark:bg-zinc-800">
            <div
              className="h-full bg-[#10B981] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, Math.min(100, allowanceUsagePercent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#07343C]/60 dark:text-zinc-400 mt-1 font-medium font-mono">
            <span>{currencySymbol}{formatCurrency(monthlySpent)} spent</span>
            <span>{remainingPercent}% remaining</span>
          </div>
        </div>
      </div>

      {/* 2 & 3: Spent Today and Safe Daily Limit telemetry */}
      <div className="grid grid-cols-2 gap-2 py-1.5 px-2.5 rounded-xl bg-[#FAF9F5] dark:bg-zinc-950/60 border border-[#07343C]/5 dark:border-zinc-800/60">
        <div>
          <div className="text-[10px] text-[#07343C]/60 dark:text-zinc-400 font-medium">Spent Today</div>
          <div className="text-[13px] font-semibold text-[#07343C] dark:text-zinc-100 font-mono tabular-nums mt-0.5">
            {currencySymbol}{formatCurrency(todaySpent)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#07343C]/60 dark:text-zinc-400 font-medium">Safe Daily Limit</div>
          <div className="text-[13px] font-semibold text-[#10B981] dark:text-emerald-400 font-mono tabular-nums mt-0.5">
            {currencySymbol}{formatCurrency(safeDailyBudget)}
            <span className="text-[10px] text-[#07343C]/60 dark:text-zinc-400 font-sans font-normal">/day</span>
          </div>
        </div>
      </div>

      {/* Standalone 7-Day Sparkline Section */}
      <div className="py-1">
        <div className="flex items-center justify-between text-[10px] text-[#07343C]/60 dark:text-zinc-400 mb-1">
          <span>7-Day Spending Activity</span>
          <span className="font-mono tabular-nums">avg {currencySymbol}{avgSpent}</span>
        </div>
        <div className="h-[26px] w-full flex items-center">
          <svg className="w-full h-[24px] overflow-visible" preserveAspectRatio="none" viewBox="0 0 260 22">
            <path
              d={pathD}
              fill="none"
              stroke="#10B981"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
            {sparklinePoints.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                fill="#10B981"
                r={pt.isToday ? 3.5 : 2.5}
                className={pt.isToday ? 'stroke-white dark:stroke-zinc-900 stroke-1' : ''}
              />
            ))}
          </svg>
        </div>
        <div className="flex justify-between items-center px-1 text-[10px] text-[#07343C]/50 dark:text-zinc-400 font-mono mt-1">
          {sparklinePoints.map((pt, idx) => (
            <span
              key={idx}
              className={
                pt.isToday
                  ? 'w-4 h-4 rounded-full bg-[#10B981]/15 text-[#0B5563] dark:text-emerald-400 font-bold flex items-center justify-center'
                  : ''
              }
            >
              {pt.label}
            </span>
          ))}
        </div>
      </div>

      {/* Compact single-line footer */}
      <div className="pt-2 border-t border-[#07343C]/10 dark:border-zinc-800/60 flex items-center justify-between gap-1">
        <div className="min-w-0 pr-1 flex items-baseline gap-1">
          {latestExpense ? (
            <span className="text-[12px] text-[#07343C]/80 dark:text-zinc-300 truncate font-medium">
              {latestExpense.description}{' '}
              <strong className="text-[#BE123C] dark:text-rose-400 font-semibold ml-0.5 font-mono tabular-nums">
                −{currencySymbol}{formatCurrency(Math.abs(latestExpense.amount))}
              </strong>
            </span>
          ) : (
            <span className="text-[12px] text-[#07343C]/60 dark:text-zinc-400 truncate">No recent outflow</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/finances"
            className="text-[11px] text-[#07343C]/70 dark:text-zinc-400 hover:text-[#07343C] dark:hover:text-zinc-100 underline decoration-[#07343C]/30 dark:decoration-zinc-700 whitespace-nowrap"
          >
            Ledger →
          </Link>
          <Link
            href="/finances"
            className="border border-[#07343C]/20 dark:border-zinc-700 text-[#07343C] dark:text-zinc-200 bg-white dark:bg-zinc-800 text-[11px] px-2.5 py-0.5 rounded-full font-medium hover:bg-[#F3F0EA] dark:hover:bg-zinc-700 transition-colors whitespace-nowrap shadow-2xs"
          >
            + Log expense
          </Link>
        </div>
      </div>
    </div>
  );
}

export function FinancesSkeleton() {
  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900/70 rounded-2xl p-4 xl:p-5 flex flex-col justify-between border border-[#07343C]/10 dark:border-zinc-800/60 shadow-xs animate-pulse">
      <div className="h-4 w-28 bg-stone-200 dark:bg-zinc-800 rounded" />
      <div className="h-10 w-44 bg-stone-200 dark:bg-zinc-800 rounded my-2" />
      <div className="h-2 w-full bg-stone-200 dark:bg-zinc-800 rounded" />
      <div className="h-12 w-full bg-stone-100 dark:bg-zinc-800/50 rounded-xl my-2" />
      <div className="h-10 w-full bg-stone-100 dark:bg-zinc-800/50 rounded" />
      <div className="h-5 w-full bg-stone-200 dark:bg-zinc-800 rounded mt-2" />
    </div>
  );
}
