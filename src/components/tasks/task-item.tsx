import React from 'react';
import type { TaskWithProject } from '@/lib/actions/tasks';
import { getTodayDate } from '@/lib/utils/date';
import { Check, Play, Trash2, Clock, AlertCircle, Hash } from 'lucide-react';

export interface TaskItemProps {
  task: TaskWithProject;
  onToggle: (taskId: string, targetState: boolean) => void;
  onToggleInProgress?: (taskId: string, targetState: boolean) => void;
  onDelete: (taskId: string) => void;
}

const PRIORITY_BADGES: Record<number, { label: string; className: string }> = {
  4: {
    label: 'P1 Urgent',
    className:
      'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 font-medium',
  },
  3: {
    label: 'P1 High',
    className:
      'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 font-medium',
  },
  2: {
    label: 'P2 Medium',
    className:
      'bg-stone-100 text-stone-700 border border-stone-200/60 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700/60',
  },
  1: {
    label: 'P3 Low',
    className:
      'bg-stone-50 text-stone-500 border border-stone-200/40 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-800',
  },
};

export function TaskItem({
  task,
  onToggle,
  onToggleInProgress,
  onDelete,
}: TaskItemProps) {
  const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES[2];

  // Compare strictly against current localized YYYY-MM-DD in IST
  const todayStr = getTodayDate();
  const isOverdue =
    task.due_date && task.due_date < todayStr && !task.is_completed;
  const isDueToday = task.due_date === todayStr && !task.is_completed;

  return (
    <div
      className={`group flex items-start justify-between p-3.5 sm:p-4 rounded-xl transition-all ${
        task.is_completed
          ? 'bg-stone-50/70 dark:bg-zinc-900/30 opacity-70 hover:opacity-100 border border-stone-200/60 dark:border-zinc-800/40'
          : 'bg-white dark:bg-zinc-900/60 hover:bg-stone-50/80 dark:hover:bg-zinc-800/50 border border-stone-200/80 dark:border-zinc-800/70 shadow-2xs hover:shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Checkbox (Far left, crisp, interactive) */}
        <button
          type="button"
          role="checkbox"
          aria-checked={Boolean(task.is_completed)}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id, !task.is_completed);
          }}
          aria-label={
            task.is_completed ? 'Mark task incomplete' : 'Mark task complete'
          }
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all cursor-pointer ${
            task.is_completed
              ? 'bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-2 border-stone-900 dark:border-zinc-100 shadow-xs'
              : 'border-2 border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/80 hover:border-stone-400 dark:hover:border-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800 shadow-2xs'
          }`}
        >
          {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Title, description & meta badges */}
        <div className="flex flex-col min-w-0 pr-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium transition-all ${
                task.is_completed
                  ? 'text-stone-400 dark:text-zinc-500 line-through'
                  : 'text-stone-900 dark:text-zinc-100 group-hover:text-stone-700 dark:group-hover:text-zinc-200'
              }`}
            >
              {task.title}
            </span>

            {/* In Progress Action Toggle */}
            {!task.is_completed && (
              task.in_progress ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInProgress?.(task.id, false);
                  }}
                  title="In progress — click to pause"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-all cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>In Progress</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInProgress?.(task.id, true);
                  }}
                  title="Mark In Progress"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] text-stone-400 dark:text-zinc-500 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 border border-transparent hover:border-amber-200/60 transition-all cursor-pointer"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span className="text-[10px] hidden sm:inline">Start</span>
                </button>
              )
            )}

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${priorityInfo.className}`}
            >
              {priorityInfo.label}
            </span>
          </div>

          {task.description && (
            <p
              className={`text-xs mt-1 line-clamp-2 ${
                task.is_completed
                  ? 'text-stone-400 dark:text-zinc-600'
                  : 'text-stone-600 dark:text-zinc-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Meta row: Due Date, Project */}
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-stone-400 dark:text-zinc-500">
            {task.due_date && (
              <span
                suppressHydrationWarning
                className={`flex items-center gap-1 font-medium ${
                  task.is_completed
                    ? 'text-stone-400 dark:text-zinc-500'
                    : isOverdue
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : isDueToday
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-stone-500 dark:text-zinc-400'
                }`}
              >
                {isOverdue && !task.is_completed ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {isOverdue && !task.is_completed
                  ? `Overdue: ${task.due_date}`
                  : isDueToday
                  ? 'Due Today'
                  : task.due_date}
              </span>
            )}

            {task.project && (
              <span className="flex items-center gap-1 text-stone-500 dark:text-zinc-400">
                <Hash className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500" />
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
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          aria-label="Delete task"
          className="p-1 rounded-md text-stone-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
