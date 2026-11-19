import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FocusHistoryView } from '../../src/components/focus/focus-history/focus-history-view';
import type { DailyLoopDashboardData } from '../../src/lib/actions/daily-loop';
import type { FocusSessionRow } from '../../src/lib/actions/focus-session';

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
    daysTracked: 10,
    hasEnoughData: false,
    insightText: null,
  },
  todayExpenseAmount: 0,
};

const sampleSessions: FocusSessionRow[] = [
  {
    id: 's1',
    client_session_id: 'c1',
    duration_seconds: 3000,
    started_at: '2026-11-18T14:15:00Z',
    ended_at: '2026-11-18T15:05:00Z',
    mode: 'deep_work',
    task_id: 't1',
    project_id: null,
    task: { id: 't1', title: 'Systems Architecture Review' },
    project: null,
  },
  {
    id: 's2',
    client_session_id: 'c2',
    duration_seconds: 1500,
    started_at: '2026-11-18T10:30:00Z',
    ended_at: '2026-11-18T10:55:00Z',
    mode: 'pomodoro',
    task_id: null,
    project_id: 'p1',
    task: null,
    project: { id: 'p1', title: 'CS 201 Binary Trees Lab' },
  },
];

describe('Focus History Recent Sessions Table', () => {
  it('renders Recent Sessions table with real rows when sessions exist', () => {
    const html = renderToString(
      <FocusHistoryView data={sampleData} recentSessions={sampleSessions} />
    ).replace(/<!--.*?-->/g, '');

    expect(html).toContain('Recent Sessions');
    expect(html).toContain('2 sessions');
    expect(html).toContain('Systems Architecture Review');
    expect(html).toContain('CS 201 Binary Trees Lab');
    expect(html).toContain('50m');
    expect(html).toContain('25m');
    expect(html).toContain('Deep work');
    expect(html).toContain('Pomodoro');
    expect(html).toContain('Insights');
    expect(html).toContain('10 of 14 days completed');
  });

  it('renders calm empty state when no sessions exist', () => {
    const html = renderToString(
      <FocusHistoryView data={sampleData} recentSessions={[]} />
    ).replace(/<!--.*?-->/g, '');

    expect(html).toContain('Recent Sessions');
    expect(html).toContain('0 sessions');
    expect(html).toContain('No focus sessions recorded yet');
    expect(html).toContain('Start a focus session');
  });
});
