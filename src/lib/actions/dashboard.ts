'use server';

import { getUserProfile } from './profile';
import { getFinancialAnalytics, getTransactions } from './finances';
import { getTasks } from './tasks';
import { getAssignments } from './assignments';
import { getHabits } from './habits';
import { getProjectsWithMetrics } from './projects';
import { getNotes } from './notes';
import { getFallbackFinancialAnalytics } from '@/lib/finances/defaults';
import { getTodayDate } from '@/lib/utils/date';
import type { DashboardWorkspaceTelemetry } from '@/types/dashboard';

/**
 * Unified data access aggregator for the LifeOS Command Center
 * Executes parallel SSR queries with isolated error boundaries and resilient fallbacks.
 */
export async function getDashboardWorkspaceData(): Promise<DashboardWorkspaceTelemetry> {
  const todayStr = getTodayDate();
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentDateFormatted = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;

  const hour = now.getHours();
  let greeting = 'Good day';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else if (hour < 21) greeting = 'Good evening';
  else greeting = 'Good night';

  // Parallel data resolution with catch boundaries
  const [
    profile,
    financialAnalytics,
    tasks,
    assignments,
    habitsRes,
    projects,
    notes,
  ] = await Promise.all([
    getUserProfile().catch(() => null),
    getFinancialAnalytics().catch(() => null),
    getTasks().catch(() => []),
    getAssignments().catch(() => []),
    getHabits().catch(() => ({ habits: [], error: null, isSchemaMissing: false })),
    getProjectsWithMetrics().catch(() => []),
    getNotes().catch(() => []),
  ]);

  const fallbackAnalytics = getFallbackFinancialAnalytics();
  const finances = financialAnalytics || fallbackAnalytics;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const pendingTasks = Math.max(0, totalTasks - completedTasks);
  const overdueCount = tasks.filter((t) => !t.is_completed && t.due_date && t.due_date < todayStr).length;
  const nextTask = tasks.find((t) => !t.is_completed);

  return {
    greeting,
    displayName: profile?.display_name || 'Aryan',
    currentDateFormatted,
    pocketMoney: {
      monthlyAllowance: finances.monthlyAllowance,
      remainingAllowance: finances.remainingAllowance,
      allowanceUsagePercent: finances.allowanceUsagePercent,
      monthlySpent: finances.monthlySpent,
      todaySpent: finances.todaySpent,
      safeDailyBudget: finances.safeDailyBudget,
      daysLeftInMonth: finances.daysLeftInMonth,
      currencySymbol: finances.currencySymbol || '₹',
      weeklyDays: finances.weeklyDays || [],
    },
    focus: {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100,
      overdueCount,
      activeTimerMinutes: 25,
      isTimerRunning: false,
      nextTaskTitle: nextTask ? nextTask.title : null,
      estimatedTimeRemaining: '1h 45m',
    },
    submissions: (assignments || []).slice(0, 3).map((a) => {
      const isToday = a.due_date === todayStr || a.status === 'submission_pending';
      const isOverdue = !!(a.due_date && a.due_date < todayStr && !isToday);
      let daysRemainingLabel = '—';
      if (isToday) {
        daysRemainingLabel = 'Today';
      } else if (a.due_date) {
        const diffDays = Math.ceil((new Date(a.due_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
        daysRemainingLabel = diffDays > 0 ? `${diffDays}d` : 'Overdue';
      }

      return {
        id: a.id,
        title: a.title,
        course: a.project ? a.project.slug.toUpperCase() : 'COURSE',
        dueDate: a.due_date || todayStr,
        daysRemainingLabel,
        isToday,
        isOverdue,
        status: (a.status as 'pending' | 'submitted' | 'graded') || 'pending',
      };
    }),
    habits: (habitsRes?.habits || []).slice(0, 3).map((h) => ({
      id: h.id,
      name: h.title,
      streak: h.streak,
      history: [true, true, true, h.is_completed_today, false, false, false],
      isCompletedToday: h.is_completed_today,
    })),
    projects: (projects || []).slice(0, 3).map((p) => ({
      id: p.id,
      title: p.title,
      status: (p.status as 'active' | 'in_progress' | 'paused' | 'backlog' | 'completed') || 'active',
      completionPercentage: Math.max(0, Math.min(100, p.completion_percentage || 0)),
      nextMilestone: 'Core canvas tokens',
    })),
    ideas: (notes || []).slice(0, 2).map((n) => {
      const tags = Array.isArray(n.tags) ? n.tags : [];
      const firstTag = typeof tags[0] === 'string' ? tags[0] : 'note';
      return {
        id: n.id,
        title: n.title,
        content: n.content || '',
        tag: (firstTag as 'note' | 'draft' | 'idea' | 'research') || 'note',
        dateLabel: 'RECENT',
        isPinned: !!n.is_pinned,
        projectId: n.project_id,
      };
    }),
  };
}
