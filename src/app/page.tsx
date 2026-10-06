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
import { getFinancialAnalytics } from '@/lib/actions/finances';
import { getTasks } from '@/lib/actions/tasks';
import { getProjectsWithMetrics } from '@/lib/actions/projects';
import { getNotes } from '@/lib/actions/notes';
import { formatCurrency } from '@/lib/utils/format';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [analytics, tasks, projects, notes] = await Promise.all([
    getFinancialAnalytics(),
    getTasks(),
    getProjectsWithMetrics(),
    getNotes(),
  ]);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const completedTasksCount = tasks.filter((t) => t.is_completed).length;
  const totalTasksCount = tasks.length;
  const tasksPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const pendingTodayCount = tasks.filter((t) => !t.is_completed && (!t.due_date || t.due_date <= new Date().toISOString().split('T')[0])).length;

  return (
    <div className="flex flex-col w-full">
      <div className="px-4 sm:px-6 md:px-10 py-8 flex flex-col gap-8 max-w-[1360px] mx-auto w-full">
        {/* Header Section: Understated Notion Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 text-outline flex-wrap">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">compass_calibration</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">LifeOS Command Engine</span>
              <span className="text-outline-variant">•</span>
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span>
                <span>Telemetry Sync Active</span>
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-medium">
              Global Command Center
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
              Real-time telemetry across projects, tasks, finances, and ideas. Balanced for cognitive clarity and calm focus.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0 flex-wrap">
            <div className="hidden sm:flex flex-col items-end mr-1 text-right">
              <span className="font-label-sm text-label-sm text-outline">Active telemetry</span>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">Synced Cloud</span>
            </div>
            <Link
              href="/projects"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-outline">tune</span>
              <span>Workspaces</span>
            </Link>
            <Link
              href="/tasks"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 font-label-md text-label-md transition-opacity shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-on-primary">add</span>
              <span>Quick Add</span>
            </Link>
          </div>
        </header>

        {/* Top Overview Metric Row (4 Notion-style breathing stat cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {/* Metric 1: Monthly Allowance */}
          <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs flex flex-col justify-between gap-3 hover:shadow-sm transition-shadow min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider truncate">Allowance Balance</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-medium shrink-0">
                {100 - Math.min(analytics.allowanceUsagePercent, 100)}% remaining
              </span>
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span suppressHydrationWarning className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight font-display truncate">
                ₹{formatCurrency(analytics.remainingAllowance)}
              </span>
              <div className="flex items-center gap-1.5 text-outline min-w-0">
                <span className="material-symbols-outlined text-[15px] shrink-0 text-secondary">format_image_left</span>
                <span suppressHydrationWarning className="font-label-sm text-label-sm truncate">
                  Safe daily pace: <span className="text-on-surface-variant font-medium">₹{formatCurrency(analytics.safeDailyBudget)}/day</span>
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, 100 - analytics.allowanceUsagePercent)}%` }}
              />
            </div>
          </div>

          {/* Metric 2: Daily Tasks */}
          <div className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs flex flex-col justify-between gap-3 hover:shadow-sm transition-shadow min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider truncate">Daily Tasks</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm font-medium shrink-0">
                {tasksPercent}% complete
              </span>
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight font-display truncate">
                {completedTasksCount} of {totalTasksCount}
              </span>
              <div className="flex items-center gap-1.5 text-outline min-w-0">
                <span className="material-symbols-outlined text-[15px] shrink-0 text-secondary">pending_actions</span>
                <span className="font-label-sm text-label-sm truncate">
                  <span className="text-on-surface-variant font-medium">{pendingTodayCount} pending</span> scheduled today
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${tasksPercent}%` }} />
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
                {activeProjects.length} Ongoing
              </span>
              <div className="flex items-center gap-1.5 text-outline min-w-0">
                <span className="font-label-sm text-label-sm truncate">
                  {activeProjects.map((p) => p.title).slice(0, 3).join(' • ') || 'No active projects'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-label-sm font-label-sm px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
                {projects.filter((p) => p.status === 'completed').length} completed
              </span>
              <span className="text-label-sm font-label-sm px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
                {projects.filter((p) => p.status === 'backlog').length} backlog
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
                {notes.length} Notes
              </span>
              <div className="flex items-center gap-1.5 text-outline min-w-0">
                <span className="material-symbols-outlined text-[15px] shrink-0 text-secondary">auto_awesome</span>
                <span className="font-label-sm text-label-sm truncate">
                  {notes.filter((n) => n.is_pinned).length} pinned sparks
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1 text-outline min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium shrink-0">
                {notes.filter((n) => n.project_id).length} promoted
              </span>
              <span className="font-label-sm text-label-sm truncate">to projects</span>
            </div>
          </div>
        </section>

        {/* Main Workspace Bento: The 4 Minimalist Breathing Cards */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Active Projects */}
          <div className="w-full min-w-0">
            <Suspense fallback={<ProjectsSkeleton />}>
              <ProjectsQuadrant />
            </Suspense>
          </div>

          {/* Card 2: Today's Focus */}
          <div className="w-full min-w-0">
            <Suspense fallback={<TasksSkeleton />}>
              <TasksQuadrant />
            </Suspense>
          </div>

          {/* Card 3: Pocket Money Tracker */}
          <div className="w-full min-w-0">
            <Suspense fallback={<FinancesSkeleton />}>
              <FinancesQuadrant />
            </Suspense>
          </div>

          {/* Card 4: Recent Ideas & Scratchpad */}
          <div className="w-full min-w-0">
            <Suspense fallback={<NotesSkeleton />}>
              <NotesQuadrant />
            </Suspense>
          </div>
        </section>

        {/* Global Workspace Micro-Footer */}
        <footer className="pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-outline font-label-sm text-label-sm border-t border-outline-variant/20 mt-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span>LifeOS v3.8.4</span>
            <span>•</span>
            <span>Stone Edition</span>
            <span>•</span>
            <span>Notion-inspired Quiet Utility</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/finances" className="hover:text-on-surface transition-colors">Telemetry Specs</Link>
            <span className="hover:text-on-surface transition-colors">Keyboard Shortcuts (⌘K)</span>
            <Link href="/notes" className="hover:text-on-surface transition-colors">Scratchpad Vault</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
