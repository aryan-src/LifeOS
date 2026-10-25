import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PocketMoneyWidget } from '@/components/finances/pocket-money-widget';
import { TodayFocusCard } from '@/components/tasks/today-focus-card';
import { FocusCockpitWidget } from '@/components/dashboard/focus-cockpit-widget';
import { WorkspaceDock } from '@/components/navigation/workspace-dock';
import { WorkspaceHeader } from '@/components/navigation/workspace-header';
import { DashboardGreeting } from '@/components/dashboard/dashboard-greeting';
import { SubmissionsAndFocusCard } from '@/components/dashboard/submissions-and-focus-card';

describe('Dashboard Layout & Element Visibility Verification', () => {
  it('renders PocketMoneyWidget with fully visible 7-day outflow chart and day labels', () => {
    const html = renderToString(
      <PocketMoneyWidget
        telemetry={{
          monthlyAllowance: 5000,
          remainingAllowance: 987,
          allowanceUsagePercent: 80,
          monthlySpent: 4013,
          todaySpent: 0,
          safeDailyBudget: 98.7,
          daysLeftInMonth: 10,
          currencySymbol: '₹',
          weeklyDays: [
            { dayLabel: 'M', spent: 60, isToday: false },
            { dayLabel: 'T', spent: 120, isToday: false },
            { dayLabel: 'W', spent: 80, isToday: false },
            { dayLabel: 'T', spent: 210, isToday: true },
            { dayLabel: 'F', spent: 40, isToday: false },
            { dayLabel: 'S', spent: 70, isToday: false },
            { dayLabel: 'S', spent: 30, isToday: false },
          ],
        }}
        monthLabel="Oct 2026"
      />
    );

    // Header & balance metrics
    expect(html).toContain('Pocket Money');
    expect(html).toContain('Oct 2026');
    expect(html).toContain('987');
    expect(html).toContain('left');

    // Spent Today & Remaining Balance metrics
    expect(html).toContain('Spent Today');
    expect(html).toContain('No outflows today');
    expect(html).toContain('Remaining Balance');
    expect(html).toContain('10d left');
    expect(html).toContain('/5000');

    // 7-day outflow activity section and day labels
    expect(html).toContain('7-Day Outflow Activity');
    expect(html).toContain('avg');
    expect(html).toContain('h-28');
    expect(html).toContain('Mon');
    expect(html).toContain('Tue');
    expect(html).toContain('Wed');
    expect(html).toContain('Fri');
    expect(html).toContain('Sat');

    // Card footer action buttons
    expect(html).toContain('Ledger →');
    expect(html).toContain('+ Log expense');
  });

  it('renders TodayFocusCard with progress ring, checklist, and Next Up row', () => {
    const html = renderToString(
      <TodayFocusCard
        initialTasks={[
          {
            id: 't-1',
            user_id: 'user-1',
            title: 'Complete Math Problem Set',
            description: null,
            priority: 4,
            due_date: '2026-10-24',
            sort_order: 1,
            is_completed: false,
            completed_at: null,
            project_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            project: null,
          },
        ]}
        todayStr="2026-10-24"
      />
    );

    // Primary section heading without eyebrow text
    expect(html).toContain("Today&#x27;s Focus");
    expect(html).toContain('text-2xl font-bold tracking-tight');
    expect(html).not.toContain('DEEP WORK &amp; TASKS');
    expect(html).not.toContain('DEEP WORK & TASKS');

    // Daily task completion tracking
    expect(html).toContain('completed');
    expect(html).toContain('0/1');
    expect(html).toContain('Complete Math Problem Set');
    expect(html).toContain('Next up:');
    expect(html).toContain('Add a task');
    expect(html).toContain('Priority Matrix');
  });

  it('strictly resets daily task completion tracker at midnight', () => {
    // Tasks completed on a previous date (e.g. 2026-10-23) should NOT count towards today (2026-10-24)
    const html = renderToString(
      <TodayFocusCard
        initialTasks={[
          {
            id: 't-yesterday',
            user_id: 'user-1',
            title: 'Old completed task',
            description: null,
            priority: 2,
            due_date: '2026-10-23',
            sort_order: 1,
            is_completed: true,
            completed_at: '2026-10-23T15:00:00.000Z',
            project_id: null,
            created_at: '2026-10-23T10:00:00.000Z',
            updated_at: '2026-10-23T15:00:00.000Z',
            project: null,
          },
          {
            id: 't-today',
            user_id: 'user-1',
            title: 'Active task for today',
            description: null,
            priority: 3,
            due_date: '2026-10-24',
            sort_order: 2,
            is_completed: false,
            completed_at: null,
            project_id: null,
            created_at: '2026-10-24T08:00:00.000Z',
            updated_at: '2026-10-24T08:00:00.000Z',
            project: null,
          },
        ]}
        todayStr="2026-10-24"
      />
    );

    // Only today's active task is tracked: 0 of 1 completed
    expect(html).toContain('0/1');
    expect(html).toContain('0% completed (0 of 1)');
  });

  it('renders WorkspaceHeader without the WORKSPACE badge in the brand area', () => {
    const html = renderToString(<WorkspaceHeader displayName="Aryan" />);

    expect(html).toContain('Life');
    expect(html).toContain('OS');
    expect(html).not.toContain('>Workspace</span>');
    expect(html).not.toContain('>WORKSPACE</span>');
  });

  it('renders SubmissionsAndFocusCard without DEADLINES & TIMERS eyebrow and without Focus Timer', async () => {
    const card = await SubmissionsAndFocusCard({ initialAssignments: [] });
    const html = renderToString(card);

    expect(html).toContain('Upcoming Submissions');
    expect(html).toContain('text-2xl font-bold tracking-tight');
    expect(html).not.toContain('DEADLINES &amp; TIMERS');
    expect(html).not.toContain('DEADLINES & TIMERS');
    expect(html).not.toContain('data-purpose="focus-timer-card"');
    expect(html).not.toContain('Focus Timer');
  });

  it('renders DashboardGreeting with dynamic localized greeting', () => {
    const html = renderToString(
      <DashboardGreeting
        displayName="Aryan"
        initialGreeting="Good morning"
        initialDayName="Sunday"
        initialDateFormatted="25 Oct"
      />
    );

    expect(html).toContain('Good morning, Aryan.');
    expect(html).toContain('Sunday,');
    expect(html).toContain('25 Oct');
  });

  it('renders FocusCockpitWidget with 25:00 digits, controls, and 15m/25m/50m buttons', () => {
    const html = renderToString(<FocusCockpitWidget />);

    expect(html).toContain('Focus Timer');
    expect(html).toContain('Focused today:');
    expect(html).toContain('25:00');
    expect(html).toContain('15');
    expect(html).toContain('25');
    expect(html).toContain('50');
  });

  it('renders WorkspaceDock with fixed bottom pill and proper navigation triggers', () => {
    const html = renderToString(<WorkspaceDock />);

    expect(html).toContain('fixed bottom-5');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Projects');
    expect(html).toContain('Tasks');
    expect(html).toContain('Habits');
    expect(html).toContain('Finances');
    expect(html).toContain('Notes');
    expect(html).toContain('Settings');
  });
});
