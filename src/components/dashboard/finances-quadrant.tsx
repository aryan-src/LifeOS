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
      className="w-full h-full min-h-[380px]"
    />
  );
}

export function FinancesSkeleton() {
  return (
    <div className="flex-1 min-h-[380px] bg-white dark:bg-zinc-900/70 rounded-2xl p-4 xl:p-5 flex flex-col justify-between border border-stone-200/70 dark:border-zinc-800/60 shadow-sm animate-pulse">
      <div className="flex justify-between items-center pb-2 border-b border-stone-100 dark:border-zinc-800/60">
        <div className="h-4 w-28 bg-stone-200 dark:bg-zinc-800 rounded" />
        <div className="h-4 w-16 bg-stone-200 dark:bg-zinc-800 rounded-full" />
      </div>
      <div className="h-10 w-44 bg-stone-200 dark:bg-zinc-800 rounded my-2" />
      <div className="h-2 w-full bg-stone-200 dark:bg-zinc-800 rounded" />
      <div className="grid grid-cols-2 gap-2.5 my-2">
        <div className="h-14 bg-stone-100 dark:bg-zinc-800/50 rounded-xl" />
        <div className="h-14 bg-stone-100 dark:bg-zinc-800/50 rounded-xl" />
      </div>
      <div className="h-16 w-full bg-stone-100 dark:bg-zinc-800/50 rounded" />
      <div className="h-5 w-full bg-stone-200 dark:bg-zinc-800 rounded mt-2" />
    </div>
  );
}
