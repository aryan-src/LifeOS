import React from 'react';
import { getFinancialAnalytics, getTransactions, type TransactionWithRelations } from '@/lib/actions/finances';
import { getFallbackFinancialAnalytics } from '@/lib/finances/defaults';
import { PocketMoneyWidget } from '@/components/finances/pocket-money-widget';

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

  const latestExpense = (transactions || []).find(
    (t) => t?.type === 'expense' || (t?.amount !== undefined && t.amount < 0)
  );

  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabel = `${months[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <PocketMoneyWidget
      telemetry={analytics}
      latestExpense={latestExpense}
      monthLabel={monthLabel}
      className="w-full h-full"
    />
  );
}

export function FinancesSkeleton() {
  return (
    <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-slate-100/80 dark:border-zinc-800 shadow-sm animate-pulse">
      <div className="flex justify-between items-start pb-5 border-b border-slate-100 dark:border-zinc-800">
        <div className="h-7 w-36 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
        <div className="flex flex-col items-end gap-1.5">
          <div className="h-7 w-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-4 w-14 bg-slate-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="rounded-2xl bg-slate-50/70 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 p-5 my-2 space-y-4">
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200/60 dark:border-zinc-800">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-7 w-24 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-28 bg-slate-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="space-y-2 pl-4 border-l border-slate-200/60 dark:border-zinc-800">
            <div className="h-3 w-24 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-7 w-28 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-32 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="grid grid-cols-7 gap-2.5 h-28 items-end pt-2">
            {[40, 65, 25, 80, 20, 50, 30].map((h, i) => (
              <div key={i} className="bg-slate-200 dark:bg-zinc-800 rounded-t w-full" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="h-5 w-full bg-slate-100 dark:bg-zinc-800/60 rounded mt-1" />
    </div>
  );
}
