import React, { Suspense } from 'react';
import { getUserProfile } from '@/lib/actions/profile';
import { getHabits } from '@/lib/actions/habits';
import { getProjectsWithMetrics } from '@/lib/actions/projects';
import { getNotes } from '@/lib/actions/notes';
import { getTodayDate } from '@/lib/utils/date';

import { WorkspaceHeader } from '@/components/navigation/workspace-header';
import { WorkspaceDock } from '@/components/navigation/workspace-dock';
import { DashboardGreeting } from './dashboard-greeting';
import { FinancesQuadrant, FinancesSkeleton } from './finances-quadrant';
import { TasksQuadrant, TasksSkeleton } from './tasks-quadrant';
import { SubmissionsAndFocusCard, SubmissionsAndFocusSkeleton } from './submissions-and-focus-card';
import { BottomBandHabits } from './bottom-band-habits';
import { BottomBandProjects } from './bottom-band-projects';
import { BottomBandIdeas } from './bottom-band-ideas';

export async function DashboardCommandCenter() {
  const todayStr = getTodayDate();

  // Parallel server-side data fetching
  const [profile, habitsRes, projects, notes] = await Promise.all([
    getUserProfile().catch(() => null),
    getHabits().catch(() => ({ habits: [], error: null, isSchemaMissing: false })),
    getProjectsWithMetrics().catch(() => []),
    getNotes().catch(() => []),
  ]);

  const displayName = profile?.display_name || 'Aryan';

  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = dayNames[now.getDay()];
  const dateFormatted = `${now.getDate()} ${months[now.getMonth()]}`;

  const hour = now.getHours();
  let greetingTime = 'Good morning';
  if (hour >= 12 && hour < 17) greetingTime = 'Good afternoon';
  else if (hour >= 17) greetingTime = 'Good evening';

  return (
    <div className="w-full min-h-screen bg-[#FAF9F5] dark:bg-zinc-950 text-stone-800 dark:text-zinc-200 font-sans transition-colors relative flex flex-col">
      {/* 1. Top Global Navigation (~48px) */}
      <WorkspaceHeader displayName={displayName} />

      {/* 2. Main In-Flow Content Container with normal vertical flow */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 pt-4 pb-32 sm:pb-36 flex flex-col gap-6">
        {/* Dynamic Local Greeting Hero Banner */}
        <section data-purpose="hero-overview-banner">
          <DashboardGreeting
            displayName={displayName}
            initialGreeting={greetingTime}
            initialDayName={dayName}
            initialDateFormatted={dateFormatted}
          />
        </section>

        {/* TOP ROW: 3-Card Grid (Pocket Money, Today's Focus, Upcoming Submissions) */}
        {/* Equal height across cards using grid with items-stretch */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <Suspense fallback={<FinancesSkeleton />}>
            <FinancesQuadrant />
          </Suspense>

          <Suspense fallback={<TasksSkeleton />}>
            <TasksQuadrant />
          </Suspense>

          <Suspense fallback={<SubmissionsAndFocusSkeleton />}>
            <SubmissionsAndFocusCard />
          </Suspense>
        </div>

        {/* BOTTOM ROW: Unified 3-Column Paper Shelf */}
        {/* In-flow element with consistent 24px gap (gap-6) from top grid */}
        <div
          className="bg-white dark:bg-zinc-900/70 rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 p-5 sm:p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 items-stretch transition-colors"
          data-purpose="unified-bottom-row"
        >
          {/* Section 1: Habits */}
          <div className="min-w-0 pr-0 md:pr-6 flex flex-col justify-between">
            <BottomBandHabits
              initialHabits={habitsRes?.habits || []}
              todayStr={todayStr}
            />
          </div>

          {/* Section 2: Active Projects */}
          <div className="min-w-0 md:border-l border-stone-200/60 dark:border-zinc-800/60 px-0 md:px-6 flex flex-col justify-between">
            <BottomBandProjects
              projects={projects || []}
            />
          </div>

          {/* Section 3: Recent Ideas */}
          <div className="min-w-0 md:border-l border-stone-200/60 dark:border-zinc-800/60 pl-0 md:pl-6 flex flex-col justify-between">
            <BottomBandIdeas
              initialNotes={notes || []}
            />
          </div>
        </div>
      </main>

      {/* Floating Bottom Navigation (Dock) pinned at viewport bottom */}
      <WorkspaceDock />
    </div>
  );
}
