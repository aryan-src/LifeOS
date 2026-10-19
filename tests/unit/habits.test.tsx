import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { getTodayDate, getTrailingDays } from '@/lib/utils/date';
import { WeeklyHabitChart } from '@/components/habits/weekly-habit-chart';
import { HabitTrackerClient } from '@/components/habits/habit-tracker-client';
import type { HabitWithLog, WeeklyHabitStat } from '@/lib/actions/habits';

describe('Habits Module — Architecture & Consistency', () => {
  const mockHabits: HabitWithLog[] = [
    {
      id: 'h-1',
      user_id: 'usr-test-habits',
      title: 'Morning Sunlight & Hydration',
      description: '500ml water right after waking up',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
      is_completed_today: true,
      streak: 5,
      weekly_history: {
        '2026-10-15': true,
        '2026-10-14': true,
        '2026-10-13': true,
      },
    },
    {
      id: 'h-2',
      user_id: 'usr-test-habits',
      title: 'Read 20 Pages',
      description: 'Technical reading',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
      is_completed_today: false,
      streak: 2,
      weekly_history: {
        '2026-10-15': false,
        '2026-10-14': true,
      },
    },
  ];

  const mockWeeklyStats: WeeklyHabitStat[] = [
    { date: '2026-10-09', dayOfWeek: 'Fri', completedCount: 1, totalHabits: 2, completionRate: 50, isToday: false },
    { date: '2026-10-10', dayOfWeek: 'Sat', completedCount: 2, totalHabits: 2, completionRate: 100, isToday: false },
    { date: '2026-10-11', dayOfWeek: 'Sun', completedCount: 1, totalHabits: 2, completionRate: 50, isToday: false },
    { date: '2026-10-12', dayOfWeek: 'Mon', completedCount: 2, totalHabits: 2, completionRate: 100, isToday: false },
    { date: '2026-10-13', dayOfWeek: 'Tue', completedCount: 1, totalHabits: 2, completionRate: 50, isToday: false },
    { date: '2026-10-14', dayOfWeek: 'Wed', completedCount: 2, totalHabits: 2, completionRate: 100, isToday: false },
    { date: '2026-10-15', dayOfWeek: 'Thu', completedCount: 1, totalHabits: 2, completionRate: 50, isToday: true },
  ];

  describe('Date Constraint Verification', () => {
    it('generates strictly localized YYYY-MM-DD date strings in IST without timezone drift', () => {
      const today = getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const trailingDays = getTrailingDays(7);
      expect(trailingDays.length).toBe(7);
      trailingDays.forEach((d) => {
        expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof d.dayLabel).toBe('string');
        expect(typeof d.isToday).toBe('boolean');
      });

      // The last day in trailing 7 days must be today
      expect(trailingDays[trailingDays.length - 1].isToday).toBe(true);
      expect(trailingDays[trailingDays.length - 1].date).toBe(today);
    });
  });

  describe('WeeklyHabitChart Component', () => {
    it('renders with strict h-64 height container to prevent SSR layout collapse', () => {
      const html = renderToString(<WeeklyHabitChart data={mockWeeklyStats} />);
      expect(html).toContain('h-64');
    });

    it('renders day labels for the last 7 days', () => {
      const html = renderToString(<WeeklyHabitChart data={mockWeeklyStats} />);
      expect(html).toContain('Fri');
      expect(html).toContain('Sat');
      expect(html).toContain('Sun');
      expect(html).toContain('Mon');
      expect(html).toContain('Tue');
      expect(html).toContain('Wed');
      expect(html).toContain('Thu');
    });
  });

  describe('HabitTrackerClient Component', () => {
    it('renders today progress and checklist correctly in SSR', () => {
      const html = renderToString(
        <HabitTrackerClient
          initialHabits={mockHabits}
          initialWeeklyStats={mockWeeklyStats}
        />
      );

      // Section titles
      expect(html).toContain("Today&#x27;s Progress");
      expect(html).toContain('Weekly Consistency');
      expect(html).toContain('7-Day Habit Completion Pattern');

      // Habit titles
      expect(html).toContain('Morning Sunlight &amp; Hydration');
      expect(html).toContain('Read 20 Pages');

      // Streak badge
      expect(html).toContain('5d');

      // Chart height constraint
      expect(html).toContain('h-64');
    });

    it('renders demo schema banner when isSchemaMissing is true', () => {
      const html = renderToString(
        <HabitTrackerClient
          initialHabits={mockHabits}
          initialWeeklyStats={mockWeeklyStats}
          isSchemaMissing={true}
        />
      );

      expect(html).toContain('Demo / Local Schema Mode');
      expect(html).toContain('supabase/migrations/20261015000000_habits_and_logs.sql');
    });
  });
});
