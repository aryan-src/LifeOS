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
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-stone-200/80 dark:border-stone-800/80">
          <div className="flex flex-col min-w-0">
            <div className="h-3.5 w-24 bg-stone-200 dark:bg-stone-800 rounded mb-1.5" />
            <div className="h-8 w-56 sm:w-64 bg-stone-200 dark:bg-stone-800 rounded-lg" />
            <div className="h-4 w-80 max-w-full bg-stone-200/70 dark:bg-stone-800/60 rounded mt-1" />
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <div className="h-10 w-32 bg-stone-200/80 dark:bg-stone-800/60 rounded-xl" />
            <div className="h-10 w-28 bg-stone-200 dark:bg-stone-800 rounded-xl" />
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
