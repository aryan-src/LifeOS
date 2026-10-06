import React from 'react';
import { getTasks } from '@/lib/actions/tasks';
import { getTodayDate } from '@/lib/utils/date';
import Link from 'next/link';

export async function TasksQuadrant() {
  const allTasks = await getTasks();
  const todayStr = getTodayDate();

  // Incomplete tasks scheduled today or overdue
  const todayTasks = allTasks
    .filter((t) => !t.is_completed && (!t.due_date || t.due_date <= todayStr))
    .slice(0, 3);

  const completedToday = allTasks.filter(
    (t) => t.is_completed && t.completed_at && t.completed_at.startsWith(todayStr)
  ).slice(0, 1);

  return (
    <article className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs p-6 md:p-8 flex flex-col justify-between gap-6 h-full min-w-0">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-outline-variant/20 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">checklist</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">Today&apos;s Focus</h2>
          </div>
          <Link
            href="/tasks"
            className="font-label-sm text-label-sm text-outline hover:text-on-surface flex items-center gap-1 transition-colors shrink-0"
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
              className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/15 bg-surface-container-low/40 min-w-0"
            >
              <span className="mt-0.5 material-symbols-outlined text-secondary text-[18px] shrink-0">check_box</span>
              <div className="flex flex-col min-w-0">
                <span className="font-body-md text-body-md line-through text-outline truncate">{task.title}</span>
                <span className="font-label-sm text-label-sm text-outline truncate">
                  Completed • {task.project ? `#${task.project.slug}` : 'General'}
                </span>
              </div>
            </div>
          ))}

          {todayTasks.length === 0 && completedToday.length === 0 ? (
            <div className="py-8 text-center text-body-sm text-outline font-normal">
              All tasks for today are clear!
            </div>
          ) : (
            todayTasks.map((task) => (
              <Link
                key={task.id}
                href="/tasks"
                className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 hover:bg-surface-container cursor-pointer transition-colors group min-w-0"
              >
                <span className="mt-0.5 material-symbols-outlined text-outline text-[18px] group-hover:text-primary shrink-0">
                  check_box_outline_blank
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-md text-body-md text-on-surface group-hover:text-primary font-medium truncate">
                    {task.title}
                  </span>
                  <span className="font-label-sm text-label-sm text-outline truncate">
                    {task.due_date ? `Due ${task.due_date}` : 'No deadline'} • {task.project ? `#${task.project.slug}` : 'Personal'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Inline Quick-Add Link */}
      <div className="pt-3 border-t border-outline-variant/20">
        <Link
          href="/tasks"
          className="flex items-center gap-2.5 bg-surface-container-low/70 px-3.5 py-2 rounded-xl hover:bg-surface-container border border-outline-variant/20 transition-colors text-on-surface-variant min-w-0"
        >
          <span className="material-symbols-outlined text-[16px] text-outline shrink-0">add_task</span>
          <span className="font-body-sm text-body-sm text-outline truncate">Open task workspace to add...</span>
          <span className="font-label-sm text-label-sm text-outline ml-auto shrink-0">↵</span>
        </Link>
      </div>
    </article>
  );
}

export function TasksSkeleton() {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 shadow-xs animate-pulse h-80 flex flex-col justify-between">
      <div className="h-5 w-36 bg-surface-container-high rounded-md" />
      <div className="space-y-3">
        <div className="h-12 bg-surface-container-low rounded-xl" />
        <div className="h-12 bg-surface-container-low rounded-xl" />
      </div>
      <div className="h-9 bg-surface-container-low rounded-xl" />
    </div>
  );
}
