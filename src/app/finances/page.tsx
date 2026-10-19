import React from 'react';
import type { Metadata } from 'next';
import { FinancesClientView } from '@/components/finances/finances-client-view';
import { getTransactions, getFinancialAnalytics, getCategories } from '@/lib/actions/finances';
import { getProjectOptions } from '@/lib/actions/projects-options';

export const metadata: Metadata = {
  title: 'Finances',
  description: 'Pocket money tracker and allowance-aware ledger for students and builders.',
};

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
