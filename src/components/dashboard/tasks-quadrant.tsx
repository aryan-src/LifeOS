import React from 'react';
import { getTasks, type TaskWithProject } from '@/lib/actions/tasks';
import { getTodayDate } from '@/lib/utils/date';
import { TasksQuadrantClient } from './tasks-quadrant-client';

export async function TasksQuadrant() {
  let allTasks: TaskWithProject[] = [];
  try {
    allTasks = await getTasks();
  } catch (err) {
    console.error('TasksQuadrant error:', err);
  }
  const safeTasks = Array.isArray(allTasks) ? allTasks : [];
  const todayStr = getTodayDate();

  return (
    <TasksQuadrantClient
      initialTasks={safeTasks}
      todayStr={todayStr}
    />
  );
}

export function TasksSkeleton() {
  return (
    <div className="w-full h-full min-w-0 bg-white dark:bg-zinc-900/70 rounded-2xl p-6 flex flex-col justify-between border border-stone-200/70 dark:border-zinc-800/60 shadow-sm animate-pulse">
      <div className="flex items-center justify-between pb-2 border-b border-[#07343C]/10 dark:border-zinc-800/60">
        <div className="h-6 w-36 bg-stone-200 dark:bg-zinc-800 rounded" />
        <div className="h-5 w-24 bg-stone-200 dark:bg-zinc-800 rounded-full" />
      </div>
      <div className="flex items-center gap-6 my-auto">
        <div className="w-[180px] h-[180px] rounded-full bg-stone-100 dark:bg-zinc-800/50 shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-10 bg-stone-100 dark:bg-zinc-800/50 rounded-xl" />
          <div className="h-10 bg-stone-100 dark:bg-zinc-800/50 rounded-xl" />
        </div>
      </div>
      <div className="pt-2 border-t border-[#07343C]/10 dark:border-zinc-800/60">
        <div className="h-4 w-48 bg-stone-200 dark:bg-zinc-800 rounded" />
      </div>
    </div>
  );
}
