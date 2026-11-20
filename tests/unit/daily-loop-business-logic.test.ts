import { describe, it, expect } from 'vitest';
import {
  addDaysToDateString,
  calculateHabitStreakFromDates,
  getUserLocalDate,
  getUserLocalHour,
  getTodayCardMode,
  isFocusMode,
  isFocusSessionQualified,
  isDailyMinimumMet,
  getDailyMinimumChecklist,
  isDateEditableForStreak,
  calculateStreak,
  getNextMilestone,
  formatStreakBadge,
  calculateLifeScore,
  calculateFocusInsights,
  formatHourTo12h,
} from '@/lib/daily-loop/business-logic';
import { upsertDailyCheckInSchema } from '@/lib/validations';
import type { DailyRecord, FocusSession, StreakFreezeLog, MoodRating } from '@/lib/daily-loop/types';

describe('Daily Loop Business Logic — Timezone & Day Boundaries', () => {
  it('correctly calculates local date and morning mode across Asia/Kolkata midnight boundary', () => {
    // 2026-11-17 18:35:00 UTC is 2026-11-18 00:05:00 in Asia/Kolkata (+05:30)
    const utcMidnightEdge = new Date('2026-11-17T18:35:00Z');

    const kolkataDate = getUserLocalDate(utcMidnightEdge, 'Asia/Kolkata');
    const kolkataHour = getUserLocalHour(utcMidnightEdge, 'Asia/Kolkata');
    const kolkataMode = getTodayCardMode(utcMidnightEdge, 'Asia/Kolkata');

    expect(kolkataDate).toBe('2026-11-18');
    expect(kolkataHour).toBe(0);
    // Midnight (00:05) belongs to the new calendar day, so it is morning
    expect(kolkataMode).toBe('morning');

    // In New York (UTC-5), the same moment is 2026-11-17 at 13:35 (Daytime)
    const nyDate = getUserLocalDate(utcMidnightEdge, 'America/New_York');
    const nyHour = getUserLocalHour(utcMidnightEdge, 'America/New_York');
    const nyMode = getTodayCardMode(utcMidnightEdge, 'America/New_York');

    expect(nyDate).toBe('2026-11-17');
    expect(nyHour).toBe(13);
    expect(nyMode).toBe('daytime');
  });

  it('determines Today Card modes strictly aligned with calendar day boundaries (00:00-11:59 / 12:00-17:59 / 18:00-23:59)', () => {
    // 00:00 -> morning
    expect(getTodayCardMode(new Date('2026-11-17T00:00:00Z'), 'UTC')).toBe('morning');
    // 08:00 -> morning
    expect(getTodayCardMode(new Date('2026-11-17T08:00:00Z'), 'UTC')).toBe('morning');
    // 11:59 -> morning
    expect(getTodayCardMode(new Date('2026-11-17T11:59:00Z'), 'UTC')).toBe('morning');

    // 12:00 -> daytime
    expect(getTodayCardMode(new Date('2026-11-17T12:00:00Z'), 'UTC')).toBe('daytime');
    // 17:59 -> daytime
    expect(getTodayCardMode(new Date('2026-11-17T17:59:00Z'), 'UTC')).toBe('daytime');

    // 18:00 -> evening
    expect(getTodayCardMode(new Date('2026-11-17T18:00:00Z'), 'UTC')).toBe('evening');
    // 23:59 -> evening
    expect(getTodayCardMode(new Date('2026-11-17T23:59:00Z'), 'UTC')).toBe('evening');
  });
});

