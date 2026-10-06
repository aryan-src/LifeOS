'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import type { FinancialAnalytics } from '@/lib/actions/finances';

// CRITICAL: Dynamically import Recharts client tree with ssr: false
// Prevents ResponsiveContainer 0px collapse and SVG hydration mismatches
const DynamicFinancialChartsClient = dynamic(
  () =>
    import('./financial-charts-client').then((mod) => mod.FinancialChartsClient),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl border border-slate-800 bg-slate-900/30" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl border border-slate-800 bg-slate-900/30" />
          <div className="h-80 rounded-2xl border border-slate-800 bg-slate-900/30" />
        </div>
      </div>
    ),
  }
);

interface FinancialChartsWrapperProps {
  analytics: FinancialAnalytics;
}

export function FinancialChartsWrapper({ analytics }: FinancialChartsWrapperProps) {
  return <DynamicFinancialChartsClient analytics={analytics} />;
}
