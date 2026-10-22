import React, { Suspense } from 'react';
import { getUserProfile } from '@/lib/actions/profile';
import { getHabits } from '@/lib/actions/habits';
import { getProjectsWithMetrics } from '@/lib/actions/projects';
import { getNotes } from '@/lib/actions/notes';
import { getTodayDate } from '@/lib/utils/date';

import { DashboardGreeting } from './dashboard-greeting';
import { FinancesQuadrant, FinancesSkeleton } from './finances-quadrant';
import { TasksQuadrant, TasksSkeleton } from './tasks-quadrant';
import { SubmissionsAndFocusCard, SubmissionsAndFocusSkeleton } from './submissions-and-focus-card';
import { BottomBandHabits } from './bottom-band-habits';
import { BottomBandProjects } from './bottom-band-projects';
import { BottomBandIdeas } from './bottom-band-ideas';

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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* ROW 1: Responsive 3-Column Grid with Equal Height Alignment */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Column 1: Greeting & Pocket Money Telemetry */}
        <div className="min-w-0 h-full flex flex-col justify-between gap-4">
          <DashboardGreeting displayName={displayName} />
          <Suspense fallback={<FinancesSkeleton />}>
            <FinancesQuadrant />
          </Suspense>
        </div>

        {/* Column 2: Today's Focus Card */}
        <div className="min-w-0 h-full flex flex-col justify-between">
          <Suspense fallback={<TasksSkeleton />}>
            <TasksQuadrant />
          </Suspense>
        </div>

        {/* Column 3: Upcoming Submissions & Focus Cockpit */}
        <div className="min-w-0 h-full flex flex-col justify-between">
          <Suspense fallback={<SubmissionsAndFocusSkeleton />}>
            <SubmissionsAndFocusCard />
          </Suspense>
        </div>
      </div>

      {/* ROW 2: BOTTOM BAND SHELF (Habits, Active Projects, Recent Ideas) */}
      <div className="w-full bg-white dark:bg-zinc-900/70 rounded-2xl p-5 sm:p-6 border border-[#07343C]/10 dark:border-zinc-800/60 shadow-xs transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* GROUP 1: Habits Matrix */}
          <div className="min-w-0 h-full flex flex-col justify-between">
            <BottomBandHabits
              initialHabits={habitsRes?.habits || []}
              todayStr={todayStr}
            />
          </div>

          {/* GROUP 2: Active Projects Overview */}
          <div className="min-w-0 h-full flex flex-col justify-between md:border-l md:border-r border-[#07343C]/10 dark:border-zinc-800/60 md:px-6">
            <BottomBandProjects
              projects={projects || []}
            />
          </div>

          {/* GROUP 3: Recent Ideas Scratchpad with 1-Click Promote */}
          <div className="min-w-0 h-full flex flex-col justify-between">
            <BottomBandIdeas
              initialNotes={notes || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
