import React, { Suspense } from 'react';
import { getUserProfile } from '@/lib/actions/profile';
import { getHabits } from '@/lib/actions/habits';
import { getProjectsWithMetrics } from '@/lib/actions/projects';
import { getNotes } from '@/lib/actions/notes';
import { getTodayDate } from '@/lib/utils/date';

import { WorkspaceHeader } from '@/components/navigation/workspace-header';
import { WorkspaceDock } from '@/components/navigation/workspace-dock';
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
  else if (hour >= 17 && hour < 21) greetingTime = 'Good evening';
  else if (hour >= 21 || hour < 5) greetingTime = 'Good night';

  return (
    <div className="w-full min-h-screen xl:h-screen xl:max-h-[920px] overflow-y-auto xl:overflow-hidden flex flex-col bg-[#FAF9F5] dark:bg-zinc-950 text-stone-800 dark:text-zinc-200 font-sans transition-colors">
      {/* 1. Top Global Navigation (~48px) */}
      <WorkspaceHeader displayName={displayName} />

      {/* 2. Greeting Hero Banner (~56px) */}
      <section
        className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 pt-3 pb-1 shrink-0"
        data-purpose="hero-overview-banner"
      >
        <div className="bg-white dark:bg-zinc-900/70 border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl px-6 py-2.5 shadow-sm flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-serif font-medium text-stone-950 dark:text-zinc-50 tracking-tight leading-none">
              {greetingTime}, {displayName}.
            </h1>
          </div>
          <div className="flex items-center gap-2.5 bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 rounded-xl px-3.5 py-1.5 shrink-0 shadow-2xs">
            <svg className="w-4 h-4 text-stone-500 dark:text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect height="18" rx="2" strokeWidth="1.8" width="18" x="3" y="4" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs font-mono text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                {dayName},
              </span>
              <span className="text-xs font-bold font-mono text-stone-900 dark:text-zinc-100 tracking-tight">
                {dateFormatted}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cards Area (2 rows: Top 3 Cards, Bottom Unified Card) */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 pt-2 pb-2 flex-1 min-h-0 flex flex-col gap-4 overflow-visible xl:overflow-hidden">
        {/* TOP ROW: Pocket Money, Today's Focus, Upcoming Submissions */}
        <div className="flex-[62] min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
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
        <div
          className="flex-[38] min-h-0 bg-white dark:bg-zinc-900/70 rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 p-3.5 px-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 overflow-hidden transition-colors"
          data-purpose="unified-bottom-row"
        >
          {/* Section 1: Habits */}
          <div className="min-w-0 h-full pr-0 md:pr-5">
            <BottomBandHabits
              initialHabits={habitsRes?.habits || []}
              todayStr={todayStr}
            />
          </div>

          {/* Section 2: Active Projects */}
          <div className="min-w-0 h-full md:border-l border-stone-200/60 dark:border-zinc-800/60 px-0 md:px-5">
            <BottomBandProjects
              projects={projects || []}
            />
          </div>

          {/* Section 3: Recent Ideas */}
          <div className="min-w-0 h-full md:border-l border-stone-200/60 dark:border-zinc-800/60 pl-0 md:pl-5">
            <BottomBandIdeas
              initialNotes={notes || []}
            />
          </div>
        </div>
      </main>

      {/* 4. Bottom Dock Strip (~64px) */}
      <WorkspaceDock />
    </div>
  );
}
