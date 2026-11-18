import React from 'react';
import { getUserProfile } from '@/lib/actions/profile';
import { getHabits } from '@/lib/actions/habits';
import { getProjectsWithMetrics } from '@/lib/actions/projects';
import { getNotes } from '@/lib/actions/notes';
import { getAssignments } from '@/lib/actions/assignments';
import { getFinancialAnalytics } from '@/lib/actions/finances';
import { getTasks } from '@/lib/actions/tasks';
import { getDailyLoopDashboardData } from '@/lib/actions/daily-loop';
import { getTodayCardMode, getUserLocalDate } from '@/lib/daily-loop/business-logic';
import { Variant3DashboardView } from './variant3-dashboard-view';

function getWeekNumberFromDateString(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export async function DashboardCommandCenter() {
  const profile = await getUserProfile().catch(() => null);
  const userTimezone = profile?.timezone || 'UTC';
  const now = new Date();
  const todayStr = getUserLocalDate(now, userTimezone);

  const [
    habitsRes,
    projects,
    notes,
    assignments,
    financialAnalytics,
    todayTasks,
    dailyLoopData,
  ] = await Promise.all([
    getHabits().catch(() => ({ habits: [], error: null, isSchemaMissing: false })),
    getProjectsWithMetrics().catch(() => []),
    getNotes().catch(() => []),
    getAssignments().catch(() => []),
    getFinancialAnalytics().catch(() => null),
    getTasks(todayStr).catch(() => []),
    getDailyLoopDashboardData().catch(() => null),
  ]);

  const displayName = profile?.display_name || 'Aryan';

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m, d] = todayStr.split('-').map(Number);
  const utcCalendarDate = new Date(Date.UTC(y, m - 1, d));
  const dayName = dayNames[utcCalendarDate.getUTCDay()];
  const dateFormatted = `${d} ${months[m - 1] || 'Nov'}`;
  const weekNumber = getWeekNumberFromDateString(todayStr);

  const mode = getTodayCardMode(now, userTimezone);
  const greetingTime =
    mode === 'morning'
      ? 'Good morning'
      : mode === 'daytime'
      ? 'Good afternoon'
      : 'Good evening';

  return (
    <Variant3DashboardView
      displayName={displayName}
      greetingTime={greetingTime}
      dayName={dayName}
      dateFormatted={dateFormatted}
      weekNumber={weekNumber}
      initialHabits={habitsRes?.habits || []}
      initialProjects={projects || []}
      initialNotes={notes || []}
      initialAssignments={assignments || []}
      financialAnalytics={financialAnalytics}
      todayTasks={todayTasks || []}
      dailyLoopData={dailyLoopData}
    />
  );
}
