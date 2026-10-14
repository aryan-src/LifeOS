import React from 'react';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import { formatNumber } from '@/lib/utils/format';

interface ProjectCardProps {
  project: ProjectWithMetrics;
  onDelete: (id: string) => void;
}

const PRIORITY_LABELS: Record<number, { label: string; className: string }> = {
  4: { label: 'P1 Urgent', className: 'text-on-error-container bg-error-container dark:bg-rose-950/60 dark:text-rose-300 font-medium' },
  3: { label: 'High Priority', className: 'text-tertiary-fixed bg-tertiary-container dark:bg-amber-950/60 dark:text-amber-300 font-medium' },
  2: { label: 'Medium', className: 'text-on-surface-variant bg-surface-container-high dark:bg-zinc-800 dark:text-zinc-300' },
  1: { label: 'Low', className: 'text-outline bg-surface-container dark:bg-zinc-800/60 dark:text-zinc-400' },
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const priorityInfo = PRIORITY_LABELS[project.priority] || PRIORITY_LABELS[2];
  const isOverBudget = project.budget > 0 && project.total_spend > project.budget;

  return (
    <div className="group relative p-space-md bg-surface-container-lowest dark:bg-zinc-900/80 rounded-lg shadow-sm hover:shadow dark:hover:border-zinc-700/80 transition-all flex flex-col gap-space-sm border border-outline-variant/30 dark:border-zinc-800/80">
      {/* Top Header: Priority Badge & Slug */}
      <div className="flex items-center justify-between">
        <span
          className={`font-label-sm text-label-sm px-2 py-0.5 rounded ${priorityInfo.className}`}
        >
          {priorityInfo.label}
        </span>
        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container dark:bg-zinc-800 text-on-surface-variant dark:text-zinc-400">
          #{project.slug}
        </span>
      </div>

      {/* Title & Description */}
      <div className="flex flex-col gap-1">
        <h3 className="font-headline-sm text-headline-sm text-on-surface dark:text-zinc-100 group-hover:text-primary dark:group-hover:text-zinc-300 transition-colors line-clamp-1">
          {project.title}
        </h3>
        {project.description && (
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-zinc-400 line-clamp-2">
            {project.description}
          </p>
        )}
      </div>

      {/* Subtle Sage Progress Bar */}
      <div className="flex flex-col gap-1 pt-1">
        <div className="flex items-center justify-between font-label-sm text-label-sm">
          <span className="text-outline dark:text-zinc-400">Progress</span>
          <span className="font-medium text-secondary dark:text-emerald-400">{project.completion_percentage}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-container-high dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-secondary dark:bg-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(project.completion_percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Task & Budget Micro Meta */}
      <div className="pt-space-xs flex items-center justify-between text-outline dark:text-zinc-400 border-t border-surface-container-high/60 dark:border-zinc-800/60 mt-1">
        <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px]">checklist</span>
          <span>
            {project.completed_tasks}/{project.total_tasks} tasks
          </span>
        </div>

        <div className="flex items-center gap-1 font-label-sm text-label-sm">
          <span suppressHydrationWarning className={isOverBudget ? 'text-error dark:text-rose-400 font-medium' : ''}>
            ₹{formatNumber(project.total_spend)} / ₹{formatNumber(project.budget)}
          </span>
        </div>
      </div>

      {/* Target Date if available */}
      {project.target_date && (
        <div className="flex items-center gap-1 text-outline dark:text-zinc-400 font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[13px]">calendar_today</span>
          <span>{project.target_date}</span>
        </div>
      )}

      {/* Delete button on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(project.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 rounded p-1 text-outline dark:text-zinc-400 hover:text-error dark:hover:text-rose-400 hover:bg-surface-container dark:hover:bg-zinc-800 transition"
        title="Delete project"
      >
        <span className="material-symbols-outlined text-[16px]">delete</span>
      </button>
    </div>
  );
}
