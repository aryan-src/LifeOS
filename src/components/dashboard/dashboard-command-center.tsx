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

export async function DashboardCommandCenter() {
  const profile = await getUserProfile();

  return (
    <div className="flex flex-col w-full">
      <div className="px-4 sm:px-6 md:px-10 py-8 flex flex-col gap-8 max-w-[1360px] mx-auto w-full">
        {/* Header Section: Understated Notion Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20 dark:border-zinc-800/60">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 text-outline dark:text-zinc-500 flex-wrap">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant dark:text-zinc-400 shrink-0">
                compass_calibration
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline dark:text-zinc-500">
                LifeOS Command Engine
              </span>
              <span className="text-outline-variant dark:text-zinc-700">•</span>
              <span className="font-label-sm text-label-sm text-secondary dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary dark:bg-emerald-400 inline-block"></span>
                <span>Telemetry Sync Active</span>
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-zinc-100 tracking-tight font-medium">
              Welcome, {profile?.display_name || 'Student'}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant dark:text-zinc-400 max-w-2xl leading-relaxed">
              Academics, tasks, finances, and notes—in one calm workspace.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0 flex-wrap">
            <div className="hidden sm:flex flex-col items-end mr-1 text-right">
              <span suppressHydrationWarning className="font-label-sm text-label-sm text-outline dark:text-zinc-500">
                {formatCalendarDate(getTodayDate(), 'header')}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant dark:text-zinc-400 font-medium">IST Active</span>
            </div>
            <Link
              href="/projects"
              prefetch={true}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-outline-variant/30 dark:border-zinc-800/60 bg-surface-container-lowest dark:bg-zinc-900/60 hover:bg-surface-container dark:hover:bg-zinc-800/60 text-on-surface dark:text-zinc-200 font-label-md text-label-md transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-outline dark:text-zinc-500">tune</span>
              <span>Workspaces</span>
            </Link>
            <Link
              href="/tasks"
              prefetch={true}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary dark:bg-zinc-100 text-on-primary dark:text-zinc-900 hover:opacity-90 dark:hover:bg-zinc-200 font-label-md text-label-md transition-opacity shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-on-primary dark:text-zinc-900">add</span>
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
