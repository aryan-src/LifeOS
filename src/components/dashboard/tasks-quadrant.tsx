import React from 'react';
import { getTasks } from '@/lib/actions/tasks';
import Link from 'next/link';

export async function TasksQuadrant() {
  const allTasks = await getTasks();
  const todayStr = new Date().toISOString().split('T')[0];

  // Incomplete tasks scheduled today or overdue
  const todayTasks = allTasks
    .filter((t) => !t.is_completed && (!t.due_date || t.due_date <= todayStr))
    .slice(0, 3);

  const completedToday = allTasks.filter(
    (t) => t.is_completed && t.completed_at && t.completed_at.startsWith(todayStr)
  ).slice(0, 1);

  return (
    <article className="rounded bg-surface-container-lowest shadow-sm p-space-lg flex flex-col justify-between gap-space-md h-full">
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-space-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">checklist</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">Today&apos;s Focus</h2>
          </div>
          <Link
            href="/tasks"
            className="font-label-sm text-label-sm text-outline hover:text-on-surface flex items-center gap-0.5 transition-colors"
          >
            <span>Priority Matrix</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>

        {/* Interactive Checklist Presentation */}
        <div className="flex flex-col gap-2">
          {completedToday.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-space-sm p-2 rounded bg-surface-container-low/50"
            >
              <span className="mt-1 material-symbols-outlined text-secondary text-[18px]">check_box</span>
              <div className="flex flex-col min-w-0">
                <span className="font-body-md text-body-md line-through text-outline truncate">{task.title}</span>
                <span className="font-label-sm text-label-sm text-outline">
                  Completed • {task.project ? `#${task.project.slug}` : 'General'}
                </span>
              </div>
            </div>
          ))}

          {todayTasks.length === 0 && completedToday.length === 0 ? (
            <div className="p-4 text-center text-body-sm text-outline">
              All tasks for today are clear!
            </div>
          ) : (
            todayTasks.map((task) => (
              <Link
                key={task.id}
                href="/tasks"
                className="flex items-start gap-space-sm p-2 rounded hover:bg-surface-container-low cursor-pointer transition-colors group"
              >
                <span className="mt-1 material-symbols-outlined text-outline text-[18px] group-hover:text-primary">
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
      <div className="pt-space-xs border-t border-surface-container-high/60 mt-2">
        <Link
          href="/tasks"
          className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded hover:bg-surface-container transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[16px] text-outline">add_task</span>
          <span className="font-body-sm text-body-sm text-outline">Open task workspace to add...</span>
          <span className="font-label-sm text-label-sm text-outline ml-auto">↵</span>
        </Link>
      </div>
    </article>
  );
}

export function TasksSkeleton() {
  return (
    <div className="rounded bg-surface-container-lowest p-space-lg shadow-sm animate-pulse h-80 flex flex-col justify-between">
      <div className="h-5 w-32 bg-surface-container-high rounded" />
      <div className="space-y-2.5">
        <div className="h-12 bg-surface-container-low rounded" />
        <div className="h-12 bg-surface-container-low rounded" />
      </div>
      <div className="h-8 bg-surface-container-low rounded" />
    </div>
  );
}
