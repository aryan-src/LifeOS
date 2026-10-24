'use client';

import React, { useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { updateTaskStatus, type TaskWithProject } from '@/lib/actions/tasks';

interface TodayFocusCardProps {
  initialTasks: TaskWithProject[];
  todayStr: string;
  className?: string;
}

export function TodayFocusCard({
  initialTasks,
  todayStr,
  className = '',
}: TodayFocusCardProps) {
  const [, startTransition] = useTransition();

  const [optimisticTasks, setOptimisticTask] = useOptimistic(
    initialTasks,
    (state: TaskWithProject[], update: { taskId: string; is_completed: boolean }) =>
      state.map((t) =>
        t.id === update.taskId
          ? {
              ...t,
              is_completed: update.is_completed,
              completed_at: update.is_completed ? new Date().toISOString() : null,
            }
          : t
      )
  );

  const totalCount = optimisticTasks.length;
  const completedCount = optimisticTasks.filter((t) => t.is_completed).length;
  const pendingCount = Math.max(0, totalCount - completedCount);
  const percentDone = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  const pendingTasks = optimisticTasks
    .filter((t) => !t.is_completed)
    .sort((a, b) => {
      const dateA = a.due_date || '9999-99-99';
      const dateB = b.due_date || '9999-99-99';
      return dateA.localeCompare(dateB);
    });

  const overdueTasks = pendingTasks.filter((t) => t.due_date && t.due_date < todayStr);
  const displayTasks = pendingTasks.slice(0, 2);
  const nextTask = pendingTasks[0];

  const handleToggle = (task: TaskWithProject) => {
    const nextCompleted = !task.is_completed;
    startTransition(async () => {
      setOptimisticTask({ taskId: task.id, is_completed: nextCompleted });
      await updateTaskStatus(task.id, {
        is_completed: nextCompleted,
      });
    });
  };

  const handleOpenQuickTask = () => {
    window.dispatchEvent(new CustomEvent('open-quick-capture'));
  };

  return (
    <article
      className={`bg-white dark:bg-zinc-900/70 rounded-2xl border border-stone-200/70 dark:border-zinc-800/60 p-4 flex flex-col h-full overflow-hidden shadow-sm transition-colors ${className}`}
      data-purpose="card-todays-focus"
    >
      {/* Card Header */}
      <div className="shrink-0 flex items-center justify-between pb-2 border-b border-stone-100 dark:border-zinc-800/60">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 dark:text-zinc-500 font-semibold block leading-none mb-1">
            DEEP WORK &amp; TASKS
          </span>
          <h2 className="text-sm font-semibold text-stone-900 dark:text-zinc-100 tracking-tight leading-none">
            Today&apos;s Focus
          </h2>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar py-2.5 flex flex-col justify-between gap-3">
        {/* Progress Summary */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-stone-50/70 dark:bg-zinc-950/60 border border-stone-100 dark:border-zinc-800/60">
          <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                className="text-stone-200 dark:text-zinc-800"
                strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#10B981"
                strokeDasharray={`${percentDone}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-mono font-bold text-stone-900 dark:text-zinc-100 leading-none">
                {completedCount}/{totalCount || 0}
              </span>
            </div>
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
              <span className="truncate text-[11px]">
                {percentDone}% completed ({completedCount} of {totalCount})
              </span>
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="truncate">
                {overdueTasks.length > 0
                  ? `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} require attention`
                  : `${pendingCount} task${pendingCount === 1 ? '' : 's'} remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Task Checklist */}
        <div className="space-y-2">
          {displayTasks.length === 0 ? (
            <div className="py-4 text-center text-xs text-stone-400 dark:text-zinc-500">
              All tasks for today are cleared!
            </div>
          ) : (
            displayTasks.map((task) => {
              const isOverdue = !!(task.due_date && task.due_date < todayStr);
              const subtitle = task.project?.title || (task.due_date ? `Due ${task.due_date}` : 'General task');

              return (
                <div
                  key={task.id}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                    isOverdue
                      ? 'border-rose-200/80 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-stone-200/70 dark:border-zinc-800 bg-stone-50/40 dark:bg-zinc-950/40'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={task.is_completed}
                      onClick={() => handleToggle(task)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        task.is_completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isOverdue
                          ? 'border-rose-300 dark:border-rose-800 hover:border-rose-500 bg-white dark:bg-zinc-900'
                          : 'border-stone-300 dark:border-zinc-700 hover:border-stone-500 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      {task.is_completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </button>
                    <div className="truncate">
                      <span className="text-xs font-medium text-stone-900 dark:text-zinc-100 block truncate leading-tight">
                        {task.title}
                      </span>
                      <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500 leading-none block pt-0.5 truncate">
                        {subtitle}
                      </span>
                    </div>
                  </div>
                  {isOverdue && (
                    <span className="text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 shrink-0">
                      OVERDUE
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Next Up Prompt */}
        <div className="bg-stone-50/60 dark:bg-zinc-950/60 border border-stone-200/60 dark:border-zinc-800/60 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-stone-500 dark:text-zinc-400 truncate">
            Next up:{' '}
            <span className="font-medium text-stone-800 dark:text-zinc-200">
              {nextTask ? nextTask.title : 'All caught up'}
            </span>
          </span>
          <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500 font-semibold shrink-0">
            Est: 1h 45m
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-auto shrink-0 pt-2 border-t border-stone-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleOpenQuickTask}
          className="inline-flex items-center space-x-1 text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors font-medium text-[11px] cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>Add a task</span>
        </button>
        <Link
          className="text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 transition-colors font-medium flex items-center gap-0.5 text-[11px]"
          href="/tasks"
        >
          <span>Priority Matrix</span>
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}
