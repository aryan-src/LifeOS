import React from 'react';
import { getFinancialAnalytics, getTransactions } from '@/lib/actions/finances';
import { formatCurrency } from '@/lib/utils/format';
import Link from 'next/link';

export async function FinancesQuadrant() {
  const [analytics, transactions] = await Promise.all([
    getFinancialAnalytics(),
    getTransactions(),
  ]);

  const {
    monthlyAllowance,
    remainingAllowance,
    allowanceUsagePercent,
    todaySpent,
    safeDailyBudget,
    daysLeftInMonth,
  } = analytics;

  const latestExpense = transactions.find((t) => t.type === 'expense' || t.amount < 0);

  return (
    <article className="rounded bg-surface-container-lowest shadow-sm p-space-lg flex flex-col justify-between gap-space-md h-full">
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-space-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">account_balance_wallet</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">Pocket Money Tracker</h2>
          </div>
          <Link
            className="font-label-sm text-label-sm text-outline hover:text-on-surface flex items-center gap-0.5 transition-colors"
            href="/finances"
          >
            <span>View ledger</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>

        {/* Allowance Telemetry Visual */}
        <div className="p-space-md rounded bg-surface-container-low flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline block">Remaining Liquidity</span>
              <span
                suppressHydrationWarning
                className="font-headline-lg text-headline-lg font-semibold text-on-surface font-display"
              >
                ₹{formatCurrency(remainingAllowance)}
              </span>
            </div>
            <span suppressHydrationWarning className="font-label-md text-label-md text-outline">
              Pool: ₹{formatCurrency(monthlyAllowance)}
            </span>
          </div>

          {/* Soft Sage Fill Bar */}
          <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - allowanceUsagePercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-outline font-label-sm text-label-sm pt-1">
            <span suppressHydrationWarning>
              Today&apos;s spend: <span className="text-on-surface-variant font-medium">₹{formatCurrency(todaySpent)}</span>
            </span>
            <span suppressHydrationWarning>
              Daily ceiling: <span className="text-on-surface-variant font-medium">₹{formatCurrency(safeDailyBudget)}</span>
            </span>
          </div>
        </div>

        {/* Recent Outflow Item */}
        <div className="flex flex-col gap-1.5">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Latest Activity</span>
          {latestExpense ? (
            <div className="flex items-center justify-between py-2 px-2.5 rounded bg-surface-container-low">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[16px] text-tertiary-container">local_cafe</span>
                <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                  {latestExpense.description}
                </span>
                <span className="font-label-sm text-label-sm text-outline truncate">
                  • {latestExpense.category?.name || 'Expense'}
                </span>
              </div>
              <span
                suppressHydrationWarning
                className="font-label-md text-label-md text-on-tertiary-container font-medium shrink-0 ml-2"
              >
                - ₹{formatCurrency(Math.abs(latestExpense.amount))}
              </span>
            </div>
          ) : (
            <div className="py-2 px-2.5 rounded bg-surface-container-low text-center text-body-sm text-outline">
              No expenses recorded yet.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-space-xs text-outline font-label-sm text-label-sm border-t border-surface-container-high/60 mt-2">
        <span>Cycle resets in {daysLeftInMonth} days</span>
        <span className="text-secondary font-medium">{allowanceUsagePercent}% spent</span>
      </div>
    </article>
  );
}

export function FinancesSkeleton() {
  return (
    <div className="rounded bg-surface-container-lowest p-space-lg shadow-sm animate-pulse h-80 flex flex-col justify-between">
      <div className="h-5 w-32 bg-surface-container-high rounded" />
      <div className="h-28 bg-surface-container-low rounded-xl" />
      <div className="h-10 bg-surface-container-low rounded-lg" />
    </div>
  );
}
