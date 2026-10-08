import React from 'react';
import { getFinancialAnalytics, type FinancialAnalytics } from '@/lib/actions/finances';
import { getFallbackFinancialAnalytics } from '@/lib/finances/defaults';
import { getTasks, type TaskWithProject } from '@/lib/actions/tasks';
import { getProjectsWithMetrics, type ProjectWithMetrics } from '@/lib/actions/projects';
import { getNotes, type NoteWithProject } from '@/lib/actions/notes';
import { formatCurrency } from '@/lib/utils/format';
import { getTodayDate } from '@/lib/utils/date';

export async function DashboardMetrics() {
  let analytics: FinancialAnalytics = getFallbackFinancialAnalytics();
  let tasks: TaskWithProject[] = [];
  let projects: ProjectWithMetrics[] = [];
  let notes: NoteWithProject[] = [];

  try {
    const results = await Promise.all([
      getFinancialAnalytics(),
      getTasks(),
      getProjectsWithMetrics(),
      getNotes(),
    ]);
    analytics = results[0] || analytics;
    tasks = Array.isArray(results[1]) ? results[1] : [];
    projects = Array.isArray(results[2]) ? results[2] : [];
    notes = Array.isArray(results[3]) ? results[3] : [];
  } catch (err) {
    console.error('Error fetching dashboard metrics data:', err);
  }

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeNotes = Array.isArray(notes) ? notes : [];

  const activeProjects = safeProjects.filter((p) => p?.status === 'active');
  const completedTasksCount = safeTasks.filter((t) => t?.is_completed).length;
  const totalTasksCount = safeTasks.length;
  const tasksPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const pendingTodayCount = safeTasks.filter((t) => !t?.is_completed && (!t?.due_date || t.due_date <= getTodayDate())).length;

  return (
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
            {analytics.currencySymbol}{formatCurrency(analytics.remainingAllowance)}
          </span>
          <div className="flex items-center gap-1.5 text-outline min-w-0">
            <span className="material-symbols-outlined text-[15px] shrink-0 text-secondary">format_image_left</span>
            <span suppressHydrationWarning className="font-label-sm text-label-sm truncate">
              Safe daily pace: <span className="text-on-surface-variant font-medium">{analytics.currencySymbol}{formatCurrency(analytics.safeDailyBudget)}/day</span>
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
              {activeProjects.map((p) => p?.title || 'Project').slice(0, 3).join(' • ') || 'No active projects'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-label-sm font-label-sm px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
            {safeProjects.filter((p) => p?.status === 'completed').length} completed
          </span>
          <span className="text-label-sm font-label-sm px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
            {safeProjects.filter((p) => p?.status === 'backlog').length} backlog
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
            {safeNotes.length} Notes
          </span>
          <div className="flex items-center gap-1.5 text-outline min-w-0">
            <span className="material-symbols-outlined text-[15px] shrink-0 text-secondary">auto_awesome</span>
            <span className="font-label-sm text-label-sm truncate">
              {safeNotes.filter((n) => n?.is_pinned).length} pinned sparks
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-outline min-w-0">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium shrink-0">
            {safeNotes.filter((n) => n?.project_id).length} promoted
          </span>
          <span className="font-label-sm text-label-sm truncate">to projects</span>
        </div>
      </div>
    </section>
  );
}

export function DashboardMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs animate-pulse h-36 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <div className="h-3 w-24 bg-surface-container-high rounded" />
            <div className="h-4 w-12 bg-surface-container-high rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-32 bg-surface-container-high rounded" />
            <div className="h-3 w-40 bg-surface-container-low rounded" />
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full" />
        </div>
      ))}
    </div>
  );
}
