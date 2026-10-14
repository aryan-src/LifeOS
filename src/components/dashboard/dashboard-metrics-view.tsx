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
      <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 dark:border-zinc-800/60 bg-surface-container-lowest dark:bg-zinc-900/50 shadow-xs flex flex-col justify-between gap-3 hover:shadow-sm transition-all min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-label-sm text-label-sm text-outline dark:text-zinc-500 uppercase tracking-wider truncate">Allowance Balance</span>
          <span suppressHydrationWarning className="px-2 py-0.5 rounded-full bg-secondary-container dark:bg-emerald-950/40 text-on-secondary-container dark:text-emerald-300 font-label-sm text-label-sm font-medium shrink-0">
            {100 - Math.min(allowanceUsagePercent, 100)}% remaining
          </span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span suppressHydrationWarning className="font-headline-lg text-headline-lg text-on-surface dark:text-zinc-100 font-semibold tracking-tight font-display truncate">
            {currencySymbol}{formatCurrency(remainingAllowance)}
          </span>
          <div className="flex items-center gap-1.5 text-outline dark:text-zinc-500 min-w-0">
            <span className="material-symbols-outlined text-[15px] shrink-0 text-secondary dark:text-emerald-400">format_image_left</span>
            <span suppressHydrationWarning className="font-label-sm text-label-sm truncate">
              Safe daily pace: <span className="text-on-surface-variant dark:text-zinc-300 font-medium">{currencySymbol}{formatCurrency(safeDailyBudget)}/day</span>
            </span>
          </div>
        </div>
        <div suppressHydrationWarning className="w-full bg-surface-container-high dark:bg-zinc-800/60 h-1.5 rounded-full overflow-hidden mt-1">
          <div
            suppressHydrationWarning
            className="bg-secondary dark:bg-emerald-500/80 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(0, 100 - allowanceUsagePercent)}%` }}
          />
        </div>
      </div>

      {/* Metric 2: Daily Tasks */}
      <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 dark:border-zinc-800/60 bg-surface-container-lowest dark:bg-zinc-900/50 shadow-xs flex flex-col justify-between gap-3 hover:shadow-sm transition-all min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-label-sm text-label-sm text-outline dark:text-zinc-500 uppercase tracking-wider truncate">Daily Tasks</span>
          <span suppressHydrationWarning className="px-2 py-0.5 rounded-full bg-surface-container-high dark:bg-zinc-800 text-secondary dark:text-emerald-400 font-label-sm text-label-sm font-medium shrink-0">
            {tasksPercent}% complete
          </span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span suppressHydrationWarning className="font-headline-lg text-headline-lg text-on-surface dark:text-zinc-100 font-semibold tracking-tight font-display truncate">
            {completedTasksCount} of {totalTasksCount}
          </span>
          <div className="flex items-center gap-1.5 text-outline dark:text-zinc-500 min-w-0">
            <span className="material-symbols-outlined text-[15px] shrink-0 text-secondary dark:text-emerald-400">pending_actions</span>
            <span suppressHydrationWarning className="font-label-sm text-label-sm truncate">
              <span className="text-on-surface-variant dark:text-zinc-300 font-medium">{pendingTodayCount} pending</span> scheduled today
            </span>
          </div>
        </div>
        <div suppressHydrationWarning className="w-full bg-surface-container-high dark:bg-zinc-800/60 h-1.5 rounded-full overflow-hidden mt-1">
          <div suppressHydrationWarning className="bg-secondary dark:bg-emerald-500/80 h-full rounded-full transition-all duration-500" style={{ width: `${tasksPercent}%` }} />
        </div>
      </div>

      {/* Metric 3: Active Projects */}
      <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 dark:border-zinc-800/60 bg-surface-container-lowest dark:bg-zinc-900/50 shadow-xs flex flex-col justify-between gap-3 hover:shadow-sm transition-all min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-label-sm text-label-sm text-outline dark:text-zinc-500 uppercase tracking-wider truncate">Workstreams</span>
          <span className="w-2 h-2 rounded-full bg-secondary dark:bg-emerald-400 shrink-0"></span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-headline-lg text-headline-lg text-on-surface dark:text-zinc-100 font-semibold tracking-tight font-display truncate">
            {activeProjectsCount} Ongoing
          </span>
          <div className="flex items-center gap-1.5 text-outline dark:text-zinc-500 min-w-0">
            <span className="font-label-sm text-label-sm truncate">
              {activeProjectsSummary || 'No active projects'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-label-sm font-label-sm px-2 py-0.5 rounded-md bg-surface-container dark:bg-zinc-800/70 text-on-surface-variant dark:text-zinc-300">
            {completedProjectsCount} completed
          </span>
          <span className="text-label-sm font-label-sm px-2 py-0.5 rounded-md bg-surface-container dark:bg-zinc-800/70 text-on-surface-variant dark:text-zinc-300">
            {backlogProjectsCount} backlog
          </span>
        </div>
      </div>

      {/* Metric 4: Captured Ideas */}
      <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 dark:border-zinc-800/60 bg-surface-container-lowest dark:bg-zinc-900/50 shadow-xs flex flex-col justify-between gap-3 hover:shadow-sm transition-all min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-label-sm text-label-sm text-outline dark:text-zinc-500 uppercase tracking-wider truncate">Incubator</span>
          <span className="material-symbols-outlined text-[16px] text-outline dark:text-zinc-500 shrink-0">lightbulb</span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-headline-lg text-headline-lg text-on-surface dark:text-zinc-100 font-semibold tracking-tight font-display truncate">
            {totalNotesCount} Notes
          </span>
          <div className="flex items-center gap-1.5 text-outline dark:text-zinc-500 min-w-0">
            <span className="material-symbols-outlined text-[15px] shrink-0 text-secondary dark:text-emerald-400">auto_awesome</span>
            <span className="font-label-sm text-label-sm truncate">
              {pinnedSparksCount} pinned sparks
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-outline dark:text-zinc-500 min-w-0">
          <span className="font-label-sm text-label-sm text-on-surface-variant dark:text-zinc-300 font-medium shrink-0">
            {promotedToProjectsCount} promoted
          </span>
          <span className="font-label-sm text-label-sm truncate">to projects</span>
        </div>
      </div>
    </section>
  );
}
