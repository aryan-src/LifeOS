'use client';

import React, { useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { updateTaskStatus, type TaskWithProject } from '@/lib/actions/tasks';
import { formatCalendarDate } from '@/lib/utils/date';
import { Check } from 'lucide-react';

interface TasksQuadrantClientProps {
  initialTasks: TaskWithProject[];
  todayStr: string;
}

export function TasksQuadrantClient({
  initialTasks,
  todayStr,
}: TasksQuadrantClientProps) {
  const [, startTransition] = useTransition();

  // React 19 useOptimistic for instant task completion toggling
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

  // Arc calculation for r=38 (Circumference ≈ 238.76)
  const circumference = 238.76;
  const strokeDashoffset = circumference - (percentDone / 100) * circumference;

  // Pending tasks scheduled today or overdue
  const pendingTasks = optimisticTasks
    .filter((t) => !t.is_completed)
    .sort((a, b) => {
      const dateA = a.due_date || '9999-99-99';
      const dateB = b.due_date || '9999-99-99';
      return dateA.localeCompare(dateB);
    });

  const nextTask = pendingTasks[0];
  const displayTasks = pendingTasks.slice(0, 2);

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
    <section className="w-full h-full min-w-0 bg-white dark:bg-zinc-900/70 text-[#07343C] dark:text-zinc-100 rounded-2xl p-5 xl:p-6 flex flex-col justify-between border border-[#07343C]/10 dark:border-zinc-800/60 shadow-xs transition-colors">
      {/* Header row */}
      <div className="flex items-center justify-between pb-2 border-b border-[#07343C]/10 dark:border-zinc-800/60">
        <h2 className="font-serif text-[24px] xl:text-[26px] font-semibold text-[#07343C] dark:text-zinc-100 tracking-tight">
          Today&apos;s Focus
        </h2>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] dark:bg-amber-950/40 text-[#92400E] dark:text-amber-300 border border-[#FDE68A] dark:border-amber-800/60 font-mono">
          {pendingCount} pending today
        </span>
      </div>

      {/* Center area: Emerald progress dial + Tasks list */}
      <div className="flex flex-col sm:flex-row items-center gap-4 xl:gap-6 my-auto py-3 w-full min-w-0">
        {/* Arc Dial with Organic Emerald Stroke */}
        <div className="relative w-[140px] h-[140px] xl:w-[165px] xl:h-[165px] shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              fill="none"
              r="38"
              stroke="currentColor"
              className="text-[#F3F0EA] dark:text-zinc-800"
              strokeWidth="9"
            />
            <circle
              cx="50"
              cy="50"
              fill="none"
              r="38"
              stroke="#10B981"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="9"
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-serif text-[38px] xl:text-[42px] font-bold text-[#07343C] dark:text-zinc-100 leading-none font-mono tabular-nums">
              {completedCount}/{totalCount || 0}
            </span>
            <span className="text-[12px] text-[#10B981] dark:text-emerald-400 font-semibold mt-1 font-mono">
              {percentDone}% done
            </span>
          </div>
        </div>

        {/* Tasks checklist */}
        <div className="flex-1 w-full min-w-0 divide-y divide-[#07343C]/10 dark:divide-zinc-800/60">
          {displayTasks.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-[#07343C]/60 dark:text-zinc-400">
              All tasks for today are completed!
            </div>
          ) : (
            displayTasks.map((task) => {
              const isOverdue = !!(task.due_date && task.due_date < todayStr);
              const isP1 = task.priority >= 4;
              const isP2 = task.priority === 3;

              return (
                <div
                  key={task.id}
                  className="py-2.5 xl:py-3 flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={task.is_completed}
                      aria-label={`Mark task ${task.title} as completed`}
                      onClick={() => handleToggle(task)}
                      className={`w-4 h-4 rounded-full border shrink-0 transition-colors flex items-center justify-center cursor-pointer ${
                        task.is_completed
                          ? 'bg-[#10B981] border-[#10B981] text-white'
                          : 'border-[#07343C]/30 dark:border-zinc-600 hover:border-[#10B981] bg-white dark:bg-zinc-800'
                      }`}
                    >
                      {task.is_completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </button>
                    <div className="min-w-0">
                      <div
                        className={`text-[13px] xl:text-[14px] font-medium leading-tight truncate ${
                          task.is_completed
                            ? 'line-through text-[#07343C]/40 dark:text-zinc-500'
                            : 'text-[#07343C] dark:text-zinc-100'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-[11px] xl:text-[12px] text-[#07343C]/60 dark:text-zinc-400 mt-0.5 font-mono">
                        {task.due_date ? `Due ${formatCalendarDate(task.due_date, 'short')}` : 'No due date'}
                      </div>
                    </div>
                  </div>

                  {/* Priority / Overdue Badges */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FFF1F2] dark:bg-rose-950/40 border border-[#FECDD3] dark:border-rose-900/60 text-[#BE123C] dark:text-rose-400 text-[10px] font-semibold uppercase tracking-wider font-mono">
                        Overdue
                      </span>
                    )}
                    {!isOverdue && isP1 && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-900/60 text-[#92400E] dark:text-amber-300 text-[10px] font-semibold uppercase tracking-wider font-mono">
                        P1
                      </span>
                    )}
                    {!isOverdue && !isP1 && isP2 && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 text-[10px] font-semibold uppercase tracking-wider font-mono">
                        P2
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Next up & footer block */}
      <div>
        <div className="text-[12px] text-[#07343C]/60 dark:text-zinc-400 font-medium font-mono">
          ✓ {completedCount} completed today
        </div>
        <div className="text-[17px] xl:text-[18px] font-serif font-medium text-[#07343C] dark:text-zinc-100 mt-0.5 truncate">
          Next up: {nextTask ? nextTask.title : 'All tasks cleared'}
        </div>
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#07343C]/10 dark:border-zinc-800/60 text-xs">
          <button
            type="button"
            onClick={handleOpenQuickTask}
            className="text-[#07343C]/80 dark:text-zinc-300 hover:text-[#07343C] dark:hover:text-zinc-100 font-medium flex items-center gap-1 transition-colors cursor-pointer text-[12px]"
          >
            <span className="text-sm font-bold text-[#10B981] dark:text-emerald-400">+</span>
            <span>Add a task</span>
          </button>
          <Link
            href="/tasks"
            className="text-[#0B5563] dark:text-emerald-400 hover:underline font-medium text-[12px]"
          >
            Priority Matrix →
          </Link>
        </div>
      </div>
    </section>
  );
}
