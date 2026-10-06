import React from 'react';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import { formatNumber } from '@/lib/utils/format';

interface ProjectCardProps {
  project: ProjectWithMetrics;
  onDelete: (id: string) => void;
}

const PRIORITY_LABELS: Record<number, { label: string; className: string }> = {
  4: { label: 'P1 Urgent', className: 'text-on-error-container bg-error-container font-medium' },
  3: { label: 'High Priority', className: 'text-tertiary-fixed bg-tertiary-container font-medium' },
  2: { label: 'Medium', className: 'text-on-surface-variant bg-surface-container-high' },
  1: { label: 'Low', className: 'text-outline bg-surface-container' },
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const priorityInfo = PRIORITY_LABELS[project.priority] || PRIORITY_LABELS[2];
  const isOverBudget = project.budget > 0 && project.total_spend > project.budget;

  return (
    <div className="group relative p-space-md bg-surface-container-lowest rounded-lg shadow-sm hover:shadow transition-shadow flex flex-col gap-space-sm border border-outline-variant/30">
      {/* Top Header: Priority Badge & Slug */}
      <div className="flex items-center justify-between">
        <span
          className={`font-label-sm text-label-sm px-2 py-0.5 rounded ${priorityInfo.className}`}
        >
          {priorityInfo.label}
        </span>
        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
          #{project.slug}
        </span>
      </div>

      {/* Title & Description */}
      <div className="flex flex-col gap-1">
        <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors line-clamp-1">
          {project.title}
        </h3>
        {project.description && (
          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
            {project.description}
          </p>
        )}
      </div>

      {/* Subtle Sage Progress Bar */}
      <div className="flex flex-col gap-1 pt-1">
        <div className="flex items-center justify-between font-label-sm text-label-sm">
          <span className="text-outline">Progress</span>
          <span className="font-medium text-secondary">{project.completion_percentage}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-300"
            style={{ width: `${Math.min(project.completion_percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Task & Budget Micro Meta */}
      <div className="pt-space-xs flex items-center justify-between text-outline border-t border-surface-container-high/60 mt-1">
        <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[14px]">checklist</span>
          <span>
            {project.completed_tasks}/{project.total_tasks} tasks
          </span>
        </div>

        <div className="flex items-center gap-1 font-label-sm text-label-sm">
          <span suppressHydrationWarning className={isOverBudget ? 'text-error font-medium' : ''}>
            ₹{formatNumber(project.total_spend)} / ₹{formatNumber(project.budget)}
          </span>
        </div>
      </div>

      {/* Target Date if available */}
      {project.target_date && (
        <div className="flex items-center gap-1 text-outline font-label-sm text-label-sm">
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
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 rounded p-1 text-outline hover:text-error hover:bg-surface-container transition"
        title="Delete project"
      >
        <span className="material-symbols-outlined text-[16px]">delete</span>
      </button>
    </div>
  );
}
