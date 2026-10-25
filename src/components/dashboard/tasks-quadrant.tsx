import React from 'react';
import { getTasks, type TaskWithProject } from '@/lib/actions/tasks';
import { getTodayDate } from '@/lib/utils/date';
import { TasksQuadrantClient } from './tasks-quadrant-client';

export async function TasksQuadrant() {
  const todayStr = getTodayDate();
  let allTasks: TaskWithProject[] = [];
  try {
    allTasks = await getTasks(todayStr);
  } catch (err) {
    console.error('TasksQuadrant error:', err);
  }
  const safeTasks = Array.isArray(allTasks) ? allTasks : [];

  return (
    <TasksQuadrantClient
      initialTasks={safeTasks}
      todayStr={todayStr}
    />
  );
}

export function TasksSkeleton() {
  return (
    <div className="flex flex-col gap-4 h-full w-full">
      <div className="flex-1 w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-slate-100/80 dark:border-zinc-800 shadow-sm animate-pulse">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="h-7 w-36 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-5 w-20 bg-slate-200 dark:bg-zinc-800 rounded-full" />
        </div>
        <div className="flex items-center gap-4 my-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 dark:bg-zinc-800/60 rounded" />
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="h-10 bg-slate-100 dark:bg-zinc-800/50 rounded-xl" />
          <div className="h-10 bg-slate-100 dark:bg-zinc-800/50 rounded-xl" />
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 mt-2">
          <div className="h-4 w-40 bg-slate-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="h-[96px] w-full rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100/80 dark:border-zinc-800 p-5 shadow-sm animate-pulse" />
    </div>
  );
}
