import React from 'react';
import { getTasks, type TaskWithProject } from '@/lib/actions/tasks';
import { getTodayDate, formatCalendarDate } from '@/lib/utils/date';
import Link from 'next/link';

export async function TasksQuadrant() {
  let allTasks: TaskWithProject[] = [];
  try {
    allTasks = await getTasks();
  } catch (err) {
    console.error('TasksQuadrant error:', err);
  }
  const safeTasks = Array.isArray(allTasks) ? allTasks : [];
  const todayStr = getTodayDate();

  // Incomplete tasks scheduled today or overdue
  const todayTasks = safeTasks
    .filter((t) => !t?.is_completed && (!t?.due_date || t.due_date <= todayStr))
    .slice(0, 3);

  const completedToday = safeTasks.filter(
    (t) => t?.is_completed && typeof t?.completed_at === 'string' && t.completed_at.startsWith(todayStr)
  ).slice(0, 1);

  return (
    <article className="p-6 md:p-8 flex flex-col justify-between gap-6 h-full min-w-0 relative z-10">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-outline-variant/20 dark:border-zinc-800/60 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-secondary dark:text-emerald-400 text-[20px] shrink-0">checklist</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface dark:text-zinc-100 font-semibold truncate">Today&apos;s Focus</h2>
          </div>
          <Link
            href="/tasks"
            className="font-label-sm text-label-sm text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100 flex items-center gap-1 transition-colors shrink-0"
          >
            <span>Priority Matrix</span>
            <span className="material-symbols-outlined text-[14px] shrink-0">arrow_forward</span>
          </Link>
        </div>

        {/* Interactive Checklist Presentation */}
        <div className="flex flex-col gap-2.5">
          {completedToday.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/15 dark:border-zinc-800/50 bg-surface-container-low/40 dark:bg-zinc-800/30 min-w-0"
            >
              <span className="mt-0.5 material-symbols-outlined text-secondary dark:text-emerald-400 text-[18px] shrink-0">check_box</span>
              <div className="flex flex-col min-w-0">
                <span className="font-body-md text-body-md line-through text-outline dark:text-zinc-500 truncate">{task.title}</span>
                <span className="font-label-sm text-label-sm text-outline dark:text-zinc-500 truncate">
                  Completed • {task.project ? `#${task.project.slug}` : 'General'}
                </span>
              </div>
            </div>
          ))}

          {todayTasks.length === 0 && completedToday.length === 0 ? (
            <div className="py-8 text-center text-body-sm text-outline dark:text-zinc-500 font-normal">
              All tasks for today are clear!
            </div>
          ) : (
            todayTasks.map((task) => (
              <Link
                key={task.id}
                href="/tasks"
                className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/20 dark:border-zinc-800/60 bg-surface-container-low/50 dark:bg-zinc-800/40 hover:bg-surface-container dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group min-w-0"
              >
                <span className="mt-0.5 material-symbols-outlined text-outline dark:text-zinc-500 text-[18px] group-hover:text-primary dark:group-hover:text-emerald-400 shrink-0">
                  check_box_outline_blank
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-md text-body-md text-on-surface dark:text-zinc-100 group-hover:text-primary dark:group-hover:text-emerald-400 font-medium truncate">
                    {task.title}
                  </span>
                  <span suppressHydrationWarning className="font-label-sm text-label-sm text-outline dark:text-zinc-400 truncate">
                    {task.due_date ? `Due ${formatCalendarDate(task.due_date, 'short')}` : 'No deadline'} • {task.project ? `#${task.project.slug}` : 'Personal'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Inline Quick-Add Link */}
      <div className="pt-3 border-t border-outline-variant/20 dark:border-zinc-800/60">
        <Link
          href="/tasks"
          className="flex items-center gap-2.5 bg-surface-container-low/70 dark:bg-zinc-800/50 px-3.5 py-2 rounded-xl hover:bg-surface-container dark:hover:bg-zinc-800/80 border border-outline-variant/20 dark:border-zinc-800/60 transition-colors text-on-surface-variant dark:text-zinc-300 min-w-0"
        >
          <span className="material-symbols-outlined text-[16px] text-outline dark:text-zinc-400 shrink-0">add_task</span>
          <span className="font-body-sm text-body-sm text-outline dark:text-zinc-400 truncate">Open task workspace to add...</span>
          <span className="font-label-sm text-label-sm text-outline dark:text-zinc-500 ml-auto shrink-0">↵</span>
        </Link>
      </div>
    </article>
  );
}

export function TasksSkeleton() {
  return (
    <article className="p-6 md:p-8 animate-pulse h-full min-w-0 flex flex-col justify-between gap-6 relative z-10">
      <div className="h-5 w-36 bg-surface-container-high dark:bg-zinc-800 rounded-md" />
      <div className="space-y-3">
        <div className="h-12 bg-surface-container-low dark:bg-zinc-800/60 rounded-xl" />
        <div className="h-12 bg-surface-container-low dark:bg-zinc-800/60 rounded-xl" />
      </div>
      <div className="h-9 bg-surface-container-low dark:bg-zinc-800/60 rounded-xl" />
    </article>
  );
}