describe('Focus Mode & Session Qualification', () => {
  it('distinguishes focus modes from break modes', () => {
    expect(isFocusMode('pomodoro')).toBe(true);
    expect(isFocusMode('deep-work')).toBe(true);
    expect(isFocusMode('stopwatch')).toBe(true);
    expect(isFocusMode('short-break')).toBe(false);
    expect(isFocusMode('long-break')).toBe(false);
  });

  it('qualifies completed presets (15m, 25m, 50m)', () => {
    // 15m preset completed (900s)
    expect(
      isFocusSessionQualified({
        duration_seconds: 900,
        mode: 'pomodoro',
        target_duration_seconds: 900,
      })
    ).toBe(true);

    // 25m preset completed (1500s)
    expect(
      isFocusSessionQualified({
        duration_seconds: 1500,
        mode: 'pomodoro',
        target_duration_seconds: 1500,
      })
    ).toBe(true);

    // 50m preset completed (3000s)
    expect(
      isFocusSessionQualified({
        duration_seconds: 3000,
        mode: 'deep-work',
        target_duration_seconds: 3000,
      })
    ).toBe(true);
  });

  it('early ended sessions qualify only if at least 10 minutes elapsed', () => {
    // 25m preset ended early at 12 minutes (720s) -> qualifies (>= 10m)
    expect(
      isFocusSessionQualified({
        duration_seconds: 720,
        mode: 'pomodoro',
        target_duration_seconds: 1500,
      })
    ).toBe(true);

    // 25m preset ended early at 8 minutes (480s) -> does not qualify (< 10m)
    expect(
      isFocusSessionQualified({
        duration_seconds: 480,
        mode: 'pomodoro',
        target_duration_seconds: 1500,
      })
    ).toBe(false);
  });

  it('break modes never qualify as focus sessions even if completed', () => {
    expect(
      isFocusSessionQualified({
        duration_seconds: 300,
        mode: 'short-break',
        target_duration_seconds: 300,
        completed_normally: true,
      })
    ).toBe(false);

    expect(
      isFocusSessionQualified({
        duration_seconds: 900,
        mode: 'long-break',
        target_duration_seconds: 900,
        completed_normally: true,
      })
    ).toBe(false);
  });
});

describe('Daily Minimum Qualification (2 of 3 Criteria)', () => {
  it('qualifies when at least 2 of 3 items (focus session, habit, expense) are complete', () => {
    // Focus + Habit
    const focusAndHabit: DailyRecord = {
      date: '2026-11-17',
      focusSessionsCompleted: 1,
      habitsCompleted: 1,
      expensesLogged: 0,
    };
    expect(isDailyMinimumMet(focusAndHabit)).toBe(true);

    // Habit + Expense
    const habitAndExpense: DailyRecord = {
      date: '2026-11-17',
      focusSessionsCompleted: 0,
      habitsCompleted: 1,
      expensesLogged: 1,
    };
    expect(isDailyMinimumMet(habitAndExpense)).toBe(true);

    // Focus + Expense
    const focusAndExpense: DailyRecord = {
      date: '2026-11-17',
      focusSessionsCompleted: 1,
      habitsCompleted: 0,
      expensesLogged: 1,
    };
    expect(isDailyMinimumMet(focusAndExpense)).toBe(true);

    // All 3
    const allThree: DailyRecord = {
      date: '2026-11-17',
      focusSessionsCompleted: 2,
      habitsCompleted: 3,
      expensesLogged: 1,
    };
    expect(isDailyMinimumMet(allThree)).toBe(true);
  });

  it('fails when only 1 or 0 of the 3 criteria are met', () => {
    // Only focus
    expect(
      isDailyMinimumMet({
        date: '2026-11-17',
        focusSessionsCompleted: 1,
        habitsCompleted: 0,
        expensesLogged: 0,
      })
    ).toBe(false);

    // Only habit
    expect(
      isDailyMinimumMet({
        date: '2026-11-17',
        focusSessionsCompleted: 0,
        habitsCompleted: 1,
        expensesLogged: 0,
      })
    ).toBe(false);

    // Only expense
    expect(
      isDailyMinimumMet({
        date: '2026-11-17',
        focusSessionsCompleted: 0,
        habitsCompleted: 0,
        expensesLogged: 1,
      })
    ).toBe(false);
  });

  it('tasks do NOT count toward streak qualification', () => {
    // 10 tasks completed, but only 1 habit and 0 focus/expenses -> fails (1 of 3)
    const tasksHeavyRecord: DailyRecord = {
      date: '2026-11-17',
      focusSessionsCompleted: 0,
      habitsCompleted: 1,
      expensesLogged: 0,
      tasksCompleted: 10,
    };
    expect(isDailyMinimumMet(tasksHeavyRecord)).toBe(false);
  });

  it('provides checklist details matching UI contract ("2 of 3 keeps your streak")', () => {
    const record: DailyRecord = {
      date: '2026-11-17',
      focusSessionsCompleted: 1,
      habitsCompleted: 0,
      expensesLogged: 1,
    };
    const checklist = getDailyMinimumChecklist(record);

    expect(checklist.hasFocusSession).toBe(true);
    expect(checklist.hasHabitCompleted).toBe(false);
    expect(checklist.hasExpenseLogged).toBe(true);
    expect(checklist.completedCount).toBe(2);
    expect(checklist.totalRequired).toBe(2);
    expect(checklist.isQualified).toBe(true);
  });
});

