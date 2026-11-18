import { describe, it, expect } from 'vitest';
import { computeHabitSummary } from '../../src/lib/habits/derived';
import type { HabitWithLog, WeeklyHabitStat } from '../../src/lib/actions/habits';

describe('Habits Derived Summary Helper', () => {
  it('computes active count, today completion percentage, best streak, and 7-day average', () => {
    const habits: HabitWithLog[] = [
      {
        id: '1',
        user_id: 'u1',
        title: 'Morning Walk',
        description: null,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
        is_completed_today: true,
        streak: 14,
        weekly_history: {},
      },
      {
        id: '2',
        user_id: 'u1',
        title: 'Read 20 Pages',
        description: null,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
        is_completed_today: false,
        streak: 5,
        weekly_history: {},
      },
    ];

    const weekly: WeeklyHabitStat[] = [
      { date: '2026-11-12', dayOfWeek: 'Thu', completedCount: 2, totalHabits: 2, completionRate: 100, isToday: false },
      { date: '2026-11-13', dayOfWeek: 'Fri', completedCount: 1, totalHabits: 2, completionRate: 50, isToday: true },
    ];

    const summary = computeHabitSummary(habits, weekly);
    expect(summary.activeCount).toBe(2);
    expect(summary.completedTodayCount).toBe(1);
    expect(summary.todayPercent).toBe(50);
    expect(summary.bestStreak).toBe(14);
    expect(summary.bestStreakHabitTitle).toBe('Morning Walk');
    expect(summary.weeklyAvgPercent).toBe(75);
    expect(summary.totalWeeklyCompletions).toBe(3);
    expect(summary.totalWeeklyOpportunities).toBe(4);
  });

  it('returns safe zero metrics when no habits exist', () => {
    const summary = computeHabitSummary([], []);
    expect(summary).toEqual({
      activeCount: 0,
      completedTodayCount: 0,
      todayPercent: 0,
      bestStreak: 0,
      bestStreakHabitTitle: null,
      weeklyAvgPercent: 0,
      totalWeeklyCompletions: 0,
      totalWeeklyOpportunities: 0,
    });
  });
});
