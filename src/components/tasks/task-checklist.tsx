'use client';

import React, { useOptimistic, useState, useTransition, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskItem } from './task-item';
import { TaskCreateInput } from './task-create-input';
import {
  updateTaskStatus,
  deleteTask,
  type TaskWithProject,
} from '@/lib/actions/tasks';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { getTodayDate, getLocalDateString } from '@/lib/utils/date';
import {
  GlassCalendar,
  type CalendarProjectItem,
} from '@/components/ui/glass-calendar';
import { FocusTimer } from './focus-timer';
import { AlertTriangle, CheckCircle2, Target } from 'lucide-react';

interface TaskChecklistProps {
  initialTasks: TaskWithProject[];
  projects: ProjectOption[];
  projectDeadlines?: CalendarProjectItem[];
  initialSelectedDate?: string;
}

type FilterTab = 'today' | 'upcoming' | 'completed' | 'all';

type TaskOptimisticAction =
  | { type: 'toggle-complete'; taskId: string; targetState: boolean }
  | { type: 'toggle-in-progress'; taskId: string; targetState: boolean }
  | { type: 'delete'; taskId: string };

export function TaskChecklist({
  initialTasks,
  projects,
  projectDeadlines,
  initialSelectedDate,
}: TaskChecklistProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('today');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const todayStr = getTodayDate();
  const [selectedDueDate, setSelectedDueDate] = useState<string>(
    initialSelectedDate || todayStr
  );
  const [, startTransition] = useTransition();

  // Non-blocking tab change using React 19 concurrent transitions
  const handleTabChange = (tab: FilterTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  // React 19 native useOptimistic:
  // Instantaneous (0ms) visual update for Complete, Undo, and In Progress states
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    initialTasks,
    (state: TaskWithProject[], update: TaskOptimisticAction) => {
      if (update.type === 'toggle-complete') {
        return state.map((task) =>
          task.id === update.taskId
            ? {
                ...task,
                is_completed: update.targetState,
                in_progress: update.targetState ? false : task.in_progress,
                completed_at: update.targetState
                  ? new Date().toISOString()
                  : null,
              }
            : task
        );
      }
      if (update.type === 'toggle-in-progress') {
        return state.map((task) =>
          task.id === update.taskId
            ? {
                ...task,
                in_progress: update.targetState,
                is_completed: update.targetState ? false : task.is_completed,
                completed_at: update.targetState ? null : task.completed_at,
              }
            : task
        );
      }
      if (update.type === 'delete') {
        return state.filter((task) => task.id !== update.taskId);
      }
      return state;
    }
  );

  // Toggle complete state (with instant undo support)
  const handleToggleComplete = (taskId: string, targetState: boolean) => {
    setErrorMessage(null);

    startTransition(async () => {
      // 1. Instantly apply optimistic visual update
      setOptimisticTasks({ type: 'toggle-complete', taskId, targetState });

      // 2. Execute Server Action silently in the background
      const response = await updateTaskStatus(taskId, {
        is_completed: targetState,
        in_progress: targetState ? false : undefined,
      });

      // 3. Catch failure and notify via Toast/Banner if rollback happens
      if (!response.success) {
        setErrorMessage(
          response.error || 'Failed to update task. Changes were rolled back.'
        );
      }
    });
  };

  // Toggle in-progress state
  const handleToggleInProgress = (taskId: string, targetState: boolean) => {
    setErrorMessage(null);

    startTransition(async () => {
      // 1. Instantly apply optimistic visual update
      setOptimisticTasks({ type: 'toggle-in-progress', taskId, targetState });

      // 2. Execute Server Action silently in the background
      const response = await updateTaskStatus(taskId, {
        in_progress: targetState,
        is_completed: targetState ? false : undefined,
      });

      // 3. Catch failure and notify via Toast/Banner if rollback happens
      if (!response.success) {
        setErrorMessage(
          response.error ||
            'Failed to update in-progress status. Changes were rolled back.'
        );
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

  // Active deliverables (tasks that are NOT completed)
  const deliverables = useMemo(() => {
    if (activeTab === 'completed') return [];
    return optimisticTasks.filter((task) => {
      if (task.is_completed) return false;
      if (activeTab === 'upcoming') {
        return task.due_date && task.due_date > selectedDueDate;
      }
      if (activeTab === 'today') {
        return !task.due_date || task.due_date <= selectedDueDate;
      }
      return true; // 'all'
    });
  }, [optimisticTasks, activeTab, selectedDueDate]);

  // Completed tasks (strictly date-segregated by localized completed_at)
  // A task appears in the Completed Tasks section ONLY on the date it was completed.
  const completedTasks = useMemo(() => {
    return optimisticTasks.filter((task) => {
      if (!task.is_completed) return false;
      if (activeTab === 'all') {
        return true;
      }
      // For both 'today' (default view) and 'completed' tab:
      // Strictly match localized YYYY-MM-DD from completed_at against selectedDueDate.
      const taskCompletedDate = getLocalDateString(task.completed_at || task.created_at);
      return taskCompletedDate === selectedDueDate;
    });
  }, [optimisticTasks, activeTab, selectedDueDate]);

  // Total items shown in current view
  const totalItemsShown = deliverables.length + completedTasks.length;

  // Memoize tab counts strictly localized to selected date view
  const counts = useMemo(
    () => ({
      today: optimisticTasks.filter(
        (t) => (!t.due_date || t.due_date <= selectedDueDate) && !t.is_completed
      ).length,
      upcoming: optimisticTasks.filter(
        (t) => !t.is_completed && t.due_date && t.due_date > selectedDueDate
      ).length,
      completed: optimisticTasks.filter((t) => {
        if (!t.is_completed) return false;
        const taskCompletedDate = getLocalDateString(t.completed_at || t.created_at);
        return taskCompletedDate === selectedDueDate;
      }).length,
    }),
    [optimisticTasks, selectedDueDate]
  );

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
              className="text-xs hover:underline cursor-pointer"
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
          <div className="flex items-center gap-1 p-1 bg-surface-container-low dark:bg-zinc-900/60 dark:border dark:border-zinc-800/60 rounded-lg">
            <button
              type="button"
              onClick={() => handleTabChange('today')}
              className={`px-space-sm py-1 rounded font-body-sm text-body-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-surface-container-lowest dark:bg-zinc-800 text-on-surface dark:text-zinc-100 shadow-sm'
                  : 'text-on-surface-variant dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200 hover:bg-surface-container dark:hover:bg-zinc-800/50'
              }`}
            >
              Today &amp; Overdue{' '}
              <span className="ml-1 text-label-sm text-on-surface-variant dark:text-zinc-400 font-label-sm">
                ({counts.today})
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('upcoming')}
              className={`px-space-sm py-1 rounded font-body-sm text-body-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-surface-container-lowest dark:bg-zinc-800 text-on-surface dark:text-zinc-100 shadow-sm'
                  : 'text-on-surface-variant dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200 hover:bg-surface-container dark:hover:bg-zinc-800/50'
              }`}
            >
              Upcoming{' '}
              <span className="ml-1 text-label-sm text-outline dark:text-zinc-500 font-label-sm">
                ({counts.upcoming})
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('completed')}
              className={`px-space-sm py-1 rounded font-body-sm text-body-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-surface-container-lowest dark:bg-zinc-800 text-on-surface dark:text-zinc-100 shadow-sm'
                  : 'text-on-surface-variant dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200 hover:bg-surface-container dark:hover:bg-zinc-800/50'
              }`}
            >
              Completed{' '}
              <span className="ml-1 text-label-sm text-outline dark:text-zinc-500 font-label-sm">
                ({counts.completed})
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`px-space-sm py-1 rounded font-body-sm text-body-sm font-medium transition-colors hidden sm:inline-flex cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-surface-container-lowest dark:bg-zinc-800 text-on-surface dark:text-zinc-100 shadow-sm'
                  : 'text-on-surface-variant dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200 hover:bg-surface-container dark:hover:bg-zinc-800/50'
              }`}
            >
              All Tasks
            </button>
          </div>

          <div className="flex items-center gap-1 text-outline dark:text-zinc-400 font-label-sm text-label-sm">
            <span>{totalItemsShown} items shown</span>
          </div>
        </div>

        {/* 3. Primary Section: Deliverables (Active & In Progress tasks) */}
        {activeTab !== 'completed' && (
          <div
            className="flex flex-col gap-space-sm"
            data-purpose="deliverables-section"
          >
            <div className="flex items-center justify-between px-space-xs pt-space-xs">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface dark:text-zinc-100 font-medium">
                  Deliverables
                </h2>
                <span className="font-label-sm text-label-sm bg-surface-container dark:bg-zinc-800 px-space-xs py-0.5 rounded text-outline dark:text-zinc-400 font-mono">
                  {`${deliverables.length} ${deliverables.length === 1 ? 'item' : 'items'}`}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {deliverables.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200/90 dark:border-zinc-800/80 p-8 text-center bg-white/40 dark:bg-zinc-900/30">
                  <p className="font-body-sm text-body-sm text-stone-500 dark:text-zinc-400 font-medium">
                    All caught up! No active deliverables in this view.
                  </p>
                  <p className="font-label-sm text-label-sm text-stone-400 dark:text-zinc-500 mt-1">
                    Use the quick creation bar above or uncheck completed tasks to reactivate.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {deliverables.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      layoutId={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 32,
                        mass: 0.8,
                      }}
                    >
                      <TaskItem
                        task={task}
                        onToggle={handleToggleComplete}
                        onToggleInProgress={handleToggleInProgress}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        )}

        {/* 4. Distinct Bottom Section: Completed Tasks */}
        {(completedTasks.length > 0 || activeTab === 'completed') && (
          <div
            className="flex flex-col gap-space-sm pt-4 border-t border-stone-200/60 dark:border-zinc-800/60"
            data-purpose="completed-tasks-section"
          >
            <div className="flex items-center justify-between px-space-xs pt-space-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface dark:text-zinc-100 font-medium">
                  Completed Tasks
                </h2>
                <span className="font-label-sm text-label-sm bg-surface-container dark:bg-zinc-800 px-space-xs py-0.5 rounded text-outline dark:text-zinc-400 font-mono">
                  {`${completedTasks.length} ${completedTasks.length === 1 ? 'item' : 'items'}`}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {completedTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200/90 dark:border-zinc-800/80 p-8 text-center bg-white/40 dark:bg-zinc-900/30">
                  <p className="font-body-sm text-body-sm text-stone-500 dark:text-zinc-400">
                    No completed tasks yet. Completed items will appear here.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {completedTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      layoutId={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 32,
                        mass: 0.8,
                      }}
                    >
                      <TaskItem
                        task={task}
                        onToggle={handleToggleComplete}
                        onToggleInProgress={handleToggleInProgress}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Focus Companion & Context Workspace (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col gap-space-lg">
        {/* Fully Functional Pomodoro Focus Timer */}
        <FocusTimer />

        {/* Interactive Notion-styled Glass Calendar Widget */}
        <div className="flex justify-center">
          <GlassCalendar
            tasks={optimisticTasks}
            projects={projectDeadlines || []}
            selectedDate={new Date(selectedDueDate + 'T00:00:00')}
            onDateSelect={(date) => {
              const formatted = getLocalDateString(date);
              if (formatted) {
                setSelectedDueDate(formatted);
              }
            }}
            onOpenTaskInput={(dateStr) => {
              setSelectedDueDate(dateStr);
            }}
          />
        </div>
      </div>
    </div>
  );
}
