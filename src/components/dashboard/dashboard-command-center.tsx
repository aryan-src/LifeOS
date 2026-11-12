import React from 'react';
import { getUserProfile } from '@/lib/actions/profile';
import { getHabits } from '@/lib/actions/habits';
import { getProjectsWithMetrics } from '@/lib/actions/projects';
import { getNotes } from '@/lib/actions/notes';
import { getAssignments } from '@/lib/actions/assignments';
import { getFinancialAnalytics } from '@/lib/actions/finances';
import { getTasks } from '@/lib/actions/tasks';
import { getTodayDate } from '@/lib/utils/date';
import { Variant3DashboardView } from './variant3-dashboard-view';

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export async function DashboardCommandCenter() {
  const todayStr = getTodayDate();

  const [profile, habitsRes, projects, notes, assignments, financialAnalytics, todayTasks] =
    await Promise.all([
      getUserProfile().catch(() => null),
      getHabits().catch(() => ({ habits: [], error: null, isSchemaMissing: false })),
      getProjectsWithMetrics().catch(() => []),
      getNotes().catch(() => []),
      getAssignments().catch(() => []),
      getFinancialAnalytics().catch(() => null),
      getTasks(todayStr).catch(() => []),
    ]);

  const displayName = profile?.display_name || 'Aryan';

  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = dayNames[now.getDay()];
  const dateFormatted = `${now.getDate()} ${months[now.getMonth()]}`;
  const weekNumber = getWeekNumber(now);

  const hour = now.getHours();
  let greetingTime = 'Good morning';
  if (hour >= 12 && hour < 17) greetingTime = 'Good afternoon';
  else if (hour >= 17) greetingTime = 'Good evening';

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
    />
  );
}
