import React from 'react';
import { Timer, Award, Clock } from 'lucide-react';
import type { FocusHistorySummary } from '@/lib/daily-loop/focus-history-derived';

interface FocusHistoryStatsProps {
  summary: FocusHistorySummary;
}

export function FocusHistoryStats({ summary }: FocusHistoryStatsProps) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      data-purpose="focus-history-stats"
    >
      {/* Stat 1: Total / Focused Today */}
      <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
            Focused Today
          </span>
          <Timer className="h-5 w-5 text-secondary" aria-hidden="true" />
        </div>
        <div className="my-4">
          <div className="text-3xl font-semibold text-on-surface font-mono tracking-tight tabular-nums font-numeric-timer">
            {summary.todayFormatted}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all"
                style={{ width: `${Math.min(100, summary.todayPercent)}%` }}
              />
            </div>
            <span className="font-mono text-label-sm text-on-surface-variant font-medium tabular-nums">
              {summary.todayPercent}%
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between font-mono text-label-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
          <span>Target: {summary.todayGoalFormatted}</span>
          <span className={summary.todayPercent >= 100 ? 'text-secondary font-medium' : 'text-on-surface-variant'}>
            {summary.todayPercent >= 100 ? 'Goal met' : 'In progress'}
          </span>
        </div>
      </div>

      {/* Stat 2: Total Logged */}
      <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
            Total Logged
          </span>
          <Award className="h-5 w-5 text-on-tertiary-container" aria-hidden="true" />
        </div>
        <div className="my-4">
          <div className="text-3xl font-semibold text-on-surface font-mono tracking-tight tabular-nums font-numeric-timer">
            {summary.totalFormatted}
          </div>
          <div className="font-sans text-body-md text-on-surface font-medium mt-1">
            {summary.qualifiedDaysThisWeek} of 7 qualified days
          </div>
        </div>
        <div className="flex items-center justify-between font-mono text-label-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
          <span>Total sessions</span>
          <span className="text-on-surface tabular-nums font-medium">
            {summary.totalSessions} {summary.totalSessions === 1 ? 'session' : 'sessions'}
          </span>
        </div>
      </div>

      {/* Stat 3: Average Session */}
      <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
            Average Session
          </span>
          <Clock className="h-5 w-5 text-on-surface-variant" aria-hidden="true" />
        </div>
        <div className="my-4">
          <div className="text-3xl font-semibold text-on-surface font-mono tracking-tight tabular-nums font-numeric-timer">
            {summary.averageSessionMinutes > 0 ? `${summary.averageSessionMinutes} min` : '0 min'}
          </div>
          <div className="font-sans text-body-sm text-on-surface-variant mt-1">
            Average block duration
          </div>
        </div>
        <div className="flex items-center justify-between font-mono text-label-sm text-on-surface-variant pt-2 border-t border-outline-variant/20">
          <span>{summary.totalSessions} sessions logged</span>
          <span className="font-mono text-label-sm text-secondary font-medium">
            {summary.averageSessionMinutes >= 25 ? 'Optimal' : 'Active'}
          </span>
        </div>
      </div>
    </div>
  );
}
