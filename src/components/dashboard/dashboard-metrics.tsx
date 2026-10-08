import React from 'react';
import { getFinancialAnalytics, type FinancialAnalytics } from '@/lib/actions/finances';
import { getFallbackFinancialAnalytics } from '@/lib/finances/defaults';
import { getTasks, type TaskWithProject } from '@/lib/actions/tasks';
import { getProjectsWithMetrics, type ProjectWithMetrics } from '@/lib/actions/projects';
import { getNotes, type NoteWithProject } from '@/lib/actions/notes';
import { getTodayDate } from '@/lib/utils/date';
import { DashboardMetricsClient } from './dashboard-metrics-client';
import { DashboardMetricsSkeleton } from './dashboard-metrics-skeleton';

export { DashboardMetricsSkeleton };

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
    <DashboardMetricsClient
      currencySymbol={analytics.currencySymbol || '₹'}
      remainingAllowance={analytics.remainingAllowance}
      safeDailyBudget={analytics.safeDailyBudget}
      allowanceUsagePercent={analytics.allowanceUsagePercent}
      completedTasksCount={completedTasksCount}
      totalTasksCount={totalTasksCount}
      tasksPercent={tasksPercent}
      pendingTodayCount={pendingTodayCount}
      activeProjectsCount={activeProjects.length}
      activeProjectsSummary={activeProjects.map((p) => p?.title || 'Project').slice(0, 3).join(' • ')}
      completedProjectsCount={safeProjects.filter((p) => p?.status === 'completed').length}
      backlogProjectsCount={safeProjects.filter((p) => p?.status === 'backlog').length}
      totalNotesCount={safeNotes.length}
      pinnedSparksCount={safeNotes.filter((n) => n?.is_pinned).length}
      promotedToProjectsCount={safeNotes.filter((n) => n?.project_id).length}
    />
  );
}
