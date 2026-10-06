import React from 'react';
import { getProjectsWithMetrics } from '@/lib/actions/projects';
import Link from 'next/link';

export async function ProjectsQuadrant() {
  const allProjects = await getProjectsWithMetrics();
  const activeProjects = allProjects.filter((p) => p.status === 'active').slice(0, 3);

  return (
    <article className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs p-6 md:p-8 flex flex-col justify-between gap-6 h-full min-w-0">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-outline-variant/20 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">view_kanban</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">Active Projects</h2>
          </div>
          <Link
            className="font-label-sm text-label-sm text-outline hover:text-on-surface flex items-center gap-1 transition-colors shrink-0"
            href="/projects"
          >
            <span>View board</span>
            <span className="material-symbols-outlined text-[14px] shrink-0">arrow_forward</span>
          </Link>
        </div>

        <div className="flex flex-col gap-2.5">
          {activeProjects.length === 0 ? (
            <p className="text-body-sm text-outline py-8 text-center font-normal">No active projects yet.</p>
          ) : (
            activeProjects.map((project) => (
              <Link
                key={project.id}
                href="/projects"
                className="group p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 hover:bg-surface-container transition-colors flex items-center justify-between gap-3 min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0">
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
                    <span className="font-body-md text-body-md text-on-surface font-medium truncate group-hover:text-primary">
                      {project.title}
                    </span>
                    <span className="font-label-sm text-label-sm text-outline truncate">
                      #{project.slug} • {project.total_tasks} tasks
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface font-label-sm text-label-sm">
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
      <div className="pt-3 flex items-center justify-between text-outline font-label-sm text-label-sm border-t border-outline-variant/20 mt-2">
        <span>{allProjects.length} total projects</span>
        <span className="text-on-surface-variant font-medium">Active initiatives</span>
      </div>
    </article>
  );
}

export function ProjectsSkeleton() {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 shadow-xs animate-pulse h-80 flex flex-col justify-between">
      <div className="h-5 w-36 bg-surface-container-high rounded-md" />
      <div className="space-y-3">
        <div className="h-12 bg-surface-container-low rounded-xl" />
        <div className="h-12 bg-surface-container-low rounded-xl" />
      </div>
      <div className="h-4 w-40 bg-surface-container-low rounded-md" />
    </div>
  );
}
