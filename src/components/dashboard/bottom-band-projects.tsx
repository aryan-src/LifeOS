import React from 'react';
import Link from 'next/link';
import { type ProjectWithMetrics } from '@/lib/actions/projects';

interface BottomBandProjectsProps {
  projects: ProjectWithMetrics[];
}

export function BottomBandProjects({ projects }: BottomBandProjectsProps) {
  const safeProjects = Array.isArray(projects) ? projects : [];

  const ongoingCount = safeProjects.filter((p) => p.status === 'active').length;
  const completedCount = safeProjects.filter((p) => p.status === 'completed').length;
  const backlogCount = safeProjects.filter((p) => p.status === 'paused' || p.status === 'backlog').length;

  const displayProjects = safeProjects.slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'In Progress', className: 'bg-[#F3F0EA] dark:bg-zinc-800 text-[#07343C] dark:text-zinc-200' };
      case 'completed':
        return { label: 'Completed', className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' };
      case 'paused':
        return { label: 'Paused', className: 'bg-[#F3F0EA] dark:bg-zinc-800 text-[#07343C]/70 dark:text-zinc-400' };
      default:
        return { label: 'Backlog', className: 'bg-[#F3F0EA]/70 dark:bg-zinc-800/60 text-[#07343C]/70 dark:text-zinc-400' };
    }
  };

  return (
    <div className="min-w-0 flex flex-col justify-between border-t md:border-t-0 md:border-l lg:border-r border-[#07343C]/10 dark:border-zinc-800/60 pt-3 md:pt-0 md:px-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-[17px] xl:text-[18px] font-bold text-[#07343C] dark:text-zinc-100">
          Active Projects
        </h3>
        <Link
          href="/projects"
          className="text-[11px] font-medium text-[#07343C]/70 dark:text-zinc-400 hover:text-[#07343C] dark:hover:text-zinc-100 underline decoration-[#07343C]/30 dark:decoration-zinc-700"
        >
          View board →
        </Link>
      </div>

      <div className="space-y-2.5 my-auto py-1">
        {displayProjects.length === 0 ? (
          <div className="text-[12px] text-[#07343C]/60 dark:text-zinc-400 py-3 text-center">
            No projects yet.{' '}
            <Link href="/projects" className="text-[#0B5563] dark:text-emerald-400 underline">
              Create project
            </Link>
          </div>
        ) : (
          displayProjects.map((project) => {
            const badge = getStatusBadge(project.status);
            const percentage = Math.max(0, Math.min(100, project.completion_percentage || 0));

            return (
              <Link
                key={project.id}
                href="/projects"
                className="block group"
              >
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="font-medium text-[#07343C] dark:text-zinc-100 truncate group-hover:text-[#0B5563] dark:group-hover:text-emerald-400 transition-colors">
                    {project.title}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#F3F0EA] dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </Link>
            );
          })
        )}
      </div>

      <p className="text-[11px] text-[#07343C]/60 dark:text-zinc-400 font-mono">
        {ongoingCount} ongoing · {completedCount} completed · {backlogCount} backlog
      </p>
    </div>
  );
}
