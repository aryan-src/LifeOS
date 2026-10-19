import React from 'react';
import { getHabits, getWeeklyHabitStats } from '@/lib/actions/habits';
import { HabitTrackerClient } from '@/components/habits/habit-tracker-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Habits',
  description: 'Zero-latency daily routines, streaks, and weekly consistency tracking.',
};

export default async function HabitsPage() {
  const [{ habits, error, isSchemaMissing }, weeklyStats] = await Promise.all([
    getHabits(),
    getWeeklyHabitStats(),
  ]);

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1720px] mx-auto">
      <HabitTrackerClient
        initialHabits={habits}
        initialWeeklyStats={weeklyStats}
        initialError={error}
        isSchemaMissing={isSchemaMissing}
      />
    </main>
  );
}
