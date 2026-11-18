import { describe, it, expect } from 'vitest';
import { deriveFocusHistorySummary } from '../../src/lib/daily-loop/focus-history-derived';
import type { DailyLoopDashboardData } from '../../src/lib/actions/daily-loop';

function buildFixture(overrides?: Partial<DailyLoopDashboardData>): DailyLoopDashboardData {
  return {
    lifeScore: { total: 60, habitsScore: 20, focusScore: 20, tasksScore: 10, financeScore: 10, deltaVsYesterday: 0 },
    streakState: {
      currentStreak: 4,
      bestStreak: 7,
      freezesEarnedTotal: 1,
      freezesUsedTotal: 0,
      freezesLeft: 1,
      isTodayQualified: true,
      nextMilestone: 7,
      streakPreview: { current: 4, next: 5, isPreviewActive: false },
      checklist: {
        hasFocusSession: true,
        hasHabitCompleted: true,
        hasExpenseLogged: false,
        completedCount: 2,
        totalRequired: 2,
        isQualified: true,
      },
      history: [],
    },
    timeFocused: {
      minutes: 120,
      goalMinutes: 240,
      formattedTime: '2h',
      formattedGoal: '4h goal',
      percent: 50,
    },
    pocketLedger: {
      spentAmount: 0,
      monthlyAllowance: 5000,
      remainingAllowance: 5000,
      allowancePercent: 0,
      currentMonth: 'Nov',
    },
    weekStrip: [
      { dayLabel: 'M', date: '2026-11-16', isToday: false, isPast: true, isFuture: false, isQualified: true, isFrozen: false },
      { dayLabel: 'T', date: '2026-11-17', isToday: false, isPast: true, isFuture: false, isQualified: true, isFrozen: false },
      { dayLabel: 'W', date: '2026-11-18', isToday: true, isPast: false, isFuture: false, isQualified: true, isFrozen: false },
      { dayLabel: 'T', date: '2026-11-19', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
      { dayLabel: 'F', date: '2026-11-20', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
      { dayLabel: 'S', date: '2026-11-21', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
      { dayLabel: 'S', date: '2026-11-22', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
    ],
    userTimezone: 'Asia/Kolkata',
    isTimezoneNull: false,
    todayDateStr: '2026-11-18',
    todayMode: 'daytime',
    todayCheckIn: null,
    focusInsight: {
      peakHour: null,
      formattedPeakTime: null,
      totalSessions: 10,
      totalMinutes: 350,
      daysTracked: 7,
      hasEnoughData: false,
      insightText: null,
    },
    todayExpenseAmount: 0,
    ...overrides,
  };
}

describe('Focus History Derived Helper', () => {
  it('derives average session length, calibration progress, week label, and 7-day bars', () => {
    const summary = deriveFocusHistorySummary(buildFixture());

    expect(summary.averageSessionMinutes).toBe(35);
    expect(summary.totalFormatted).toBe('5h 50m');
    expect(summary.calibration.daysTracked).toBe(7);
    expect(summary.calibration.percent).toBe(50);
    expect(summary.calibration.isCalibrated).toBe(false);
    expect(summary.qualifiedDaysThisWeek).toBe(3);
    expect(summary.weekLabel).toBe('Week 47 · 2026');
    expect(summary.weeklyBars).toHaveLength(7);
    expect(summary.weeklyBars[2].minutes).toBe(120);
    expect(summary.weeklyBars[2].percentOfGoal).toBe(50);
  });

  it('handles zero sessions cleanly without NaN or division errors', () => {
    const summary = deriveFocusHistorySummary(
      buildFixture({
        focusInsight: {
          peakHour: null,
          formattedPeakTime: null,
          totalSessions: 0,
          totalMinutes: 0,
          daysTracked: 0,
          hasEnoughData: false,
          insightText: null,
        },
      })
    );

    expect(summary.averageSessionMinutes).toBe(0);
    expect(summary.totalFormatted).toBe('0m');
    expect(summary.calibration.percent).toBe(0);
  });
});
