import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FocusHistoryView } from '../../src/components/focus/focus-history/focus-history-view';
import type { DailyLoopDashboardData } from '../../src/lib/actions/daily-loop';

const sampleData: DailyLoopDashboardData = {
  lifeScore: { total: 55, habitsScore: 20, focusScore: 15, tasksScore: 10, financeScore: 10, deltaVsYesterday: 0 },
  streakState: {
    currentStreak: 3,
    bestStreak: 5,
    freezesEarnedTotal: 0,
    freezesUsedTotal: 0,
    freezesLeft: 0,
    isTodayQualified: true,
    nextMilestone: 7,
    streakPreview: { current: 3, next: 4, isPreviewActive: false },
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
    minutes: 90,
    goalMinutes: 240,
    formattedTime: '1h 30m',
    formattedGoal: '4h goal',
    percent: 38,
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
  userTimezone: 'UTC',
  isTimezoneNull: false,
  todayDateStr: '2026-11-18',
  todayMode: 'daytime',
  todayCheckIn: null,
  focusInsight: {
    peakHour: null,
    formattedPeakTime: null,
    totalSessions: 6,
    totalMinutes: 180,
    daysTracked: 7,
    hasEnoughData: false,
    insightText: null,
  },
  todayExpenseAmount: 0,
};

describe('Stitch FocusHistoryView Screen', () => {
  it('renders Playfair Display title, real telemetry stats, 14-day calibration baseline, and zero mockup strings', () => {
    const html = renderToString(<FocusHistoryView data={sampleData} />).replace(
      /<!--.*?-->/g,
      ''
    );

    expect(html).toContain('font-serif text-page-title');
    expect(html).toContain('Focus History');
    expect(html).toContain('1h 30m');
    expect(html).toContain('3h');
    expect(html).toContain('7 / 14 days');
    expect(html).toContain('Week 47 · 2026');
    expect(html).not.toContain('Week 46 · 2024');
    expect(html).not.toContain('italic');
  });
});
