'use client';

import React from 'react';
import type { TaskWithProject } from '@/lib/actions/tasks';
import { TodayFocusCard } from '@/components/tasks/today-focus-card';

interface TasksQuadrantClientProps {
  initialTasks: TaskWithProject[];
  todayStr: string;
}

export function TasksQuadrantClient({
  initialTasks,
  todayStr,
}: TasksQuadrantClientProps) {
  return (
    <TodayFocusCard
      initialTasks={initialTasks}
      todayStr={todayStr}
      className="w-full h-full"
    />
  );
}
