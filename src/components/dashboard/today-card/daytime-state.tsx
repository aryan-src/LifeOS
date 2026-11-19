'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Lightbulb, Maximize2, Play, Plus } from 'lucide-react';
import type { DailyMinimumChecklist, FocusInsight } from '@/lib/daily-loop/types';
import type { TodayTaskItem } from './morning-state';
import { EmptyState } from '@/components/ui/empty-state';

const DURATION_PRESETS = [
  { minutes: 15, label: '15m Focus' },
  { minutes: 25, label: '25m Pomodoro' },
  { minutes: 50, label: '50m Deep Block' },
  { minutes: 90, label: '90m Deep Work' },
] as const;

export interface ActiveTimerSnapshot {
  status: 'idle' | 'running' | 'paused' | 'finished' | 'break';
  remainingFormatted: string;
  taskTitle: string | null;
}

export interface DaytimeStateProps {
  tasks: TodayTaskItem[];
  selectedTaskId: string | null;
  checklist: DailyMinimumChecklist;
  focusInsight: FocusInsight;
  activeTimer?: ActiveTimerSnapshot | null;
  onSelectTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onStartFocus?: (durationMinutes: number, taskId: string | null, taskTitle: string | null) => void;
  onOpenFocusView?: () => void;
  onOpenQuickCapture?: (prefix: string) => void;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function DaytimeState({
  tasks,
  selectedTaskId,
  checklist,
  focusInsight,
  activeTimer = null,
  onSelectTask,
  onToggleTask,
  onStartFocus,
  onOpenFocusView,
  onOpenQuickCapture,
}: DaytimeStateProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);

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

  const handleLaunchFocus = () => {
    setIsDurationMenuOpen(false);
    onStartFocus?.(selectedMinutes, topPriorityTask?.id ?? null, topPriorityTask?.title ?? null);
  };

