import React from 'react';
import type { Metadata } from 'next';
import { TaskChecklist } from '@/components/tasks/task-checklist';
import { getTasks } from '@/lib/actions/tasks';
import { getProjectOptions } from '@/lib/actions/projects-options';
import { getProjectsWithMetrics } from '@/lib/actions/projects';
import { getTodayDate, getLocalDateString } from '@/lib/utils/date';

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'Zero-latency daily task checklist and deliverables tracker.',
};

export const dynamic = 'force-dynamic';

export default async function TasksPage(props: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const todayStr = getTodayDate();
  const selectedDate = searchParams?.date || todayStr;

  let tasks: Awaited<ReturnType<typeof getTasks>> = [];
  let projects: Awaited<ReturnType<typeof getProjectOptions>> = [];
  let projectsWithMetrics: Awaited<ReturnType<typeof getProjectsWithMetrics>> = [];

  try {
    const results = await Promise.all([
      getTasks(),
      getProjectOptions(),
      getProjectsWithMetrics(),
    ]);
    tasks = Array.isArray(results[0]) ? results[0] : [];
    projects = Array.isArray(results[1]) ? results[1] : [];
    projectsWithMetrics = Array.isArray(results[2]) ? results[2] : [];
  } catch (err) {
    console.error('Error loading tasks page data:', err);
  }

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const completedTodayCount = safeTasks.filter((t) => {
    if (!t.is_completed) return false;
    const taskCompletedDate = getLocalDateString(t.completed_at || t.created_at);
    return taskCompletedDate === selectedDate;
  }).length;
  const pendingCount = safeTasks.filter((t) => !t.is_completed).length;
  const totalCount = pendingCount + completedTodayCount;
  const velocityPercent = totalCount > 0 ? Math.round((completedTodayCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FBFBFB] dark:bg-[#090A0F] text-stone-900 dark:text-zinc-100 font-sans">
      {/* Minimal Ambient Header Accent */}
      <div className="w-full px-space-lg lg:px-margin pt-space-lg pb-space-md">
        {/* Top Meta Breadcrumb & Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-sm">
          <div className="flex items-center gap-space-sm text-stone-400 dark:text-zinc-500 font-mono text-xs">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="uppercase tracking-wider">Active Cycle</span>
            <span>•</span>
            <span className="font-mono text-stone-700 dark:text-zinc-300 font-medium">Autumn 2026 / W41</span>
          </div>
          <div className="flex items-center gap-space-sm text-stone-500 dark:text-zinc-400 font-mono text-xs">
            <span className="bg-stone-100 dark:bg-zinc-800/80 border border-stone-200/60 dark:border-zinc-700/60 px-2 py-0.5 rounded-md text-stone-700 dark:text-zinc-300 font-medium">
              {pendingCount} Pending
            </span>
            <span>{completedTodayCount} Completed</span>
          </div>
        </div>

        {/* Editorial Title & Quiet Subtext */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div>
            <h1 className="font-serif text-3xl text-stone-900 dark:text-zinc-100 font-medium tracking-tight">Daily Tasks</h1>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">Action items, priorities, and project-linked deliverables.</p>
          </div>

          {/* Quick Productivity Meter (Micro-visual inline SVG) */}
          <div className="flex items-center gap-space-md bg-white dark:bg-zinc-900/60 border border-stone-200/70 dark:border-zinc-800/60 px-space-md py-space-sm rounded-xl shadow-xs">
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle className="text-stone-100 dark:text-zinc-800" cx="18" cy="18" fill="none" r="14" stroke="currentColor" strokeWidth="3"></circle>
                <circle
                  className="text-emerald-500 dark:text-emerald-400 transition-all duration-500"
                  cx="18"
                  cy="18"
                  fill="none"
                  r="14"
                  stroke="currentColor"
                  strokeDasharray="88"
                  strokeDashoffset={88 - (88 * velocityPercent) / 100}
                  strokeLinecap="round"
                  strokeWidth="3"
                ></circle>
              </svg>
              <span className="absolute font-mono text-xs font-medium text-stone-900 dark:text-zinc-100">{velocityPercent}%</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[10px] text-stone-400 dark:text-zinc-500 uppercase tracking-wider">Completion Velocity</span>
              <span className="text-xs text-stone-800 dark:text-zinc-200 font-medium truncate">
                {velocityPercent >= 50 ? 'Optimal pace' : 'In progress'} · {pendingCount} tasks remaining
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="w-full px-space-lg lg:px-margin pb-space-xl">
        <TaskChecklist
          initialTasks={safeTasks}
          projects={projects}
          projectDeadlines={projectsWithMetrics}
          initialSelectedDate={selectedDate}
        />
      </div>
    </div>
  );
}
