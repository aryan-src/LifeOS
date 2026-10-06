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
      <div className="px-space-md md:px-margin py-space-lg flex flex-col gap-space-lg max-w-[1280px] mx-auto w-full">
        {/* Header Section: Understated Notion Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-sm">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-outline">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">compass_calibration</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">LifeOS Command Engine</span>
              <span className="text-outline-variant">•</span>
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span> Telemetry Sync Active
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-medium">Global Command Center</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Real-time telemetry across projects, tasks, finances, and ideas. Balanced for cognitive clarity and calm focus.
            </p>
          </div>
          <div className="flex items-center gap-space-sm self-start md:self-auto shrink-0">
            <div className="hidden sm:flex flex-col items-end mr-1 text-right">
              <span className="font-label-sm text-label-sm text-outline">Active telemetry</span>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">Synced Cloud</span>
            </div>
            <Link
              href="/projects"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Workspaces</span>
            </Link>
            <Link
              href="/tasks"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary text-on-primary hover:opacity-90 font-label-md text-label-md transition-opacity shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Quick Add</span>
            </Link>
          </div>
        </header>

        {/* Top Overview Metric Row (4 Notion-style breathing stat cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Metric 1: Monthly Allowance */}
          <div className="p-space-md rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Allowance Balance</span>
              <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-medium">
                {100 - Math.min(analytics.allowanceUsagePercent, 100)}% remaining
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span suppressHydrationWarning className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight font-display">
                ₹{formatCurrency(analytics.remainingAllowance)}
              </span>
              <div className="flex items-center gap-1.5 text-outline">
                <span className="material-symbols-outlined text-[14px]">format_image_left</span>
                <span suppressHydrationWarning className="font-label-sm text-label-sm">
                  Safe daily pace: <span className="text-on-surface-variant font-medium">₹{formatCurrency(analytics.safeDailyBudget)}/day</span>
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-1">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, 100 - analytics.allowanceUsagePercent)}%` }}
              />
            </div>
          </div>

          {/* Metric 2: Daily Tasks */}
          <div className="p-space-md rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Daily Tasks</span>
              <span className="font-label-sm text-label-sm text-secondary font-medium">{tasksPercent}% complete</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight font-display">
                {completedTasksCount} of {totalTasksCount}
              </span>
              <div className="flex items-center gap-1.5 text-outline">
                <span className="material-symbols-outlined text-[14px] text-secondary">pending_actions</span>
                <span className="font-label-sm text-label-sm">
                  <span className="text-on-surface-variant font-medium">{pendingTodayCount} pending</span> tasks scheduled for today
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-1">
              <div className="bg-secondary h-full rounded-full" style={{ width: `${tasksPercent}%` }} />
            </div>
          </div>

          {/* Metric 3: Active Projects */}
          <div className="p-space-md rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Workstreams</span>
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight font-display">
                {activeProjects.length} Ongoing
              </span>
              <div className="flex items-center gap-1.5 text-outline truncate">
                <span className="font-label-sm text-label-sm truncate">
                  {activeProjects.map((p) => p.title).slice(0, 3).join(' • ') || 'No active projects'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-label-sm font-label-sm px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                {projects.filter((p) => p.status === 'completed').length} completed
              </span>
              <span className="text-label-sm font-label-sm px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                {projects.filter((p) => p.status === 'backlog').length} backlog
              </span>
            </div>
          </div>

          {/* Metric 4: Captured Ideas */}
          <div className="p-space-md rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Incubator</span>
              <span className="material-symbols-outlined text-[16px] text-outline">lightbulb</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight font-display">
                {notes.length} Notes
              </span>
              <div className="flex items-center gap-1.5 text-outline">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                <span className="font-label-sm text-label-sm">
                  {notes.filter((n) => n.is_pinned).length} pinned sparks
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1 text-outline">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                {notes.filter((n) => n.project_id).length} promoted
              </span>
              <span className="font-label-sm text-label-sm">to projects</span>
            </div>
          </div>
        </section>

        {/* Main Workspace Bento: The 4 Minimalist Breathing Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* Card 1: Active Projects (Span 6) */}
          <div className="lg:col-span-6">
            <Suspense fallback={<ProjectsSkeleton />}>
              <ProjectsQuadrant />
            </Suspense>
          </div>

          {/* Card 2: Today's Focus (Span 6) */}
          <div className="lg:col-span-6">
            <Suspense fallback={<TasksSkeleton />}>
              <TasksQuadrant />
            </Suspense>
          </div>

          {/* Card 3: Pocket Money Tracker (Span 6) */}
          <div className="lg:col-span-6">
            <Suspense fallback={<FinancesSkeleton />}>
              <FinancesQuadrant />
            </Suspense>
          </div>

          {/* Card 4: Recent Ideas & Scratchpad (Span 6) */}
          <div className="lg:col-span-6">
            <Suspense fallback={<NotesSkeleton />}>
              <NotesQuadrant />
            </Suspense>
          </div>
        </section>

        {/* Global Workspace Micro-Footer */}
        <footer className="pt-space-md pb-space-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-outline font-label-sm text-label-sm border-t border-surface-container-high/60 mt-4">
          <div className="flex items-center gap-3">
            <span>LifeOS v3.8.4</span>
            <span>•</span>
            <span>Stone Edition</span>
            <span>•</span>
            <span>Notion-inspired Quiet Utility</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/finances" className="hover:text-on-surface transition-colors">Telemetry Specs</Link>
            <span className="hover:text-on-surface transition-colors">Keyboard Shortcuts (⌘K)</span>
            <Link href="/notes" className="hover:text-on-surface transition-colors">Scratchpad Vault</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
