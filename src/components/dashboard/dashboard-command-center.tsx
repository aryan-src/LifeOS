import React, { Suspense } from 'react';
import { getUserProfile } from '@/lib/actions/profile';
import { getHabits } from '@/lib/actions/habits';
import { getProjectsWithMetrics } from '@/lib/actions/projects';
import { getNotes } from '@/lib/actions/notes';
import { getTodayDate } from '@/lib/utils/date';

import { DashboardHeader } from './dashboard-header';
import { DashboardGreeting } from './dashboard-greeting';
import { FinancesQuadrant, FinancesSkeleton } from './finances-quadrant';
import { TasksQuadrant, TasksSkeleton } from './tasks-quadrant';
import { SubmissionsAndFocusCard, SubmissionsAndFocusSkeleton } from './submissions-and-focus-card';
import { BottomBandHabits } from './bottom-band-habits';
import { BottomBandProjects } from './bottom-band-projects';
import { BottomBandIdeas } from './bottom-band-ideas';
import { DashboardDock } from './dashboard-dock';

export async function DashboardCommandCenter() {
  const todayStr = getTodayDate();

  // Fetch initial data in parallel for instant SSR
  const [profile, habitsRes, projects, notes] = await Promise.all([
    getUserProfile().catch(() => null),
    getHabits().catch(() => ({ habits: [], error: null, isSchemaMissing: false })),
    getProjectsWithMetrics().catch(() => []),
    getNotes().catch(() => []),
  ]);

  const displayName = profile?.display_name || 'Aryan';

  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen overflow-y-auto lg:overflow-hidden flex flex-col justify-between bg-[#FBF9F5] dark:bg-[#090A0F] text-[#07343C] dark:text-zinc-100 font-sans relative selection:bg-[#10B981]/20">
      {/* 1. TOP BAR */}
      <DashboardHeader displayName={displayName} />

      {/* 2. MAIN CANVAS */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-3 pb-2 flex flex-col justify-between gap-3 overflow-y-auto lg:overflow-hidden min-h-0">
        {/* ROW 1: Asymmetric 3 Columns with strict items-stretch alignment */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)_minmax(0,1fr)] gap-4 xl:gap-5 items-stretch min-h-0">
          {/* LEFT COLUMN: Greeting & Financial Telemetry (Pocket Money) */}
          <section className="min-w-0 flex flex-col justify-between h-full gap-3">
            <DashboardGreeting displayName={displayName} />
            <Suspense fallback={<FinancesSkeleton />}>
              <FinancesQuadrant />
            </Suspense>
          </section>

          {/* MIDDLE COLUMN: Today's Focus Card */}
          <Suspense fallback={<TasksSkeleton />}>
            <TasksQuadrant />
          </Suspense>

          {/* RIGHT COLUMN: Upcoming Submissions & Focus Cockpit */}
          <Suspense fallback={<SubmissionsAndFocusSkeleton />}>
            <SubmissionsAndFocusCard />
          </Suspense>
        </div>

        {/* ROW 2: BOTTOM BAND (195px desktop) */}
        <div className="h-auto lg:h-[195px] shrink-0 bg-white dark:bg-zinc-900/70 rounded-2xl px-4 sm:px-6 py-3 mb-6 lg:mb-[76px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)] gap-4 xl:gap-5 items-stretch border border-[#07343C]/10 dark:border-zinc-800/60 shadow-xs transition-colors">
          {/* GROUP 1: Habits */}
          <BottomBandHabits
            initialHabits={habitsRes?.habits || []}
            todayStr={todayStr}
          />

          {/* GROUP 2: Active Projects */}
          <BottomBandProjects
            projects={projects || []}
          />

          {/* GROUP 3: Recent Ideas Scratchpad */}
          <BottomBandIdeas
            initialNotes={notes || []}
          />
        </div>
      </main>

      {/* 3. FLOATING NAVIGATION DOCK */}
      <DashboardDock />
    </div>
  );
}