describe('Backdating Restrictions for Streak Purpose', () => {
  it('allows editing today and the previous 2 days only', () => {
    const today = '2026-11-17';

    expect(isDateEditableForStreak('2026-11-17', today)).toBe(true); // today (diff 0)
    expect(isDateEditableForStreak('2026-11-16', today)).toBe(true); // yesterday (diff 1)
    expect(isDateEditableForStreak('2026-11-15', today)).toBe(true); // 2 days ago (diff 2)

    // 3 or more days ago are read-only
    expect(isDateEditableForStreak('2026-11-14', today)).toBe(false); // 3 days ago (diff 3)
    expect(isDateEditableForStreak('2026-11-10', today)).toBe(false); // 7 days ago (diff 7)

    // Future dates are rejected
    expect(isDateEditableForStreak('2026-11-18', today)).toBe(false);
  });
});

describe('Streak & Freeze Derivation', () => {
  it('computes consecutive qualified days into active streak', () => {
    const dailyRecords: DailyRecord[] = [
      { date: '2026-11-10', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
      { date: '2026-11-11', focusSessionsCompleted: 0, habitsCompleted: 1, expensesLogged: 1 },
      { date: '2026-11-12', focusSessionsCompleted: 1, habitsCompleted: 0, expensesLogged: 1 },
    ];

    const result = calculateStreak({
      dailyRecords,
      freezeLogs: [],
      todayDateString: '2026-11-12',
    });

    expect(result.currentStreak).toBe(3);
    expect(result.bestStreak).toBe(3);
    expect(result.isTodayQualified).toBe(true);
    expect(result.streakPreview.isPreviewActive).toBe(true);
    expect(result.streakPreview.current).toBe(2);
    expect(result.streakPreview.next).toBe(3);
  });

  it('earns 1 freeze per 7 consecutive days and caps held freezes at 2', () => {
    // 21 consecutive qualified days
    const dailyRecords: DailyRecord[] = [];
    for (let i = 1; i <= 21; i++) {
      const d = `2026-10-${String(i).padStart(2, '0')}`;
      dailyRecords.push({
        date: d,
        focusSessionsCompleted: 1,
        habitsCompleted: 1,
        expensesLogged: 0,
      });
    }

    const result = calculateStreak({
      dailyRecords,
      freezeLogs: [],
      todayDateString: '2026-10-21',
    });

    expect(result.currentStreak).toBe(21);
    expect(result.freezesEarnedTotal).toBe(3); // earned on days 7, 14, 21
    expect(result.freezesLeft).toBe(2); // maximum 2 held at a time
  });

  it('protects streak on a missed day when a freeze log exists', () => {
    const dailyRecords: DailyRecord[] = [
      // 7 qualified days to earn a freeze
      { date: '2026-11-01', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
      { date: '2026-11-02', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
      { date: '2026-11-03', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
      { date: '2026-11-04', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
      { date: '2026-11-05', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
      { date: '2026-11-06', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
      { date: '2026-11-07', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
      // 2026-11-08 is missed!
      // 2026-11-09 resumes
      { date: '2026-11-09', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
    ];

    const freezeLogs: StreakFreezeLog[] = [
      { user_id: 'user-1', freeze_date: '2026-11-08' },
    ];

    const result = calculateStreak({
      dailyRecords,
      freezeLogs,
      todayDateString: '2026-11-09',
    });

    expect(result.currentStreak).toBe(8); // 7 + 1
    expect(result.freezesUsedTotal).toBe(1);
    expect(result.freezesLeft).toBe(0); // 1 earned - 1 used
    expect(result.history.find(h => h.date === '2026-11-08')?.isFrozen).toBe(true);
  });

  it('resets streak to 0 on a missed day without a freeze log', () => {
    const dailyRecords: DailyRecord[] = [
      { date: '2026-11-01', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
      { date: '2026-11-02', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
      // 2026-11-03 missed
      { date: '2026-11-04', focusSessionsCompleted: 1, habitsCompleted: 1, expensesLogged: 0 },
    ];

    const result = calculateStreak({
      dailyRecords,
      freezeLogs: [],
      todayDateString: '2026-11-04',
    });

    expect(result.currentStreak).toBe(1); // reset after 11-03 missed, only 11-04 active
    expect(result.bestStreak).toBe(2);
  });

  it('shows 12 -> 13 preview ONLY when today is already complete', () => {
    // 12 days completed up to yesterday
    const dailyRecords: DailyRecord[] = [];
    for (let i = 1; i <= 12; i++) {
      dailyRecords.push({
        date: `2026-11-${String(i).padStart(2, '0')}`,
        focusSessionsCompleted: 1,
        habitsCompleted: 1,
        expensesLogged: 0,
      });
    }

    // Today is Nov 13, NOT qualified yet (only 1 item completed)
    dailyRecords.push({
      date: '2026-11-13',
      focusSessionsCompleted: 1,
      habitsCompleted: 0,
      expensesLogged: 0,
    });

    const notCompletedResult = calculateStreak({
      dailyRecords,
      freezeLogs: [],
      todayDateString: '2026-11-13',
    });

    expect(notCompletedResult.currentStreak).toBe(12);
    expect(notCompletedResult.isTodayQualified).toBe(false);
    expect(notCompletedResult.streakPreview.isPreviewActive).toBe(false);
    expect(notCompletedResult.streakPreview.current).toBe(12);
    expect(notCompletedResult.streakPreview.next).toBe(13);

    // Today is Nov 13, user completes second requirement (e.g. habit)!
    dailyRecords[12] = {
      date: '2026-11-13',
      focusSessionsCompleted: 1,
      habitsCompleted: 1,
      expensesLogged: 0,
    };

    const completedResult = calculateStreak({
      dailyRecords,
      freezeLogs: [],
      todayDateString: '2026-11-13',
    });

    expect(completedResult.currentStreak).toBe(13);
    expect(completedResult.isTodayQualified).toBe(true);
    expect(completedResult.streakPreview.isPreviewActive).toBe(true);
    expect(completedResult.streakPreview.current).toBe(12);
    expect(completedResult.streakPreview.next).toBe(13);
  });

  it('formats habit and daily streak badges unambiguously as 12D', () => {
    expect(formatStreakBadge(12)).toBe('12D');
    expect(formatStreakBadge(1)).toBe('1D');
    expect(formatStreakBadge(0)).toBe('0D');
  });

  it('calculates next milestone accurately', () => {
    expect(getNextMilestone(3)).toBe(7);
    expect(getNextMilestone(7)).toBe(14);
    expect(getNextMilestone(12)).toBe(14);
    expect(getNextMilestone(14)).toBe(21);
    expect(getNextMilestone(29)).toBe(30);
    expect(getNextMilestone(99)).toBe(100);
  });
});

describe('Life Score & Daily Delta Calculation', () => {
  it('calculates weighted Life Score (0-100) and delta vs yesterday without separate storage', () => {
    const yesterday: DailyRecord = {
      date: '2026-11-16',
      focusSessionsCompleted: 1,
      habitsCompleted: 2,
      habitsTotal: 4, // 50% = 18 pts
      expensesLogged: 1,
      tasksCompleted: 2, // 2/3 = 13 pts
      focusMinutes: 120, // 120/240 = 15 pts
      focusGoalMinutes: 240,
      dailyExpenseAmount: 400,
      dailyAllowanceBudget: 500, // within budget = 15 pts
    };

    const today: DailyRecord = {
      date: '2026-11-17',
      focusSessionsCompleted: 2,
      habitsCompleted: 4,
      habitsTotal: 4, // 100% = 35 pts
      expensesLogged: 1,
      tasksCompleted: 3, // 3/3 = 20 pts
      focusMinutes: 240, // 240/240 = 30 pts
      focusGoalMinutes: 240,
      dailyExpenseAmount: 350,
      dailyAllowanceBudget: 500, // 15 pts
    };

    const score = calculateLifeScore(today, yesterday);

    expect(score.habitsScore).toBe(35);
    expect(score.tasksScore).toBe(20);
    expect(score.focusScore).toBe(30);
    expect(score.financeScore).toBe(15);
    expect(score.total).toBe(100);
    expect(score.deltaVsYesterday).toBeGreaterThan(0);
  });

  it('returns clean zero Life Score (0/100) on a fresh day with zero records and no configured habits', () => {
    const freshRecord: DailyRecord = {
      date: '2026-11-20',
      focusSessionsCompleted: 0,
      habitsCompleted: 0,
      expensesLogged: 0,
      habitsTotal: 0,
      tasksCompleted: 0,
      focusMinutes: 0,
      focusGoalMinutes: 240,
      dailyExpenseAmount: 0,
      dailyAllowanceBudget: 500,
    };

    const score = calculateLifeScore(freshRecord, null);

    expect(score.habitsScore).toBe(0);
    expect(score.focusScore).toBe(0);
    expect(score.tasksScore).toBe(0);
    expect(score.financeScore).toBe(0);
    expect(score.total).toBe(0);
    expect(score.deltaVsYesterday).toBe(0);
  });
});

describe('Focus Insights & Break Filtering', () => {
  it('filters out breaks from focus time and insight calculation', () => {
    const sessions: FocusSession[] = [];

    // Add 15 days of sessions, but with large break sessions that should be ignored
    for (let day = 1; day <= 15; day++) {
      const dayStr = String(day).padStart(2, '0');
      // Real focus session at 20:00 (60m)
      sessions.push({
        id: `s-${day}-focus`,
        client_session_id: `cs-${day}-focus`,
        user_id: 'u1',
        duration_seconds: 3600,
        started_at: `2026-10-${dayStr}T20:00:00Z`,
        ended_at: `2026-10-${dayStr}T21:00:00Z`,
        mode: 'pomodoro',
      });

      // Break session at 14:00 (120m break) - MUST NOT be treated as peak hour!
      sessions.push({
        id: `s-${day}-break`,
        client_session_id: `cs-${day}-break`,
        user_id: 'u1',
        duration_seconds: 7200,
        started_at: `2026-10-${dayStr}T14:00:00Z`,
        ended_at: `2026-10-${dayStr}T16:00:00Z`,
        mode: 'long-break',
      });
    }

    const insight = calculateFocusInsights(sessions, 'UTC');

    expect(insight.hasEnoughData).toBe(true);
    expect(insight.peakHour).toBe(20); // 8 PM from pomodoro, NOT 14 (2 PM) from long-break
    expect(insight.formattedPeakTime).toBe('8 PM');
    expect(insight.insightText).toBe('You focus best around 8 PM');
    expect(insight.totalMinutes).toBe(15 * 60); // 15 hours, breaks not counted!
  });

  it('hides insights when there are fewer than 14 distinct days of session data', () => {
    const sessions: FocusSession[] = [
      {
        id: '1',
        client_session_id: 'c1',
        user_id: 'u1',
        duration_seconds: 1800,
        started_at: '2026-11-10T14:00:00Z',
        ended_at: '2026-11-10T14:30:00Z',
        mode: 'deep-work',
      },
    ];

    const insight = calculateFocusInsights(sessions, 'UTC');

    expect(insight.hasEnoughData).toBe(false);
    expect(insight.peakHour).toBeNull();
    expect(insight.insightText).toBeNull();
    expect(insight.daysTracked).toBe(1);
  });
});

describe('Mood Rating Type Contract & Evening Check-In Validation', () => {
  it('strictly supports the 5 ordered mood ratings matching icons', () => {
    const validRatings: MoodRating[] = ['exhausted', 'tough', 'neutral', 'good', 'great'];
    expect(validRatings).toHaveLength(5);

    for (const mood of validRatings) {
      const parsed = upsertDailyCheckInSchema.safeParse({
        mood,
        reflectionText: 'Solid progress today.',
        finishedTaskTitles: ['Revise OS Ch. 4'],
      });
      expect(parsed.success).toBe(true);
    }

    const invalid = upsertDailyCheckInSchema.safeParse({
      mood: 'difficult',
      reflectionText: '',
      finishedTaskTitles: [],
    });
    expect(invalid.success).toBe(false);
  });
});

describe('Unbounded Habit Streak Derivation', () => {
  it('computes a 100-day habit streak without any 60-day history cap', () => {
    const today = '2026-11-17';
    const dates: string[] = [];
    for (let i = 0; i < 100; i++) {
      dates.push(addDaysToDateString(today, -i));
    }

    expect(calculateHabitStreakFromDates(dates, today)).toBe(100);
  });

  it('computes a 120-day streak across a year boundary and keeps streak alive when today is pending', () => {
    const today = '2026-03-01';
    // 120 consecutive days ending yesterday (today not yet completed)
    const dates: string[] = [];
    for (let i = 1; i <= 120; i++) {
      dates.push(addDaysToDateString(today, -i));
    }
    // Also add an accidental future date — must be ignored
    dates.push(addDaysToDateString(today, 1));

    expect(calculateHabitStreakFromDates(dates, today)).toBe(120);
  });
});
