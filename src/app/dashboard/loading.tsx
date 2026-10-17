import React from 'react';
import { DashboardMetricsSkeleton } from '@/components/dashboard/dashboard-metrics-skeleton';
import { UpcomingSubmissionsSkeleton } from '@/components/dashboard/upcoming-submissions-widget';
import { ProjectsSkeleton } from '@/components/dashboard/projects-quadrant';
import { TasksSkeleton } from '@/components/dashboard/tasks-quadrant';
import { FinancesSkeleton } from '@/components/dashboard/finances-quadrant';
import { NotesSkeleton } from '@/components/dashboard/notes-quadrant';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      <div className="px-4 sm:px-6 md:px-10 py-8 flex flex-col gap-8 max-w-[1360px] mx-auto w-full">
        {/* Header Skeleton */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20 dark:border-zinc-800/60">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-4 w-36 bg-surface-container-high dark:bg-zinc-800 rounded" />
              <div className="h-4 w-24 bg-surface-container-low dark:bg-zinc-800/60 rounded" />
            </div>
            <div className="h-8 w-64 bg-surface-container-high dark:bg-zinc-800 rounded-lg" />
            <div className="h-4 w-96 max-w-full bg-surface-container-low dark:bg-zinc-800/60 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 bg-surface-container-low dark:bg-zinc-800/60 rounded-lg" />
            <div className="h-9 w-28 bg-surface-container-high dark:bg-zinc-800 rounded-lg" />
          </div>
        </header>

        {/* Overview Metric Row */}
        <DashboardMetricsSkeleton />

        {/* Upcoming Submissions */}
        <UpcomingSubmissionsSkeleton />

        {/* 4 Quadrants Bento */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          <div className="w-full h-full rounded-2xl border border-outline-variant/30 dark:border-zinc-800/60 bg-surface-container-lowest/90 dark:bg-zinc-900/50">
            <ProjectsSkeleton />
          </div>
          <div className="w-full h-full rounded-2xl border border-outline-variant/30 dark:border-zinc-800/60 bg-surface-container-lowest/90 dark:bg-zinc-900/50">
            <TasksSkeleton />
          </div>
          <div className="w-full h-full rounded-2xl border border-outline-variant/30 dark:border-zinc-800/60 bg-surface-container-lowest/90 dark:bg-zinc-900/50">
            <FinancesSkeleton />
          </div>
          <div className="w-full h-full rounded-2xl border border-outline-variant/30 dark:border-zinc-800/60 bg-surface-container-lowest/90 dark:bg-zinc-900/50">
            <NotesSkeleton />
          </div>
        </section>
      </div>
    </div>
  );
}
