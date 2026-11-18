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
      {/* Top Breadcrumb & Page Identification */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-on-surface-variant font-mono text-label-sm uppercase tracking-wider">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 hover:text-on-surface cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
          <span>/</span>
          <span className="text-on-surface font-semibold">Focus History</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-page-title font-normal tracking-tight text-on-surface">
              Focus History
            </h1>
            <p className="font-sans text-body-md text-on-surface-variant mt-1">
              Weekly cognitive telemetry and deep work sessions
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto font-mono text-label-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-secondary" aria-hidden="true" />
              <span>{summary.totalSessions > 0 ? 'Telemetry Synced' : 'Ready to track'}</span>
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant tabular-nums">
              {summary.weekLabel}
            </span>
          </div>
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
