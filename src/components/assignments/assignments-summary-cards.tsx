'use client';

import React from 'react';
import type { AssignmentWithProject } from '@/lib/actions/assignments';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface AssignmentsSummaryCardsProps {
  overdueCount: number;
  dueThisWeekCount: number;
  completedThisWeekCount: number;
  nextAssignment: AssignmentWithProject | null;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function AssignmentsSummaryCards({
  overdueCount,
  dueThisWeekCount,
  completedThisWeekCount,
  nextAssignment,
}: AssignmentsSummaryCardsProps) {
  const isAllCaughtUp = overdueCount === 0;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      data-purpose="assignments-summary-cards"
    >
      {/* Overdue Metric */}
      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
            Overdue
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-label-sm font-semibold ${
              isAllCaughtUp
                ? 'bg-secondary/15 text-secondary'
                : 'bg-error/15 text-error'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAllCaughtUp ? 'bg-secondary' : 'bg-error'
              }`}
              aria-hidden="true"
            />
            {isAllCaughtUp ? 'All caught up!' : `${overdueCount} overdue`}
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-3" style={LINING_NUMS_STYLE}>
          <span className="font-mono text-numeric-timer text-on-surface font-semibold tracking-tight">
            {overdueCount}
          </span>
          <span className="font-sans text-body-sm text-on-surface-variant">
            {isAllCaughtUp ? 'no backlog pending' : 'backlog items pending'}
          </span>
        </div>
      </div>

      {/* Due This Week Metric */}
      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
            Due This Week
          </span>
          <Calendar className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
        </div>
        <div className="mt-4 flex items-baseline gap-2" style={LINING_NUMS_STYLE}>
          <span className="font-mono text-numeric-timer text-on-surface font-semibold tracking-tight">
            {dueThisWeekCount}
          </span>
          <span className="font-sans text-body-sm text-on-surface font-medium">
            assignments
          </span>
          <span className="font-mono text-label-sm text-on-surface-variant ml-auto">
            {completedThisWeekCount} completed
          </span>
        </div>
      </div>

      {/* Next Deadline Metric */}
      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
            Next Deadline
          </span>
          {nextAssignment?.subject && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container font-mono text-label-sm text-on-surface-variant font-medium">
              {nextAssignment.subject}
            </span>
          )}
        </div>
        <div className="mt-4">
          {nextAssignment ? (
            <>
              <div className="font-sans text-headline-sm text-on-surface font-semibold truncate">
                {nextAssignment.due_date
                  ? new Date(nextAssignment.due_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'No set date'}
              </div>
              <div className="font-sans text-body-sm text-on-surface-variant truncate mt-0.5">
                {nextAssignment.title}
              </div>
            </>
          ) : (
            <>
              <div className="font-sans text-headline-sm text-on-surface font-semibold">
                No upcoming deadlines
              </div>
              <div className="font-sans text-body-sm text-on-surface-variant mt-0.5">
                All caught up with coursework
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
