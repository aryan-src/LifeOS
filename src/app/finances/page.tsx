import React from 'react';
import { FinancesClientView } from '@/components/finances/finances-client-view';
import { getTransactions, getFinancialAnalytics, getCategories } from '@/lib/actions/finances';
import { getProjectOptions } from '@/lib/actions/projects-options';

export const dynamic = 'force-dynamic';

export default async function FinancesPage() {
  const [transactions, analytics, categories, projects] = await Promise.all([
    getTransactions(),
    getFinancialAnalytics(),
    getCategories(),
    getProjectOptions(),
  ]);

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-7xl mx-auto px-space-md sm:px-space-lg lg:px-margin py-space-xl flex flex-col gap-space-xl">
        {/* Top Context & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-xl">
            <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-secondary"></span>
              <span>Semester Autumn 2026</span>
              <span>·</span>
              <span>Ledger Active</span>
            </div>
            <h1 className="font-display text-display text-on-surface font-semibold tracking-tight">Student Finances</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Pocket money, daily safe limits, and mindful student expense tracker.
            </p>
          </div>
        </div>

        <FinancesClientView
          initialTransactions={transactions}
          analytics={analytics}
          categories={categories}
          projects={projects}
        />
      </div>
    </div>
  );
}
