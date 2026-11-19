import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { DailyLoopDashboardData } from '@/lib/actions/daily-loop';
import type { FocusSessionRow } from '@/lib/actions/focus-session';
import { deriveFocusHistorySummary } from '@/lib/daily-loop/focus-history-derived';
import { FocusHistoryStats } from './focus-history-stats';
import { AttentionalDistributionCard } from './attentional-distribution-card';
import { RecentSessionsCard } from './recent-sessions-card';
import { CalibrationHorizonCard } from './calibration-horizon-card';

interface FocusHistoryViewProps {
  data: DailyLoopDashboardData;
  recentSessions?: FocusSessionRow[];
}

export function FocusHistoryView({ data, recentSessions = [] }: FocusHistoryViewProps) {
  const summary = deriveFocusHistorySummary(data);

  return (
    <div
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8 py-8 pb-32"
      data-purpose="focus-history-page"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <h1 className="font-serif text-page-title font-normal tracking-tight text-on-surface">
            Focus History
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-label-sm">
          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant tabular-nums">
            {summary.weekLabel}
          </span>
        </div>
      </div>

      {/* Stat Row: 3 Cards */}
      <FocusHistoryStats summary={summary} />

      {/* Attentional Distribution (Weekly Bar Chart Card) */}
      <AttentionalDistributionCard summary={summary} />

      {/* Two-Column Split (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (8 cols): Recent Sessions Table */}
        <RecentSessionsCard sessions={recentSessions} />

        {/* Right (4 cols): Calibration Horizon Card */}
        <CalibrationHorizonCard
          calibration={summary.calibration}
          peakWindowText={summary.peakWindowText}
        />
      </div>
    </div>
  );
}
