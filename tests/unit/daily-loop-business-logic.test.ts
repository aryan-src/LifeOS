import { describe, it, expect } from 'vitest';
import {
  getUserLocalDate,
  getUserLocalHour,
  getTodayCardMode,
  isDailyMinimumMet,
  calculateStreak,
  getNextMilestone,
  formatStreakBadge,
  calculateLifeScore,
  calculateFocusInsights,
  formatHourTo12h,
} from '@/lib/daily-loop/business-logic';
import type { DailyRecord, FocusSession, StreakFreezeLog } from '@/lib/daily-loop/types';

describe('Daily Loop Business Logic — Timezone & Day Boundaries', () => {
  it('correctly calculates local date across Asia/Kolkata midnight boundary', () => {
    // 2026-11-17 18:35:00 UTC is 2026-11-18 00:05:00 in Asia/Kolkata (+05:30)
    const utcMidnightEdge = new Date('2026-11-17T18:35:00Z');

    const kolkataDate = getUserLocalDate(utcMidnightEdge, 'Asia/Kolkata');
    const kolkataHour = getUserLocalHour(utcMidnightEdge, 'Asia/Kolkata');

    expect(kolkataDate).toBe('2026-11-18');
    expect(kolkataHour).toBe(0);

    // In New York (UTC-5), the same moment is 2026-11-17 at 13:35
    const nyDate = getUserLocalDate(utcMidnightEdge, 'America/New_York');
    const nyHour = getUserLocalHour(utcMidnightEdge, 'America/New_York');

    expect(nyDate).toBe('2026-11-17');
    expect(nyHour).toBe(13);
  });

  it('determines Today Card mode according to user local hour', () => {
    // 08:00 -> morning
    const morning = new Date('2026-11-17T08:00:00Z');
    expect(getTodayCardMode(morning, 'UTC')).toBe('morning');

    // 14:00 -> daytime
    const daytime = new Date('2026-11-17T14:00:00Z');
    expect(getTodayCardMode(daytime, 'UTC')).toBe('daytime');

    // 20:00 -> evening
    const evening = new Date('2026-11-17T20:00:00Z');
    expect(getTodayCardMode(evening, 'UTC')).toBe('evening');

    // 02:00 -> evening (late night prior to 5 AM)
    const lateNight = new Date('2026-11-17T02:00:00Z');
    expect(getTodayCardMode(lateNight, 'UTC')).toBe('evening');
  });
});

describe('Daily Minimum Qualification', () => {
  it('qualifies when focus duration reaches or exceeds 25 minutes', () => {
    const record: DailyRecord = {
      date: '2026-11-17',
      habitsCompleted: 0,
      habitsTotal: 3,
      tasksCompleted: 0,
      focusMinutes: 25,
    };
    expect(isDailyMinimumMet(record)).toBe(true);
  });

  it('qualifies when completing 1 habit and 1 task', () => {
    const record: DailyRecord = {
      date: '2026-11-17',
      habitsCompleted: 1,
      habitsTotal: 4,
      tasksCompleted: 1,
      focusMinutes: 0,
    };
    expect(isDailyMinimumMet(record)).toBe(true);
  });

  it('qualifies when completing 2 habits or 2 tasks', () => {
    const recordHabits: DailyRecord = {
      date: '2026-11-17',
      habitsCompleted: 2,
      habitsTotal: 5,
      tasksCompleted: 0,
      focusMinutes: 10,
    };
    expect(isDailyMinimumMet(recordHabits)).toBe(true);

    const recordTasks: DailyRecord = {
      date: '2026-11-17',
      habitsCompleted: 0,
      habitsTotal: 3,
      tasksCompleted: 2,
      focusMinutes: 5,
    };
    expect(isDailyMinimumMet(recordTasks)).toBe(true);
  });

  it('fails qualification when below all thresholds', () => {
    const record: DailyRecord = {
      date: '2026-11-17',
      habitsCompleted: 0,
      habitsTotal: 3,
      tasksCompleted: 0,
      focusMinutes: 15,
    };
    expect(isDailyMinimumMet(record)).toBe(false);
  });
});

