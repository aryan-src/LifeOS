import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import type { DailyLoopDashboardData } from '@/lib/actions/daily-loop';
import { deriveFocusHistorySummary } from '@/lib/daily-loop/focus-history-derived';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { EmptyState } from '@/components/ui/empty-state';
import { FocusHistoryStats } from './focus-history-stats';
import { FocusWeeklyChart } from './focus-weekly-chart';

interface FocusHistoryViewProps {
  data: DailyLoopDashboardData;
}

export function FocusHistoryView({ data }: FocusHistoryViewProps) {
  const summary = deriveFocusHistorySummary(data);

  return (
    <div
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16"
      data-purpose="focus-history-page"
    >
      {/* Breadcrumb & Playfair Page Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-outline-variant/40 pb-5 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 transition-colors hover:text-on-surface"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-on-surface font-medium">Focus History</span>
          </div>

          <h1 className="font-serif text-page-title font-normal tracking-tight text-on-surface">
            Focus History
          </h1>
          <p className="font-sans text-body-sm text-on-surface-variant">
            Focus telemetry, weekly rhythm, and 14-day peak-hour calibration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="secondary" dot={true}>
            {summary.totalSessions > 0 ? 'Telemetry Synced' : 'Ready to track'}
          </Pill>
          <Pill tone="neutral">{summary.weekLabel}</Pill>
        </div>
      </header>

      {/* KPI Row */}
      <FocusHistoryStats summary={summary} />

      {/* Weekly Rhythm + 14-Day Calibration */}
      <FocusWeeklyChart summary={summary} />

      {/* Recent Sessions Section */}
      <Card padding="lg" surface="lowest" className="space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
          <div>
            <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
              Recent Focus Sessions
            </h2>
            <p className="mt-0.5 font-sans text-body-sm text-on-surface-variant">
              Session-level ledger summary
            </p>
          </div>
          <Pill tone="neutral">
            {summary.totalSessions} {summary.totalSessions === 1 ? 'block' : 'blocks'} logged
          </Pill>
        </div>

        <EmptyState
          compact={true}
          icon={<Clock className="h-5 w-5" />}
          title={
            summary.totalSessions === 0
              ? 'No focus sessions recorded yet'
              : `${summary.totalSessions} focus ${
                  summary.totalSessions === 1 ? 'session' : 'sessions'
                } recorded (${summary.totalFormatted} total)`
          }
          description={
            summary.totalSessions === 0
              ? 'Start a focus block from Today on the Dashboard to begin logging sessions.'
              : 'Aggregate session totals and calibration metrics above are live from your account. Per-session timeline rows require an additional read query outside this UI-only pass.'
          }
          action={
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 font-sans text-body-sm font-medium text-on-secondary transition-opacity hover:opacity-95"
            >
              Start a focus session
            </Link>
          }
        />
      </Card>
    </div>
  );
}
