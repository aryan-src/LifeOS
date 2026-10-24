'use client';

import React from 'react';
import Link from 'next/link';
import type { ProjectWithMetrics } from '@/lib/actions/projects';

interface ActiveProjectsWidgetProps {
  projects: ProjectWithMetrics[];
  className?: string;
}

export function ActiveProjectsWidget({
  projects,
  className = '',
}: ActiveProjectsWidgetProps) {
  const safeProjects = Array.isArray(projects) ? projects : [];

  const ongoingCount = safeProjects.filter((p) => p.status === 'active').length;
  const completedCount = safeProjects.filter((p) => p.status === 'completed').length;
  const backlogCount = safeProjects.filter(
    (p) => p.status === 'paused' || p.status === 'backlog'
  ).length;

  const displayProjects = safeProjects.slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'In Progress',
          className:
            'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold',
          barColor: 'bg-emerald-500',
        };
      case 'completed':
        return {
          label: 'Completed',
          className:
            'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-semibold',
          barColor: 'bg-blue-500',
        };
      case 'paused':
        return {
          label: 'Paused',
          className:
            'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 font-medium',
          barColor: 'bg-amber-400',
        };
      default:
        return {
          label: 'Backlog',
          className:
            'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 font-medium',
          barColor: 'bg-stone-300 dark:bg-zinc-600',
        };
    }
  };

  return (
    <section
      className={`flex flex-col h-full overflow-hidden justify-between ${className}`}
      data-purpose="section-active-projects"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between pb-1.5 border-b border-stone-100 dark:border-zinc-800/60">
        <h2 className="text-base font-bold font-serif text-stone-900 dark:text-zinc-100 tracking-tight leading-none">
          Active Projects
        </h2>
        <Link
          className="text-xs font-medium text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 transition-colors"
          href="/projects"
        >
          View board →
        </Link>
      </div>

      {/* Projects List */}
      <div className="flex-1 min-h-0 py-1 flex flex-col justify-center overflow-y-auto no-scrollbar gap-1.5">
        {displayProjects.length === 0 ? (
          <div className="text-[12px] text-stone-400 dark:text-zinc-500 py-3 text-center">
            No projects yet.{' '}
            <Link href="/projects" className="text-stone-700 dark:text-zinc-300 underline font-medium">
              Create project
            </Link>
          </div>
        ) : (
          displayProjects.map((project) => {
            const badge = getStatusBadge(project.status);
            const percentage = Math.max(0, Math.min(100, project.completion_percentage || 0));

            return (
              <div key={project.id} className="space-y-0.5 group">
                <div className="flex items-center justify-between text-xs">
                  <Link
                    href="/projects"
                    className="font-medium text-stone-800 dark:text-zinc-200 text-[11px] truncate group-hover:text-stone-950 dark:group-hover:text-zinc-50 transition-colors"
                  >
                    {project.title}
                  </Link>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[8.5px] font-mono uppercase px-1.5 py-0.2 rounded ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-400">
                      {percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-stone-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${badge.barColor} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-[9px] text-stone-400 dark:text-zinc-500 font-mono truncate">
                  Next:{' '}
                  <span className="text-stone-600 dark:text-zinc-400">
                    {project.status === 'completed'
                      ? 'Archived & documented'
                      : 'Milestone checkpoints'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto shrink-0 pt-1.5 border-t border-stone-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
        <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">
          {ongoingCount} ongoing · {completedCount} completed · {backlogCount} backlog
        </span>
        <Link
          href="/projects"
          className="hover:text-stone-700 dark:hover:text-zinc-300 font-sans transition-colors text-[11px] font-medium text-stone-500 dark:text-zinc-400"
        >
          All projects →
        </Link>
      </div>
    </section>
  );
}
