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
import { formatCalendarMetaFromDateString } from '@/lib/daily-loop/dashboard-derived';
import { Variant3DashboardView } from './variant3-dashboard-view';

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

  const displayName = profile?.display_name?.trim() || 'Student';
  const calendarMeta = formatCalendarMetaFromDateString(todayStr);

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
      dayName={calendarMeta.dayName}
      dateFormatted={calendarMeta.dateFormatted}
      weekNumber={calendarMeta.weekNumber}
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
