import React from 'react';
import type { TaskWithProject } from '@/lib/actions/tasks';
import { getTodayDate } from '@/lib/utils/date';

interface TaskItemProps {
  task: TaskWithProject;
  onToggle: (taskId: string, targetState: boolean) => void;
  onDelete: (taskId: string) => void;
}

const PRIORITY_BADGES: Record<number, { label: string; className: string }> = {
  4: { label: 'P1 Urgent', className: 'bg-error-container text-on-error-container dark:bg-rose-950/40 dark:text-rose-400 font-medium' },
  3: { label: 'P1 High', className: 'bg-tertiary-container text-on-tertiary-container dark:bg-amber-950/40 dark:text-amber-300 font-medium' },
  2: { label: 'P2 Medium', className: 'bg-surface-container-high text-on-surface-variant dark:bg-zinc-800 dark:text-zinc-300' },
  1: { label: 'P3 Low', className: 'bg-surface-container text-outline dark:bg-zinc-800/60 dark:text-zinc-400' },
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
          ? 'bg-surface-container-lowest/50 opacity-60 hover:opacity-100 border border-outline-variant/30 dark:bg-zinc-900/30 dark:border-zinc-800/40'
          : 'bg-surface-container-lowest hover:bg-surface-container-low border border-transparent hover:border-outline-variant/40 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/50 dark:border-zinc-800/50'
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
              ? 'bg-secondary dark:bg-emerald-500 text-on-secondary'
              : 'border border-outline dark:border-zinc-600 bg-surface-container-lowest dark:bg-zinc-900 hover:border-primary dark:hover:border-zinc-400'
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
                  ? 'text-outline dark:text-zinc-500 line-through'
                  : 'text-on-surface dark:text-zinc-100 group-hover:text-primary dark:group-hover:text-emerald-400'
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
            <p className="font-body-sm text-body-sm text-on-surface-variant/80 dark:text-zinc-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta row: Due Date, Project */}
          <div className="flex flex-wrap items-center gap-space-md mt-1.5 text-outline dark:text-zinc-400 font-label-sm text-label-sm">
            {task.due_date && (
              <span
                suppressHydrationWarning
                className={`flex items-center gap-1 font-medium ${
                  isOverdue
                    ? 'text-error dark:text-rose-400 font-semibold'
                    : isDueToday
                    ? 'text-on-tertiary-container dark:text-amber-400'
                    : 'text-outline dark:text-zinc-400'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isOverdue ? 'warning' : 'schedule'}
                </span>
                {isOverdue ? `Overdue: ${task.due_date}` : isDueToday ? 'Due Today' : task.due_date}
              </span>
            )}

            {task.project && (
              <span className="flex items-center gap-1 text-on-surface-variant dark:text-zinc-400">
                <span className="material-symbols-outlined text-[14px] text-outline dark:text-zinc-500">tag</span>
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
          className="p-1 rounded text-outline dark:text-zinc-500 hover:text-error dark:hover:text-rose-400 hover:bg-surface-container dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
}
