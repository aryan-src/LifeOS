'use client';

import React from 'react';
import { Check, Clock, CheckCircle2, Play, Maximize2, Lightbulb } from 'lucide-react';
import type { FocusInsight } from '@/lib/daily-loop/types';
import type { ActiveTimerSnapshot } from './daytime-state';
import { EmptyState } from '@/components/ui/empty-state';

export interface TodayTaskItem {
  id: string;
  title: string;
  is_completed: boolean;
}

export interface MorningStateProps {
  tasks: TodayTaskItem[];
  selectedTaskId: string | null;
  deadlines48hCount: number;
  pendingHabitsCount: number;
  focusInsight: FocusInsight;
  activeTimer?: ActiveTimerSnapshot | null;
  onSelectTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onStartDay: () => void;
  onOpenFocusView?: () => void;
  onAddTask: () => void;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function MorningState({
  tasks,
  selectedTaskId,
  deadlines48hCount,
  pendingHabitsCount,
  focusInsight,
  activeTimer = null,
  onSelectTask,
  onToggleTask,
  onStartDay,
  onOpenFocusView,
  onAddTask,
}: MorningStateProps) {
  const incompleteTasks = tasks.filter((t) => !t.is_completed);
  const topPriorityTask =
    tasks.find((t) => t.id === selectedTaskId && !t.is_completed) ||
    incompleteTasks[0] ||
    null;

  const displayTasks = tasks.slice(0, 4);
  const isTimerLive =
    activeTimer !== null &&
    (activeTimer.status === 'running' ||
      activeTimer.status === 'paused' ||
      activeTimer.status === 'break');

  return (
    <div className="flex-1 flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-4">
        {/* Top Priority Panel */}
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-tertiary-container">
              Top Priority
            </span>
            <span className="font-sans text-body-sm text-on-surface-variant">
              Ready for today?
            </span>
          </div>

          <p className="font-sans text-headline-sm font-semibold text-on-surface tracking-tight mb-3 leading-snug">
            {topPriorityTask ? topPriorityTask.title : 'Set your top priority for today'}
          </p>

          {isTimerLive ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  {activeTimer.status === 'running' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      activeTimer.status === 'paused'
                        ? 'bg-on-tertiary-container'
                        : activeTimer.status === 'break'
                        ? 'bg-secondary/60'
                        : 'bg-secondary'
                    }`}
                  />
                </span>
                <span className="font-sans text-body-sm text-on-surface-variant">
                  {activeTimer.status === 'paused'
                    ? 'Paused · '
                    : activeTimer.status === 'break'
                    ? 'Break · '
                    : 'Session in progress · '}
                  <strong
                    className="font-mono font-semibold text-secondary"
                    style={LINING_NUMS_STYLE}
                  >
                    {activeTimer.remainingFormatted}
                  </strong>{' '}
                  left
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenFocusView}
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-sans text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Open focus view</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={topPriorityTask ? onStartDay : onAddTask}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 font-sans text-body-sm font-medium text-on-primary shadow-xs transition-opacity hover:opacity-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
              >
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span>{topPriorityTask ? 'Start my day' : 'Add top priority'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Context Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low px-2.5 py-1 text-on-surface">
            <Clock className="h-3.5 w-3.5 shrink-0 text-error" aria-hidden="true" />
            <span className="font-mono text-label-sm" style={LINING_NUMS_STYLE}>
              {deadlines48hCount} {deadlines48hCount === 1 ? 'deadline' : 'deadlines'} in 48h
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low px-2.5 py-1 text-on-surface">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden="true" />
            <span className="font-mono text-label-sm" style={LINING_NUMS_STYLE}>
              {pendingHabitsCount} {pendingHabitsCount === 1 ? 'habit' : 'habits'} pending
            </span>
          </div>
        </div>

        {/* Today's Plan Task List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
              Today&apos;s plan
            </span>
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-label-sm text-outline"
                style={LINING_NUMS_STYLE}
              >
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} scheduled
              </span>
              <button
                type="button"
                onClick={onAddTask}
                className="font-mono text-label-sm font-medium text-secondary hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {displayTasks.length === 0 ? (
            <EmptyState
              compact={true}
              title="No tasks scheduled for today yet."
              action={
                <button
                  type="button"
                  onClick={onAddTask}
                  className="font-mono text-label-sm font-medium text-secondary hover:underline cursor-pointer"
                >
                  Add your first task
                </button>
              }
            />
          ) : (
            <div className="space-y-1.5">
              {displayTasks.map((task) => {
                const isSelected = topPriorityTask?.id === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={`flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-colors cursor-pointer ${
                      isSelected && !task.is_completed
                        ? 'border-secondary/35 bg-secondary/10'
                        : 'border-outline-variant/40 bg-surface-container-low/70 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(task.id);
                        }}
                        aria-label={`Mark ${task.title} as ${task.is_completed ? 'incomplete' : 'complete'}`}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
                          task.is_completed
                            ? 'bg-secondary text-on-secondary'
                            : isSelected
                            ? 'bg-secondary/15 text-secondary'
                            : 'border border-outline-variant text-transparent hover:border-secondary'
                        }`}
                      >
                        {task.is_completed ? (
                          <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                        ) : isSelected ? (
                          <Play className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                        ) : null}
                      </button>
                      <p
                        className={`truncate font-sans text-body-sm ${
                          task.is_completed
                            ? 'text-outline line-through'
                            : isSelected
                            ? 'font-semibold text-on-surface'
                            : 'font-medium text-on-surface'
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Insight Footer (only shown when >= 14 days of focus data exist) */}
      {focusInsight.hasEnoughData && focusInsight.insightText && (
        <div className="flex shrink-0 items-center gap-2 border-t border-outline-variant/30 pt-3 text-on-surface-variant">
          <Lightbulb className="h-4 w-4 shrink-0 text-on-tertiary-container" aria-hidden="true" />
          <span className="font-sans text-body-sm">{focusInsight.insightText}</span>
        </div>
      )}
    </div>
  );
}
