import React from 'react';
import { getFinancialAnalytics, getTransactions, type TransactionWithRelations } from '@/lib/actions/finances';
import { getFallbackFinancialAnalytics } from '@/lib/finances/defaults';
import { formatCurrency } from '@/lib/utils/format';
import Link from 'next/link';

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
    monthlyAllowance,
    remainingAllowance,
    allowanceUsagePercent,
    todaySpent,
    safeDailyBudget,
    daysLeftInMonth,
    currencySymbol = '₹',
  } = analytics;

  const latestExpense = (transactions || []).find((t) => t?.type === 'expense' || (t?.amount !== undefined && t.amount < 0));

  return (
    <article className="p-6 md:p-8 flex flex-col justify-between gap-6 h-full min-w-0 relative z-10">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-outline-variant/20 dark:border-zinc-800/60 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-secondary dark:text-emerald-400 text-[20px] shrink-0">account_balance_wallet</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface dark:text-zinc-100 font-semibold truncate">Pocket Money Tracker</h2>
          </div>
          <Link
            className="font-label-sm text-label-sm text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100 flex items-center gap-1 transition-colors shrink-0"
            href="/finances"
          >
            <span>View ledger</span>
            <span className="material-symbols-outlined text-[14px] shrink-0">arrow_forward</span>
          </Link>
        </div>

        {/* Allowance Telemetry Visual */}
        <div className="p-4 rounded-xl border border-outline-variant/20 dark:border-zinc-800/60 bg-surface-container-low/50 dark:bg-zinc-800/40 flex flex-col gap-3 min-w-0">
          <div className="flex items-end justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <span className="font-label-sm text-label-sm text-outline dark:text-zinc-400 block truncate">Remaining Liquidity</span>
              <span
                suppressHydrationWarning
                className="font-headline-lg text-headline-lg font-semibold text-on-surface dark:text-zinc-100 font-display truncate block"
              >
                {currencySymbol}{formatCurrency(remainingAllowance)}
              </span>
            </div>
            <span suppressHydrationWarning className="font-label-md text-label-md text-outline dark:text-zinc-400 shrink-0">
              Pool: {currencySymbol}{formatCurrency(monthlyAllowance)}
            </span>
          </div>

          {/* Soft Sage Fill Bar */}
          <div suppressHydrationWarning className="w-full bg-surface-container-high dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              suppressHydrationWarning
              className="bg-secondary dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - allowanceUsagePercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-outline dark:text-zinc-400 font-label-sm text-label-sm pt-1 gap-2 flex-wrap">
            <span suppressHydrationWarning className="truncate">
              Today&apos;s spend: <span className="text-on-surface-variant dark:text-zinc-200 font-medium">{currencySymbol}{formatCurrency(todaySpent)}</span>
            </span>
            <span suppressHydrationWarning className="truncate">
              Daily ceiling: <span className="text-on-surface-variant dark:text-zinc-200 font-medium">{currencySymbol}{formatCurrency(safeDailyBudget)}</span>
            </span>
          </div>
        </div>

        {/* Recent Outflow Item */}
        <div className="flex flex-col gap-2 min-w-0">
          <span className="font-label-sm text-label-sm text-outline dark:text-zinc-400 uppercase tracking-wider">Latest Activity</span>
          {latestExpense ? (
            <div className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-outline-variant/20 dark:border-zinc-800/60 bg-surface-container-low/40 dark:bg-zinc-800/40 gap-3 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-[16px] text-tertiary-container dark:text-rose-400 shrink-0">local_cafe</span>
                <span className="font-body-sm text-body-sm text-on-surface dark:text-zinc-100 font-medium truncate">
                  {latestExpense.description}
                </span>
                <span className="font-label-sm text-label-sm text-outline dark:text-zinc-400 truncate hidden sm:inline">
                  • {latestExpense.category?.name || 'Expense'}
                </span>
              </div>
              <span
                suppressHydrationWarning
                className="font-label-md text-label-md text-on-tertiary-container dark:text-rose-400 font-medium shrink-0 ml-2"
              >
                - {currencySymbol}{formatCurrency(Math.abs(latestExpense.amount))}
              </span>
            </div>
          ) : (
            <div className="py-3 px-3 rounded-xl border border-outline-variant/20 dark:border-zinc-800/60 bg-surface-container-low/40 dark:bg-zinc-800/40 text-center text-body-sm text-outline dark:text-zinc-500 font-normal">
              No expenses recorded yet.
            </div>
          )}
        </div>
      </div>

      <div suppressHydrationWarning className="flex items-center justify-between pt-3 text-outline dark:text-zinc-400 font-label-sm text-label-sm border-t border-outline-variant/20 dark:border-zinc-800/60 mt-2">
        <span>Cycle resets in {daysLeftInMonth} days</span>
        <span className="text-secondary dark:text-emerald-400 font-medium">{allowanceUsagePercent}% spent</span>
      </div>
    </article>
  );
}

export function FinancesSkeleton() {
  return (
    <article className="p-6 md:p-8 animate-pulse h-full min-w-0 flex flex-col justify-between gap-6 relative z-10">
      <div className="h-5 w-36 bg-surface-container-high dark:bg-zinc-800 rounded-md" />
      <div className="h-28 bg-surface-container-low dark:bg-zinc-800/60 rounded-xl" />
      <div className="h-10 bg-surface-container-low dark:bg-zinc-800/60 rounded-xl" />
    </article>
  );
}