  return (
    <div className="flex-1 flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-4">
        {/* Top Priority Focus Launch Panel */}
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
          <span className="mb-1 block font-mono text-label-sm uppercase tracking-[0.08em] text-on-tertiary-container">
            Top Priority
          </span>

          <p className="mb-3 font-sans text-headline-sm font-semibold leading-snug tracking-tight text-on-surface">
            {isTimerLive && activeTimer.taskTitle
              ? activeTimer.taskTitle
              : topPriorityTask
              ? topPriorityTask.title
              : 'Pick a task to focus on'}
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
            <div className="relative inline-flex items-stretch rounded-xl bg-primary text-on-primary shadow-xs">
              <button
                type="button"
                onClick={handleLaunchFocus}
                className="flex h-9 items-center gap-1.5 rounded-l-xl px-3.5 font-sans text-body-sm font-medium transition-opacity hover:opacity-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
                style={LINING_NUMS_STYLE}
              >
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span>Start Focus ({selectedMinutes}m)</span>
              </button>
              <div className="w-px bg-on-primary/20" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setIsDurationMenuOpen((prev) => !prev)}
                aria-label="Select focus duration"
                aria-expanded={isDurationMenuOpen}
                className="flex items-center justify-center rounded-r-xl px-2.5 transition-opacity hover:opacity-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
              >
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              {isDurationMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-30 w-44 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-1 shadow-ambient">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => {
                        setSelectedMinutes(preset.minutes);
                        setIsDurationMenuOpen(false);
                      }}
                      className={`w-full rounded-lg px-2.5 py-1.5 text-left font-mono text-label-sm transition-colors cursor-pointer ${
                        selectedMinutes === preset.minutes
                          ? 'bg-secondary/12 font-semibold text-secondary'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                      style={LINING_NUMS_STYLE}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Daily Minimum Checklist (2 of 3 required) */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
              Daily minimum
            </span>
            <span
              className={`font-mono text-label-sm font-medium ${
                checklist.isQualified ? 'text-secondary' : 'text-on-surface-variant'
              }`}
              style={LINING_NUMS_STYLE}
            >
              {checklist.isQualified
                ? `${checklist.completedCount}/3 · streak safe`
                : `${checklist.completedCount}/${checklist.totalRequired} required for streak`}
            </span>
          </div>

          <div className="space-y-1.5">
            {/* 1. Focus Session */}
            <div
              className={`flex items-center justify-between rounded-lg border px-2.5 py-2 ${
                checklist.hasFocusSession
                  ? 'border-outline-variant/30 bg-surface-container-low/70'
                  : 'border-dashed border-outline-variant/60 bg-surface-container-lowest'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    checklist.hasFocusSession
                      ? 'bg-secondary text-on-secondary'
                      : 'border border-outline-variant'
                  }`}
                >
                  {checklist.hasFocusSession && (
                    <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />
                  )}
                </span>
                <span
                  className={`font-sans text-body-sm ${
                    checklist.hasFocusSession
                      ? 'text-outline line-through'
                      : 'font-medium text-on-surface'
                  }`}
                >
                  1 focus session
                </span>
              </div>
              <span
                className={`font-mono text-label-sm ${
                  checklist.hasFocusSession ? 'text-secondary' : 'text-outline'
                }`}
              >
                {checklist.hasFocusSession ? 'Done' : 'Pending'}
              </span>
            </div>

            {/* 2. Habit Done */}
            <div
              className={`flex items-center justify-between rounded-lg border px-2.5 py-2 ${
                checklist.hasHabitCompleted
                  ? 'border-outline-variant/30 bg-surface-container-low/70'
                  : 'border-dashed border-outline-variant/60 bg-surface-container-lowest'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    checklist.hasHabitCompleted
                      ? 'bg-secondary text-on-secondary'
                      : 'border border-outline-variant'
                  }`}
                >
                  {checklist.hasHabitCompleted && (
                    <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />
                  )}
                </span>
                <span
                  className={`font-sans text-body-sm ${
                    checklist.hasHabitCompleted
                      ? 'text-outline line-through'
                      : 'font-medium text-on-surface'
                  }`}
                >
                  1 habit done
                </span>
              </div>
              {checklist.hasHabitCompleted ? (
                <span className="font-mono text-label-sm text-secondary">Done</span>
              ) : (
                <Link
                  href="/habits"
                  className="font-mono text-label-sm font-medium text-secondary hover:underline"
                >
                  Check off
                </Link>
              )}
            </div>

            {/* 3. Expense Logged */}
            <div
              className={`flex items-center justify-between rounded-lg border px-2.5 py-2 ${
                checklist.hasExpenseLogged
                  ? 'border-outline-variant/30 bg-surface-container-low/70'
                  : 'border-dashed border-outline-variant/60 bg-surface-container-lowest'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    checklist.hasExpenseLogged
                      ? 'bg-secondary text-on-secondary'
                      : 'border border-outline-variant'
                  }`}
                >
                  {checklist.hasExpenseLogged && (
                    <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />
                  )}
                </span>
                <span
                  className={`font-sans text-body-sm ${
                    checklist.hasExpenseLogged
                      ? 'text-outline line-through'
                      : 'font-medium text-on-surface'
                  }`}
                >
                  1 expense logged
                </span>
              </div>
              {checklist.hasExpenseLogged ? (
                <span className="font-mono text-label-sm text-secondary">Done</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenQuickCapture?.('Expense: ')}
                  className="font-mono text-label-sm font-medium text-secondary hover:underline cursor-pointer"
                >
                  Log now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Focus Queue */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-label-sm uppercase tracking-[0.08em] text-on-surface-variant">
              Focus Queue
            </span>
            <button
              type="button"
              onClick={() => onOpenQuickCapture?.('Task: ')}
              className="flex items-center gap-1 font-mono text-label-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add Task</span>
            </button>
          </div>

          {displayTasks.length === 0 ? (
            <EmptyState compact={true} title="Your focus queue is clear." />
          ) : (
            <div className="space-y-1.5">
              {displayTasks.map((task, idx) => {
                const isSelected = topPriorityTask?.id === task.id;
                const sequence = String(idx + 1).padStart(2, '0');
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
                    <span
                      className={`font-mono text-label-sm shrink-0 ${
                        isSelected && !task.is_completed ? 'text-secondary font-semibold' : 'text-outline'
                      }`}
                      style={LINING_NUMS_STYLE}
                    >
                      {sequence}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Insight Footer */}
      {focusInsight.hasEnoughData && focusInsight.insightText && (
        <div className="flex shrink-0 items-center gap-2 border-t border-outline-variant/30 pt-3 text-on-surface-variant">
          <Lightbulb className="h-4 w-4 shrink-0 text-on-tertiary-container" aria-hidden="true" />
          <span className="font-sans text-body-sm">{focusInsight.insightText}</span>
        </div>
      )}
    </div>
  );
}
