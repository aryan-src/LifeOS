import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PageTitle, PageHeader } from '@/components/ui/page-title';
import { Variant3DashboardView } from '@/components/dashboard/variant3-dashboard-view';
import { FocusHistoryView } from '@/components/focus/focus-history/focus-history-view';
import { HabitTrackerClient } from '@/components/habits/habit-tracker-client';
import { FinancesClientView } from '@/components/finances/finances-client-view';
import { AssignmentsView } from '@/components/assignments/assignments-view';
import { NotesGrid } from '@/components/notes/notes-grid';
import { BentoSettings } from '@/components/settings/bento-settings';

/**
 * Page Title & Responsive Typography Test Suite
 *
 * NOTE ON COMPUTED SIZES:
 * Node.js and jsdom do not run a real layout/rendering engine, so CSS `clamp(...)`
 * expressions cannot be resolved to computed pixel sizes (e.g. 44px on desktop, 28px on mobile)
 * via `window.getComputedStyle()`. We assert that the shared CSS classes and Tailwind tokens
 * (`text-page-title`, `text-dashboard-greeting`, `font-serif`, `font-semibold`) are applied
 * to the DOM elements across every page.
 */
describe('PageTitle shared component', () => {
  it('renders standard page title with Playfair Display semibold and fluid size token', () => {
    const html = renderToString(<PageTitle>Habits</PageTitle>);

    expect(html).toContain('font-serif');
    expect(html).toContain('text-page-title');
    expect(html).toContain('font-semibold');
    expect(html).toContain('tracking-tight');
    expect(html).toContain('text-on-surface');
    expect(html).toContain('break-words');
    expect(html).toContain('Habits');
  });

  it('renders dashboard greeting with largest title token (text-dashboard-greeting)', () => {
    const html = renderToString(
      <PageTitle isDashboardGreeting>Good evening, Aryan</PageTitle>
    );

    expect(html).toContain('font-serif');
    expect(html).toContain('text-page-title');
    expect(html).toContain('text-dashboard-greeting');
    expect(html).toContain('font-semibold');
    expect(html).toContain('break-words');
    expect(html).toContain('Good evening, Aryan');
  });

  it('renders PageHeader with hairline divider and bottom spacing', () => {
    const html = renderToString(
      <PageHeader>
        <PageTitle>Test Page</PageTitle>
      </PageHeader>
    );

    expect(html).toContain('border-b');
    expect(html).toContain('border-outline-variant/40');
    expect(html).toContain('pb-5');
    expect(html).toContain('mb-8');
  });
});

describe('Page Title adoption across all views', () => {
  it('Dashboard renders greeting with shared PageTitle and baseline date alignment', () => {
    const html = renderToString(
      <Variant3DashboardView
        displayName="Aryan"
        greetingTime="Good evening"
        dayName="Thursday"
        dateFormatted="Nov 19, 2026"
        weekNumber={47}
        initialHabits={[]}
        initialProjects={[]}
        initialNotes={[]}
        initialAssignments={[]}
        financialAnalytics={null}
      />
    ).replace(/<!--.*?-->/g, '');

    expect(html).toContain('font-serif text-page-title');
    expect(html).toContain('text-dashboard-greeting');
    expect(html).toContain('font-semibold');
    expect(html).toContain('sm:items-baseline');
    expect(html).toContain('Good evening, Aryan');
  });

  it('Focus History renders shared PageTitle with font-serif semibold', () => {
    const sampleData: any = {
      userLocalDate: '2026-11-19',
      userTimezone: 'UTC',
      isTimezoneNull: false,
      todayDateStr: '2026-11-19',
      todayMode: 'daytime',
      todayCheckIn: null,
      todayExpenseAmount: 0,
      streakData: {
        currentStreak: 5,
        longestStreak: 10,
        freezesRemaining: 2,
        todayStatus: {
          hasTaskCompleted: true,
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
        { dayLabel: 'W', date: '2026-11-18', isToday: false, isPast: true, isFuture: false, isQualified: true, isFrozen: false },
        { dayLabel: 'T', date: '2026-11-19', isToday: true, isPast: false, isFuture: false, isQualified: true, isFrozen: false },
        { dayLabel: 'F', date: '2026-11-20', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
        { dayLabel: 'S', date: '2026-11-21', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
        { dayLabel: 'S', date: '2026-11-22', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
      ],
      focusInsight: {
        peakHour: null,
        formattedPeakTime: null,
        totalSessions: 6,
        totalMinutes: 180,
        daysTracked: 7,
        hasEnoughData: false,
        insightText: null,
      },
    };

    const html = renderToString(
      <FocusHistoryView data={sampleData} recentSessions={[]} />
    ).replace(/<!--.*?-->/g, '');

    expect(html).toContain('font-serif text-page-title');
    expect(html).toContain('font-semibold');
    expect(html).toContain('Focus History');
  });

  it('Habits renders shared PageTitle with font-serif semibold', () => {
    const html = renderToString(
      <HabitTrackerClient
        initialHabits={[]}
        initialWeeklyStats={[]}
        initialError={null}
        isSchemaMissing={false}
      />
    );

    expect(html).toContain('font-serif text-page-title');
    expect(html).toContain('font-semibold');
    expect(html).toContain('Habits');
  });

  it('Finances / Expenses renders shared PageTitle with font-serif semibold', () => {
    const dummyAnalytics = {
      monthlyLimit: 15000,
      totalSpentThisMonth: 5000,
      remainingBudget: 10000,
      budgetBurnRate: 33.3,
      daysLeftInMonth: 11,
      safeDailyBudget: 909,
      categoryDistribution: [],
      dailyExpenses: [],
      paceBreakdown: {
        budgetLimit: 15000,
        expectedSpendToDate: 9500,
        actualSpendToDate: 5000,
        paceDifference: -4500,
        paceStatus: 'on-track' as const,
      },
      currencySymbol: '₹',
      weeklyDays: [],
      currentWeekTotal: 1200,
    };

    const html = renderToString(
      <FinancesClientView
        initialTransactions={[]}
        analytics={dummyAnalytics as any}
        categories={[]}
        projects={[]}
      />
    );

    expect(html).toContain('font-serif text-page-title');
    expect(html).toContain('font-semibold');
    expect(html).toContain('Expenses');
  });

  it('Assignments renders shared PageTitle with font-serif semibold', () => {
    const html = renderToString(
      <AssignmentsView
        initialAssignments={[]}
        projects={[]}
        initialError={null}
        isSchemaMissing={false}
      />
    );

    expect(html).toContain('font-serif text-page-title');
    expect(html).toContain('font-semibold');
    expect(html).toContain('Assignments');
  });

  it('Notes renders shared PageTitle with font-serif semibold', () => {
    const html = renderToString(<NotesGrid initialNotes={[]} />);

    expect(html).toContain('font-serif text-page-title');
    expect(html).toContain('font-semibold');
    expect(html).toContain('Notes');
  });

  it('Settings renders shared PageTitle with font-serif semibold', () => {
    const dummyProfile = {
      id: 'usr-1',
      user_id: 'usr-1',
      display_name: 'Aryan',
      monthly_allowance: 15000,
      theme_preference: 'warm-paper',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    const html = renderToString(<BentoSettings initialProfile={dummyProfile as any} />);

    expect(html).toContain('font-serif text-page-title');
    expect(html).toContain('font-semibold');
    expect(html).toContain('Settings');
  });
});
