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
    <article className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs p-6 md:p-8 flex flex-col justify-between gap-6 h-full min-w-0">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-outline-variant/20 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">account_balance_wallet</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">Pocket Money Tracker</h2>
          </div>
          <Link
            className="font-label-sm text-label-sm text-outline hover:text-on-surface flex items-center gap-1 transition-colors shrink-0"
            href="/finances"
          >
            <span>View ledger</span>
            <span className="material-symbols-outlined text-[14px] shrink-0">arrow_forward</span>
          </Link>
        </div>

        {/* Allowance Telemetry Visual */}
        <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 flex flex-col gap-3 min-w-0">
          <div className="flex items-end justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <span className="font-label-sm text-label-sm text-outline block truncate">Remaining Liquidity</span>
              <span
                suppressHydrationWarning
                className="font-headline-lg text-headline-lg font-semibold text-on-surface font-display truncate block"
              >
                ₹{formatCurrency(remainingAllowance)}
              </span>
            </div>
            <span suppressHydrationWarning className="font-label-md text-label-md text-outline shrink-0">
              Pool: ₹{formatCurrency(monthlyAllowance)}
            </span>
          </div>

          {/* Soft Sage Fill Bar */}
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - allowanceUsagePercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-outline font-label-sm text-label-sm pt-1 gap-2 flex-wrap">
            <span suppressHydrationWarning className="truncate">
              Today&apos;s spend: <span className="text-on-surface-variant font-medium">₹{formatCurrency(todaySpent)}</span>
            </span>
            <span suppressHydrationWarning className="truncate">
              Daily ceiling: <span className="text-on-surface-variant font-medium">₹{formatCurrency(safeDailyBudget)}</span>
            </span>
          </div>
        </div>

        {/* Recent Outflow Item */}
        <div className="flex flex-col gap-2 min-w-0">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Latest Activity</span>
          {latestExpense ? (
            <div className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 gap-3 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-[16px] text-tertiary-container shrink-0">local_cafe</span>
                <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                  {latestExpense.description}
                </span>
                <span className="font-label-sm text-label-sm text-outline truncate hidden sm:inline">
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
            <div className="py-3 px-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 text-center text-body-sm text-outline font-normal">
              No expenses recorded yet.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 text-outline font-label-sm text-label-sm border-t border-outline-variant/20 mt-2">
        <span>Cycle resets in {daysLeftInMonth} days</span>
        <span className="text-secondary font-medium">{allowanceUsagePercent}% spent</span>
      </div>
    </article>
  );
}

export function FinancesSkeleton() {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 shadow-xs animate-pulse h-80 flex flex-col justify-between">
      <div className="h-5 w-36 bg-surface-container-high rounded-md" />
      <div className="h-28 bg-surface-container-low rounded-xl" />
      <div className="h-10 bg-surface-container-low rounded-xl" />
    </div>
  );
}
