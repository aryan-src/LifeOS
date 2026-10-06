'use client';

import React, { useOptimistic, useState, useTransition, useMemo } from 'react';
import { TaskItem } from './task-item';
import { TaskCreateInput } from './task-create-input';
import { toggleTask, deleteTask, type TaskWithProject } from '@/lib/actions/tasks';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { getTodayDate } from '@/lib/utils/date';
import { GlassCalendar, type CalendarProjectItem } from '@/components/ui/glass-calendar';
import { AlertTriangle } from 'lucide-react';

interface TaskChecklistProps {
  initialTasks: TaskWithProject[];
  projects: ProjectOption[];
  projectDeadlines?: CalendarProjectItem[];
}

type FilterTab = 'today' | 'upcoming' | 'completed' | 'all';

export function TaskChecklist({ initialTasks, projects, projectDeadlines }: TaskChecklistProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('today');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const todayStr = getTodayDate();
  const [selectedDueDate, setSelectedDueDate] = useState<string>(todayStr);
  const [, startTransition] = useTransition();

  // Non-blocking tab change using React 19 concurrent transitions
  const handleTabChange = (tab: FilterTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  // React 19 native useOptimistic:
  // Immediately flips the visual is_completed state while the task remains rendered
  // in the active list (visual grace period) until Server Action revalidation.
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    initialTasks,
    (state, update: { type: 'toggle'; taskId: string; targetState: boolean } | { type: 'delete'; taskId: string }) => {
      if (update.type === 'toggle') {
        return state.map((task) =>
          task.id === update.taskId
            ? { ...task, is_completed: update.targetState }
            : task
        );
      }
      if (update.type === 'delete') {
        return state.filter((task) => task.id !== update.taskId);
      }
      return state;
    }
  );

  const handleToggle = (taskId: string, targetState: boolean) => {
    setErrorMessage(null);

    startTransition(async () => {
      // 1. Instantly apply optimistic visual update
      setOptimisticTasks({ type: 'toggle', taskId, targetState });

      // 2. Execute Server Action returning envelope
      const response = await toggleTask(taskId, targetState);

      // 3. Catch failure and notify via Toast/Banner if rollback happens
      if (!response.success) {
        setErrorMessage(response.error || 'Failed to update task. Changes were rolled back.');
      }
    });
  };

  const handleDelete = (taskId: string) => {
    setErrorMessage(null);

    startTransition(async () => {
      setOptimisticTasks({ type: 'delete', taskId });
      const response = await deleteTask(taskId);
      if (!response.success) {
        setErrorMessage(response.error || 'Failed to delete task.');
      }
    });
  };

  // Memoize filtered tasks to prevent main-thread freeze on every re-render
  const filteredTasks = useMemo(() => {
    return optimisticTasks.filter((task) => {
      if (activeTab === 'completed') {
        return task.is_completed;
      }
      if (activeTab === 'upcoming') {
        return !task.is_completed && task.due_date && task.due_date > todayStr;
      }
      if (activeTab === 'today') {
        return !task.due_date || task.due_date <= todayStr;
      }
      return true; // 'all'
    });
  }, [optimisticTasks, activeTab, todayStr]);

  // Memoize tab counts
  const counts = useMemo(() => ({
    today: optimisticTasks.filter((t) => (!t.due_date || t.due_date <= todayStr) && !t.is_completed).length,
    upcoming: optimisticTasks.filter((t) => !t.is_completed && t.due_date && t.due_date > todayStr).length,
    completed: optimisticTasks.filter((t) => t.is_completed).length,
  }), [optimisticTasks, todayStr]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
      {/* Primary Tasks Column (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col gap-space-lg">
        {/* Toast Error Alert Banner */}
        {errorMessage && (
          <div className="flex items-center justify-between rounded-lg border border-error/30 bg-error-container p-3 text-on-error-container font-body-sm text-body-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Notion-style Quick Task Creation Bar */}
        <TaskCreateInput
          projects={projects}
          selectedDueDate={selectedDueDate}
          onError={(err) => setErrorMessage(err)}
        />

        {/* 2. Filter & View Tabs with Actions */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm py-space-xs">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-lg">
            <button
              type="button"
              onClick={() => handleTabChange('today')}
              className={`px-space-sm py-1 rounded font-body-sm text-body-sm font-medium transition-colors ${
                activeTab === 'today'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Today &amp; Overdue <span className="ml-1 text-label-sm text-on-surface-variant font-label-sm">({counts.today})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('upcoming')}
              className={`px-space-sm py-1 rounded font-body-sm text-body-sm font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Upcoming <span className="ml-1 text-label-sm text-outline font-label-sm">({counts.upcoming})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('completed')}
              className={`px-space-sm py-1 rounded font-body-sm text-body-sm font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Completed <span className="ml-1 text-label-sm text-outline font-label-sm">({counts.completed})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`px-space-sm py-1 rounded font-body-sm text-body-sm font-medium transition-colors hidden sm:inline-flex ${
                activeTab === 'all'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              All Tasks
            </button>
          </div>

          <div className="flex items-center gap-1 text-outline font-label-sm text-label-sm">
            <span>{filteredTasks.length} items shown</span>
          </div>
        </div>

        {/* 3. Task List Section: Deliverables */}
        <div className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between px-space-xs pt-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[18px] text-outline">crisis_alert</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">Deliverables</h2>
              <span className="font-label-sm text-label-sm bg-surface-container px-space-xs py-0.5 rounded text-outline">
                {filteredTasks.length} items
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {filteredTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant p-10 text-center bg-surface-container-lowest">
                <p className="font-body-sm text-body-sm text-outline">No tasks in this category.</p>
                <p className="font-label-sm text-label-sm text-outline mt-1">
                  Use the quick creation bar above or press ⌘K.
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Focus Companion & Context Workspace (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col gap-space-lg">
        {/* Focus Sprint Block */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Deep Work Sprint</span>
            <span className="inline-flex items-center gap-1 text-on-secondary-container bg-secondary-container px-2 py-0.5 rounded font-label-sm text-label-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Focus Mode
            </span>
          </div>
          <div className="flex items-baseline justify-between py-space-xs">
            <div>
              <span className="font-display text-display font-semibold tracking-tight text-on-surface">25:00</span>
              <p className="font-label-sm text-label-sm text-outline mt-0.5">Session: Pomodoro Standard</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[20px]">timer</span>
            </div>
          </div>
          {/* Micro session bar */}
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div className="bg-secondary h-full rounded-full transition-all" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Interactive Notion-styled Glass Calendar Widget */}
        <div className="flex justify-center">
          <GlassCalendar
            tasks={optimisticTasks}
            projects={projectDeadlines || []}
            onOpenTaskInput={(dateStr) => {
              setSelectedDueDate(dateStr);
            }}
          />
        </div>
      </div>
    </div>
  );
}
