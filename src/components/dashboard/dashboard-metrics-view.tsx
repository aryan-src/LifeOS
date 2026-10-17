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
      <div className="p-5 md:p-6 rounded-2xl border border-stone-200/90 dark:border-stone-800/80 bg-white dark:bg-stone-900/50 shadow-2xs flex flex-col justify-between gap-3 hover:shadow-xs transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Allowance
          </span>
          <span
            suppressHydrationWarning
            className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
          >
            {100 - Math.min(allowanceUsagePercent, 100)}%
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span suppressHydrationWarning className="font-headline-lg text-headline-lg text-stone-900 dark:text-zinc-100 font-semibold tracking-tight font-display">
            {currencySymbol}{formatCurrency(remainingAllowance)}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span className="material-symbols-outlined text-[15px] shrink-0 text-emerald-600 dark:text-emerald-400">format_image_left</span>
            <span suppressHydrationWarning className="text-xs leading-none">
              Safe daily pace: <span className="text-stone-700 dark:text-stone-300 font-medium">{currencySymbol}{formatCurrency(safeDailyBudget)}/day</span>
            </span>
          </div>
        </div>
        <div suppressHydrationWarning className="w-full bg-stone-100 dark:bg-stone-800/80 h-1.5 rounded-full overflow-hidden mt-1">
          <div
            suppressHydrationWarning
            className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(0, 100 - allowanceUsagePercent)}%` }}
          />
        </div>
      </div>

      {/* Metric 2: Daily Tasks */}
      <div className="p-5 md:p-6 rounded-2xl border border-stone-200/90 dark:border-stone-800/80 bg-white dark:bg-stone-900/50 shadow-2xs flex flex-col justify-between gap-3 hover:shadow-xs transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Daily Tasks
          </span>
          <span
            suppressHydrationWarning
            className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60"
          >
            {tasksPercent}%
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span suppressHydrationWarning className="font-headline-lg text-headline-lg text-stone-900 dark:text-zinc-100 font-semibold tracking-tight font-display">
            {completedTasksCount} of {totalTasksCount}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span className="material-symbols-outlined text-[15px] shrink-0 text-emerald-600 dark:text-emerald-400">pending_actions</span>
            <span suppressHydrationWarning className="text-xs leading-none">
              <span className="text-stone-700 dark:text-stone-300 font-medium">{pendingTodayCount} pending</span> scheduled today
            </span>
          </div>
        </div>
        <div suppressHydrationWarning className="w-full bg-stone-100 dark:bg-stone-800/80 h-1.5 rounded-full overflow-hidden mt-1">
          <div
            suppressHydrationWarning
            className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${tasksPercent}%` }}
          />
        </div>
      </div>

      {/* Metric 3: Active Projects */}
      <div className="p-5 md:p-6 rounded-2xl border border-stone-200/90 dark:border-stone-800/80 bg-white dark:bg-stone-900/50 shadow-2xs flex flex-col justify-between gap-3 hover:shadow-xs transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Workstreams
          </span>
          <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60">
            {activeProjectsCount} active
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-headline-lg text-headline-lg text-stone-900 dark:text-zinc-100 font-semibold tracking-tight font-display">
            {activeProjectsCount} Ongoing
          </span>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span className="text-xs leading-none">
              {activeProjectsSummary || 'No active projects'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 font-medium">
            {completedProjectsCount} completed
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 font-medium">
            {backlogProjectsCount} backlog
          </span>
        </div>
      </div>

      {/* Metric 4: Captured Ideas */}
      <div className="p-5 md:p-6 rounded-2xl border border-stone-200/90 dark:border-stone-800/80 bg-white dark:bg-stone-900/50 shadow-2xs flex flex-col justify-between gap-3 hover:shadow-xs transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Incubator
          </span>
          <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60">
            {totalNotesCount} notes
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-headline-lg text-headline-lg text-stone-900 dark:text-zinc-100 font-semibold tracking-tight font-display">
            {totalNotesCount} Notes
          </span>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span className="material-symbols-outlined text-[15px] shrink-0 text-emerald-600 dark:text-emerald-400">auto_awesome</span>
            <span className="text-xs leading-none">
              {pinnedSparksCount} pinned sparks
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500 dark:text-stone-400">
          <span className="text-stone-700 dark:text-stone-300 font-medium shrink-0">
            {promotedToProjectsCount} promoted
          </span>
          <span>to projects</span>
        </div>
      </div>
    </section>
  );
}
