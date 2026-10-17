import React, { Suspense } from 'react';
import {
  ProjectsQuadrant,
  ProjectsSkeleton,
} from '@/components/dashboard/projects-quadrant';
import {
  TasksQuadrant,
  TasksSkeleton,
} from '@/components/dashboard/tasks-quadrant';
import {
  FinancesQuadrant,
  FinancesSkeleton,
} from '@/components/dashboard/finances-quadrant';
import {
  NotesQuadrant,
  NotesSkeleton,
} from '@/components/dashboard/notes-quadrant';
import {
  DashboardMetrics,
  DashboardMetricsSkeleton,
} from '@/components/dashboard/dashboard-metrics';
import {
  UpcomingSubmissionsWidget,
  UpcomingSubmissionsSkeleton,
} from '@/components/dashboard/upcoming-submissions-widget';
import { getUserProfile } from '@/lib/actions/profile';
import { formatCalendarDate, getTodayDate } from '@/lib/utils/date';
import { GlowCard } from '@/components/ui/spotlight-card';
import Link from 'next/link';
import { SlidersHorizontal, Plus } from 'lucide-react';

export async function DashboardCommandCenter() {
  const profile = await getUserProfile();

  return (
    <div className="flex flex-col w-full">
      <div className="px-4 sm:px-6 md:px-10 py-8 flex flex-col gap-8 max-w-[1360px] mx-auto w-full">
        {/* Header Section: Calm Editorial Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 border-b border-stone-200/80 dark:border-stone-800/80">
          <div className="flex flex-col min-w-0">
            <span
              suppressHydrationWarning
              className="text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5"
            >
              {formatCalendarDate(getTodayDate(), 'header')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Welcome, {profile?.display_name || 'Student'}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Academics, tasks, finances, and notes—in one calm workspace.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <Link
              href="/projects"
              prefetch={true}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:bg-stone-50 dark:hover:bg-stone-800/70 hover:border-stone-300 transition-all duration-150 font-sans tracking-tight"
            >
              <SlidersHorizontal className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              <span>Workspaces</span>
            </Link>
            <Link
              href="/tasks"
              prefetch={true}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 shadow-xs hover:bg-stone-800 dark:hover:bg-white active:scale-[0.99] transition-all duration-150 font-sans tracking-tight"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add</span>
            </Link>
          </div>
        </header>

        {/* Top Overview Metric Row (4 Notion-style breathing stat cards streamed) */}
        <Suspense fallback={<DashboardMetricsSkeleton />}>
          <DashboardMetrics />
        </Suspense>

        {/* Upcoming Submissions & Action Alerts */}
        <Suspense fallback={<UpcomingSubmissionsSkeleton />}>
          <UpcomingSubmissionsWidget />
        </Suspense>

        {/* Main Workspace Bento: The 4 Minimalist Breathing Cards with Interactive Spotlight Glow */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Active Projects (Blue Spotlight) */}
          <div className="w-full min-w-0 h-full">
            <GlowCard
              customSize
              glowColor="blue"
              className="w-full h-full !p-0 !gap-0 !grid-rows-none !shadow-xs rounded-2xl border border-outline-variant/30 dark:!border-zinc-800/60 !bg-surface-container-lowest/90 dark:!bg-zinc-900/50 transition-all"
            >
              <Suspense fallback={<ProjectsSkeleton />}>
                <ProjectsQuadrant />
              </Suspense>
            </GlowCard>
          </div>

          {/* Card 2: Today's Focus (Orange Spotlight) */}
          <div className="w-full min-w-0 h-full">
            <GlowCard
              customSize
              glowColor="orange"
              className="w-full h-full !p-0 !gap-0 !grid-rows-none !shadow-xs rounded-2xl border border-outline-variant/30 dark:!border-zinc-800/60 !bg-surface-container-lowest/90 dark:!bg-zinc-900/50 transition-all"
            >
              <Suspense fallback={<TasksSkeleton />}>
                <TasksQuadrant />
              </Suspense>
            </GlowCard>
          </div>

          {/* Card 3: Pocket Money Tracker (Green Spotlight) */}
          <div className="w-full min-w-0 h-full">
            <GlowCard
              customSize
              glowColor="green"
              className="w-full h-full !p-0 !gap-0 !grid-rows-none !shadow-xs rounded-2xl border border-outline-variant/30 dark:!border-zinc-800/60 !bg-surface-container-lowest/90 dark:!bg-zinc-900/50 transition-all"
            >
              <Suspense fallback={<FinancesSkeleton />}>
                <FinancesQuadrant />
              </Suspense>
            </GlowCard>
          </div>

          {/* Card 4: Recent Ideas & Scratchpad (Purple Spotlight) */}
          <div className="w-full min-w-0 h-full">
            <GlowCard
              customSize
              glowColor="purple"
              className="w-full h-full !p-0 !gap-0 !grid-rows-none !shadow-xs rounded-2xl border border-outline-variant/30 dark:!border-zinc-800/60 !bg-surface-container-lowest/90 dark:!bg-zinc-900/50 transition-all"
            >
              <Suspense fallback={<NotesSkeleton />}>
                <NotesQuadrant />
              </Suspense>
            </GlowCard>
          </div>
        </section>
      </div>
    </div>
  );
}
