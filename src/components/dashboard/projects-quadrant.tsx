import React from 'react';
import { getProjectsWithMetrics } from '@/lib/actions/projects';
import Link from 'next/link';

export async function ProjectsQuadrant() {
  const allProjects = await getProjectsWithMetrics();
  const activeProjects = allProjects.filter((p) => p.status === 'active').slice(0, 3);

  return (
    <article className="rounded bg-surface-container-lowest shadow-sm p-space-lg flex flex-col justify-between gap-space-md h-full">
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-space-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">view_kanban</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">Active Projects</h2>
          </div>
          <Link
            className="font-label-sm text-label-sm text-outline hover:text-on-surface flex items-center gap-0.5 transition-colors"
            href="/projects"
          >
            <span>View board</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {activeProjects.length === 0 ? (
            <p className="text-body-sm text-outline py-6 text-center">No active projects yet.</p>
          ) : (
            activeProjects.map((project) => (
              <Link
                key={project.id}
                href="/projects"
                className="group p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-space-sm min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      project.completion_percentage >= 70
                        ? 'bg-secondary'
                        : project.completion_percentage >= 30
                        ? 'bg-outline-variant'
                        : 'bg-outline'
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-body-md text-body-md text-on-surface font-medium truncate">
                      {project.title}
                    </span>
                    <span className="font-label-sm text-label-sm text-outline truncate">
                      #{project.slug} • {project.total_tasks} tasks
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                    In Progress
                  </span>
                  <span className="font-label-sm text-label-sm text-outline hidden sm:inline">
                    {project.completion_percentage}%
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Micro summary footer */}
      <div className="pt-space-xs flex items-center justify-between text-outline font-label-sm text-label-sm border-t border-surface-container-high/60 mt-2">
        <span>{allProjects.length} total projects</span>
        <span className="text-on-surface-variant">Active initiatives</span>
      </div>
    </article>
  );
}

export function ProjectsSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 animate-pulse h-80 flex flex-col justify-between">
      <div className="h-5 w-32 bg-slate-800 rounded" />
      <div className="space-y-3">
        <div className="h-16 bg-slate-800/50 rounded-xl" />
        <div className="h-16 bg-slate-800/50 rounded-xl" />
      </div>
      <div className="h-4 w-24 bg-slate-800/40 rounded" />
    </div>
  );
}