describe('Streak & Freeze Derivation', () => {
  it('computes consecutive qualified days into active streak', () => {
    const dailyRecords: DailyRecord[] = [
      { date: '2026-11-10', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
      { date: '2026-11-11', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
      { date: '2026-11-12', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
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
        habitsCompleted: 1,
        habitsTotal: 1,
        tasksCompleted: 1,
        focusMinutes: 30,
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
      { date: '2026-11-01', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
      { date: '2026-11-02', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
      { date: '2026-11-03', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
      { date: '2026-11-04', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
      { date: '2026-11-05', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
      { date: '2026-11-06', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
      { date: '2026-11-07', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
      // 2026-11-08 is missed!
      // 2026-11-09 resumes
      { date: '2026-11-09', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
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
      { date: '2026-11-01', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
      { date: '2026-11-02', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
      // 2026-11-03 missed
      { date: '2026-11-04', habitsCompleted: 1, habitsTotal: 1, tasksCompleted: 1, focusMinutes: 30 },
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
        habitsCompleted: 1,
        habitsTotal: 1,
        tasksCompleted: 1,
        focusMinutes: 30,
      });
    }

    // Today is Nov 13, NOT qualified yet
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

    // Today is Nov 13, user completes daily minimum!
    dailyRecords.push({
      date: '2026-11-13',
      habitsCompleted: 1,
      habitsTotal: 1,
      tasksCompleted: 1,
      focusMinutes: 30,
    });

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
      habitsCompleted: 2,
      habitsTotal: 4, // 50% = 18 pts
      tasksCompleted: 2, // 2/3 = 13 pts
      focusMinutes: 120, // 120/240 = 15 pts
      focusGoalMinutes: 240,
      dailyExpenseAmount: 400,
      dailyAllowanceBudget: 500, // within budget = 15 pts
    };

    const today: DailyRecord = {
      date: '2026-11-17',
      habitsCompleted: 4,
      habitsTotal: 4, // 100% = 35 pts
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
});

describe('Focus Insights', () => {
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
      {
        id: '2',
        client_session_id: 'c2',
        user_id: 'u1',
        duration_seconds: 1800,
        started_at: '2026-11-11T14:00:00Z',
        ended_at: '2026-11-11T14:30:00Z',
        mode: 'pomodoro',
      },
    ];

    const insight = calculateFocusInsights(sessions, 'UTC');

    expect(insight.hasEnoughData).toBe(false);
    expect(insight.peakHour).toBeNull();
    expect(insight.insightText).toBeNull();
    expect(insight.daysTracked).toBe(2);
  });

  it('computes peak focus hour and formats insight text when >= 14 days of data exist', () => {
    const sessions: FocusSession[] = [];

    // Create 15 days of data, with sessions predominantly at 20:00 (8 PM)
    for (let day = 1; day <= 15; day++) {
      const dayStr = String(day).padStart(2, '0');
      // Major session at 20:00 UTC (8 PM)
      sessions.push({
        id: `s-${day}-major`,
        client_session_id: `cs-${day}-major`,
        user_id: 'u1',
        duration_seconds: 3600, // 60 mins
        started_at: `2026-10-${dayStr}T20:00:00Z`,
        ended_at: `2026-10-${dayStr}T21:00:00Z`,
        mode: 'deep-work',
      });

      // Minor session at 10:00 UTC (10 AM)
      sessions.push({
        id: `s-${day}-minor`,
        client_session_id: `cs-${day}-minor`,
        user_id: 'u1',
        duration_seconds: 900, // 15 mins
        started_at: `2026-10-${dayStr}T10:00:00Z`,
        ended_at: `2026-10-${dayStr}T10:15:00Z`,
        mode: 'pomodoro',
      });
    }

    const insight = calculateFocusInsights(sessions, 'UTC');

    expect(insight.hasEnoughData).toBe(true);
    expect(insight.daysTracked).toBe(15);
    expect(insight.peakHour).toBe(20);
    expect(insight.formattedPeakTime).toBe('8 PM');
    expect(insight.insightText).toBe('You focus best around 8 PM');
  });

  it('formats hours accurately in 12h representation', () => {
    expect(formatHourTo12h(0)).toBe('12 AM');
    expect(formatHourTo12h(9)).toBe('9 AM');
    expect(formatHourTo12h(12)).toBe('12 PM');
    expect(formatHourTo12h(20)).toBe('8 PM');
  });
});
