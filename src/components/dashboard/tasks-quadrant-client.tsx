'use client';

import React from 'react';
import type { TaskWithProject } from '@/lib/actions/tasks';
import { TodayFocusCard } from '@/components/tasks/today-focus-card';
import { FocusCockpitWidget } from '@/components/dashboard/focus-cockpit-widget';

interface TasksQuadrantClientProps {
  initialTasks: TaskWithProject[];
  todayStr: string;
}

export function TasksQuadrantClient({
  initialTasks,
  todayStr,
}: TasksQuadrantClientProps) {
  return (
    <div className="flex flex-col gap-4 h-full w-full">
      <TodayFocusCard
        initialTasks={initialTasks}
        todayStr={todayStr}
        className="flex-1"
      />
      <FocusCockpitWidget className="w-full" />
    </div>
  );
}
