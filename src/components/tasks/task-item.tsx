import React from 'react';
import type { TaskWithProject } from '@/lib/actions/tasks';
import { getTodayDate } from '@/lib/utils/date';

interface TaskItemProps {
  task: TaskWithProject;
  onToggle: (taskId: string, targetState: boolean) => void;
  onDelete: (taskId: string) => void;
}

const PRIORITY_BADGES: Record<number, { label: string; className: string }> = {
  4: { label: 'P1 Urgent', className: 'bg-error-container text-on-error-container font-medium' },
  3: { label: 'P1 High', className: 'bg-tertiary-container text-on-tertiary-container font-medium' },
  2: { label: 'P2 Medium', className: 'bg-surface-container-high text-on-surface-variant' },
  1: { label: 'P3 Low', className: 'bg-surface-container text-outline' },
};

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES[2];

  // Compare strictly against current localized YYYY-MM-DD in IST
  const todayStr = getTodayDate();
  const isOverdue = task.due_date && task.due_date < todayStr && !task.is_completed;
  const isDueToday = task.due_date === todayStr && !task.is_completed;

  return (
    <div
      className={`group flex items-start justify-between p-space-md rounded-xl transition-all shadow-sm ${
        task.is_completed
          ? 'bg-surface-container-lowest/50 opacity-60 hover:opacity-100 border border-outline-variant/30'
          : 'bg-surface-container-lowest hover:bg-surface-container-low border border-transparent hover:border-outline-variant/40'
      }`}
    >
      <div className="flex items-start gap-space-md min-w-0 flex-1">
        {/* Custom styled checkbox */}
        <button
          type="button"
          onClick={() => onToggle(task.id, !task.is_completed)}
          aria-label={task.is_completed ? 'Mark task incomplete' : 'Mark task complete'}
          className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded transition-all cursor-pointer ${
            task.is_completed
              ? 'bg-secondary text-on-secondary'
              : 'border border-outline bg-surface-container-lowest hover:border-primary'
          }`}
        >
          {task.is_completed && (
            <span className="material-symbols-outlined text-[13px] font-bold">check</span>
          )}
        </button>

        {/* Title, description & meta badges */}
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span
              className={`font-body-md text-body-md font-medium transition-colors ${
                task.is_completed
                  ? 'text-outline line-through'
                  : 'text-on-surface group-hover:text-primary'
              }`}
            >
              {task.title}
            </span>

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm ${priorityInfo.className}`}
            >
              {priorityInfo.label}
            </span>
          </div>

          {task.description && (
            <p className="font-body-sm text-body-sm text-on-surface-variant/80 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta row: Due Date, Project */}
          <div className="flex flex-wrap items-center gap-space-md mt-1.5 text-outline font-label-sm text-label-sm">
            {task.due_date && (
              <span
                suppressHydrationWarning
                className={`flex items-center gap-1 font-medium ${
                  isOverdue
                    ? 'text-error font-semibold'
                    : isDueToday
                    ? 'text-on-tertiary-container'
                    : 'text-outline'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isOverdue ? 'warning' : 'schedule'}
                </span>
                {isOverdue ? `Overdue: ${task.due_date}` : isDueToday ? 'Due Today' : task.due_date}
              </span>
            )}

            {task.project && (
              <span className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-outline">tag</span>
                #{task.project.slug}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Delete Action Button */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          className="p-1 rounded text-outline hover:text-error hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
}
