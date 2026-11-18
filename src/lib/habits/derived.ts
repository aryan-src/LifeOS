import type { HabitWithLog, WeeklyHabitStat } from '@/lib/actions/habits';

export interface HabitSummaryMetrics {
  activeCount: number;
  completedTodayCount: number;
  todayPercent: number;
  bestStreak: number;
  bestStreakHabitTitle: string | null;
  weeklyAvgPercent: number;
  totalWeeklyCompletions: number;
  totalWeeklyOpportunities: number;
}

/**
 * Pure derived-value helper for the Habits screen summary cards.
 */
export function computeHabitSummary(
  habits: HabitWithLog[],
  weeklyStats: WeeklyHabitStat[]
): HabitSummaryMetrics {
  const activeCount = habits.length;
  const completedTodayCount = habits.filter((h) => h.is_completed_today).length;
  const todayPercent =
    activeCount > 0 ? Math.round((completedTodayCount / activeCount) * 100) : 0;

  let bestStreak = 0;
  let bestStreakHabitTitle: string | null = null;
  for (const habit of habits) {
    const streak = Math.max(0, habit.streak || 0);
    if (streak > bestStreak) {
      bestStreak = streak;
      bestStreakHabitTitle = habit.title;
    }
  }

  const totalWeeklyCompletions = weeklyStats.reduce(
    (sum, day) => sum + Math.max(0, day.completedCount || 0),
    0
  );
  const totalWeeklyOpportunities = weeklyStats.reduce(
    (sum, day) => sum + Math.max(0, day.totalHabits || 0),
    0
  );
  const weeklyAvgPercent =
    weeklyStats.length > 0
      ? Math.round(
          weeklyStats.reduce((sum, day) => sum + (day.completionRate || 0), 0) /
            weeklyStats.length
        )
      : 0;

  return {
    activeCount,
    completedTodayCount,
    todayPercent,
    bestStreak,
    bestStreakHabitTitle,
    weeklyAvgPercent,
    totalWeeklyCompletions,
    totalWeeklyOpportunities,
  };
}
