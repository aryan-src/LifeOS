'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils/format';

export interface DashboardMetricsViewProps {
  currencySymbol: string;
  remainingAllowance: number;
  safeDailyBudget: number;
  allowanceUsagePercent: number;
  completedTasksCount: number;
  totalTasksCount: number;
  tasksPercent: number;
  pendingTodayCount: number;
  activeProjectsCount: number;
  activeProjectsSummary: string;
  completedProjectsCount: number;
  backlogProjectsCount: number;
  totalNotesCount: number;
  pinnedSparksCount: number;
  promotedToProjectsCount: number;
}

export function DashboardMetricsView({
  currencySymbol,
  remainingAllowance,
  safeDailyBudget,
  allowanceUsagePercent,
  completedTasksCount,
  totalTasksCount,
  tasksPercent,
  pendingTodayCount,
  activeProjectsCount,
  activeProjectsSummary,
  completedProjectsCount,
  backlogProjectsCount,
  totalNotesCount,
  pinnedSparksCount,
  promotedToProjectsCount,
}: DashboardMetricsViewProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
      {/* Metric 1: Monthly Allowance */}
      <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs flex flex-col justify-between gap-3 hover:shadow-sm transition-shadow min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider truncate">Allowance Balance</span>
          <span suppressHydrationWarning className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-medium shrink-0">
            {100 - Math.min(allowanceUsagePercent, 100)}% remaining
          </span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span suppressHydrationWarning className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight font-display truncate">
            {currencySymbol}{formatCurrency(remainingAllowance)}
          </span>
          <div className="flex items-center gap-1.5 text-outline min-w-0">
            <span className="material-symbols-outlined text-[15px] shrink-0 text-secondary">format_image_left</span>
            <span suppressHydrationWarning className="font-label-sm text-label-sm truncate">
              Safe daily pace: <span className="text-on-surface-variant font-medium">{currencySymbol}{formatCurrency(safeDailyBudget)}/day</span>
            </span>
          </div>
        </div>
        <div suppressHydrationWarning className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
          <div
            suppressHydrationWarning
            className="bg-secondary h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(0, 100 - allowanceUsagePercent)}%` }}
          />
        </div>
      </div>

      {/* Metric 2: Daily Tasks */}
      <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs flex flex-col justify-between gap-3 hover:shadow-sm transition-shadow min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider truncate">Daily Tasks</span>
          <span suppressHydrationWarning className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm font-medium shrink-0">
            {tasksPercent}% complete
          </span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span suppressHydrationWarning className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight font-display truncate">
            {completedTasksCount} of {totalTasksCount}
          </span>
          <div className="flex items-center gap-1.5 text-outline min-w-0">
            <span className="material-symbols-outlined text-[15px] shrink-0 text-secondary">pending_actions</span>
            <span suppressHydrationWarning className="font-label-sm text-label-sm truncate">
              <span className="text-on-surface-variant font-medium">{pendingTodayCount} pending</span> scheduled today
            </span>
          </div>
        </div>
        <div suppressHydrationWarning className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
          <div suppressHydrationWarning className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${tasksPercent}%` }} />
        </div>
      </div>

      {/* Metric 3: Active Projects */}
      <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs flex flex-col justify-between gap-3 hover:shadow-sm transition-shadow min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider truncate">Workstreams</span>
          <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight font-display truncate">
            {activeProjectsCount} Ongoing
          </span>
          <div className="flex items-center gap-1.5 text-outline min-w-0">
            <span className="font-label-sm text-label-sm truncate">
              {activeProjectsSummary || 'No active projects'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-label-sm font-label-sm px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
            {completedProjectsCount} completed
          </span>
          <span className="text-label-sm font-label-sm px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
            {backlogProjectsCount} backlog
          </span>
        </div>
      </div>

      {/* Metric 4: Captured Ideas */}
      <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs flex flex-col justify-between gap-3 hover:shadow-sm transition-shadow min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider truncate">Incubator</span>
          <span className="material-symbols-outlined text-[16px] text-outline shrink-0">lightbulb</span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight font-display truncate">
            {totalNotesCount} Notes
          </span>
          <div className="flex items-center gap-1.5 text-outline min-w-0">
            <span className="material-symbols-outlined text-[15px] shrink-0 text-secondary">auto_awesome</span>
            <span className="font-label-sm text-label-sm truncate">
              {pinnedSparksCount} pinned sparks
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-outline min-w-0">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium shrink-0">
            {promotedToProjectsCount} promoted
          </span>
          <span className="font-label-sm text-label-sm truncate">to projects</span>
        </div>
      </div>
    </section>
  );
}
