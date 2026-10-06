import React from 'react';
import { TaskChecklist } from '@/components/tasks/task-checklist';
import { getTasks } from '@/lib/actions/tasks';
import { getProjectOptions } from '@/lib/actions/projects-options';
import { getProjectsWithMetrics } from '@/lib/actions/projects';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const [tasks, projects, projectsWithMetrics] = await Promise.all([
    getTasks(),
    getProjectOptions(),
    getProjectsWithMetrics(),
  ]);

  const completedTodayCount = tasks.filter((t) => t.is_completed).length;
  const pendingCount = tasks.filter((t) => !t.is_completed).length;
  const totalCount = tasks.length;
  const velocityPercent = totalCount > 0 ? Math.round((completedTodayCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col w-full">
      {/* Minimal Ambient Header Accent */}
      <div className="w-full px-space-lg lg:px-margin pt-space-lg pb-space-md">
        {/* Top Meta Breadcrumb & Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-sm">
          <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-secondary"></span>
            <span className="uppercase tracking-wider">Active Cycle</span>
            <span>•</span>
            <span className="font-label-md text-label-md text-on-surface">Autumn 2026 / W41</span>
          </div>
          <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm">
            <span className="bg-surface-container-high px-space-sm py-0.5 rounded text-on-surface-variant font-medium">
              {pendingCount} Pending
            </span>
            <span>{completedTodayCount} Completed</span>
          </div>
        </div>

        {/* Editorial Title & Quiet Subtext */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Daily Tasks</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Action items, priorities, and project-linked deliverables.</p>
          </div>

          {/* Quick Productivity Meter (Micro-visual inline SVG) */}
          <div className="flex items-center gap-space-md bg-surface-container-low px-space-md py-space-sm rounded-lg shadow-sm">
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle className="text-surface-container-high" cx="18" cy="18" fill="none" r="14" stroke="currentColor" stroke-width="3"></circle>
                <circle
                  className="text-secondary transition-all duration-500"
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
              <span className="absolute font-label-sm text-label-sm font-medium text-on-surface">{velocityPercent}%</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Completion Velocity</span>
              <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                {velocityPercent >= 50 ? 'Optimal pace' : 'In progress'} · {pendingCount} tasks remaining
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="w-full px-space-lg lg:px-margin pb-space-xl">
        <TaskChecklist
          initialTasks={tasks}
          projects={projects}
          projectDeadlines={projectsWithMetrics}
        />
      </div>
    </div>
  );
}
