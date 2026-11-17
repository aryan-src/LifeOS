'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { DailyMinimumChecklist, FocusInsight } from '@/lib/daily-loop/types';
import type { TodayTaskItem } from './morning-state';

const DURATION_PRESETS = [
  { minutes: 15, label: '15m Sprint' },
  { minutes: 25, label: '25m Pomodoro' },
  { minutes: 50, label: '50m Deep Block' },
  { minutes: 90, label: '90m Deep Work' },
] as const;

export interface DaytimeStateProps {
  tasks: TodayTaskItem[];
  selectedTaskId: string | null;
  checklist: DailyMinimumChecklist;
  focusInsight: FocusInsight;
  onSelectTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onStartFocus?: (durationMinutes: number, taskId: string | null) => void;
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
  onSelectTask,
  onToggleTask,
  onStartFocus,
  onOpenQuickCapture,
}: DaytimeStateProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
  const [focusLaunchNotice, setFocusLaunchNotice] = useState<string | null>(null);

  const incompleteTasks = tasks.filter((t) => !t.is_completed);
  const topPriorityTask =
    tasks.find((t) => t.id === selectedTaskId && !t.is_completed) ||
    incompleteTasks[0] ||
    null;

  const displayTasks = tasks.slice(0, 4);

  const handleLaunchFocus = () => {
    setIsDurationMenuOpen(false);
    if (onStartFocus) {
      onStartFocus(selectedMinutes, topPriorityTask?.id ?? null);
      return;
    }
    setFocusLaunchNotice(
      `Ready for ${selectedMinutes}m focus${topPriorityTask ? ` on "${topPriorityTask.title}"` : ''}. Live timer launches in Phase 3.`
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-3.5">
        {/* Top Priority Focus Launch Panel */}
        <div className="p-4 rounded-xl bg-stone-50/90 dark:bg-zinc-800/60 border border-stone-200/70 dark:border-zinc-700/70">
          <span className="text-[10px] font-sans font-bold text-amber-700 dark:text-amber-400 tracking-wider uppercase block mb-1">
            TOP PRIORITY
          </span>

          <p
            className="text-base font-semibold text-stone-900 dark:text-zinc-100 tracking-tight mb-3 leading-snug"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {topPriorityTask ? topPriorityTask.title : 'Pick a focus task from your queue'}
          </p>

          <div className="relative inline-flex items-stretch rounded-xl bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs">
            <button
              type="button"
              onClick={handleLaunchFocus}
              className="h-9 px-3.5 rounded-l-xl hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-1.5 font-sans text-xs font-medium cursor-pointer tabular-nums lining-nums"
              style={LINING_NUMS_STYLE}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              <span>Start Focus ({selectedMinutes}m)</span>
            </button>
            <div className="w-px bg-stone-700 dark:bg-zinc-300" />
            <button
              type="button"
              onClick={() => setIsDurationMenuOpen((prev) => !prev)}
              aria-label="Select focus duration"
              aria-expanded={isDurationMenuOpen}
              className="px-2 rounded-r-xl hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isDurationMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-30 w-44 p-1 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 shadow-lg">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => {
                      setSelectedMinutes(preset.minutes);
                      setIsDurationMenuOpen(false);
                      setFocusLaunchNotice(null);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-sans tabular-nums lining-nums transition-colors cursor-pointer ${
                      selectedMinutes === preset.minutes
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#006c49] dark:text-emerald-400 font-semibold'
                        : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
                    }`}
                    style={LINING_NUMS_STYLE}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {focusLaunchNotice && (
            <p className="mt-2 text-[11px] font-sans text-stone-600 dark:text-zinc-400">
              {focusLaunchNotice}
            </p>
          )}
        </div>

        {/* Daily Minimum Checklist (2 of 3 required) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
              Daily minimum
            </span>
            <span
              className={`text-[11px] font-sans font-medium tabular-nums lining-nums ${
                checklist.isQualified
                  ? 'text-[#006c49] dark:text-emerald-400'
                  : 'text-stone-500 dark:text-zinc-400'
              }`}
              style={LINING_NUMS_STYLE}
            >
              {checklist.isQualified
                ? `${checklist.completedCount}/3 · streak safe`
                : `${checklist.completedCount}/2 required for streak`}
            </span>
          </div>

          <div className="space-y-1.5">
            {/* 1. Focus Session */}
            <div
              className={`flex items-center justify-between p-2 rounded-lg border ${
                checklist.hasFocusSession
                  ? 'bg-stone-50/80 dark:bg-zinc-800/40 border-stone-200/50 dark:border-zinc-800'
                  : 'bg-white dark:bg-zinc-900/40 border-dashed border-stone-200 dark:border-zinc-700/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    checklist.hasFocusSession
                      ? 'bg-[#006c49]/15 text-[#006c49] dark:text-emerald-400'
                      : 'border border-stone-300 dark:border-zinc-600'
                  }`}
                >
                  {checklist.hasFocusSession && (
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-xs font-sans ${
                    checklist.hasFocusSession
                      ? 'text-stone-500 dark:text-zinc-400 line-through'
                      : 'text-stone-800 dark:text-zinc-200 font-medium'
                  }`}
                >
                  1 focus session
                </span>
              </div>
              <span className="text-[11px] font-sans text-stone-400 dark:text-zinc-500">
                {checklist.hasFocusSession ? 'Done' : 'Pending'}
              </span>
            </div>

            {/* 2. Habit Done */}
            <div
              className={`flex items-center justify-between p-2 rounded-lg border ${
                checklist.hasHabitCompleted
                  ? 'bg-stone-50/80 dark:bg-zinc-800/40 border-stone-200/50 dark:border-zinc-800'
                  : 'bg-white dark:bg-zinc-900/40 border-dashed border-stone-200 dark:border-zinc-700/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    checklist.hasHabitCompleted
                      ? 'bg-[#006c49]/15 text-[#006c49] dark:text-emerald-400'
                      : 'border border-stone-300 dark:border-zinc-600'
                  }`}
                >
                  {checklist.hasHabitCompleted && (
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-xs font-sans ${
                    checklist.hasHabitCompleted
                      ? 'text-stone-500 dark:text-zinc-400 line-through'
                      : 'text-stone-800 dark:text-zinc-200 font-medium'
                  }`}
                >
                  1 habit done
                </span>
              </div>
              {checklist.hasHabitCompleted ? (
                <span className="text-[11px] font-sans text-stone-400 dark:text-zinc-500">Done</span>
              ) : (
                <Link
                  href="/habits"
                  className="text-[11px] font-sans font-medium text-[#006c49] dark:text-emerald-400 hover:underline"
                >
                  Check off
                </Link>
              )}
            </div>

            {/* 3. Expense Logged */}
            <div
              className={`flex items-center justify-between p-2 rounded-lg border ${
                checklist.hasExpenseLogged
                  ? 'bg-stone-50/80 dark:bg-zinc-800/40 border-stone-200/50 dark:border-zinc-800'
                  : 'bg-white dark:bg-zinc-900/40 border-dashed border-stone-200 dark:border-zinc-700/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    checklist.hasExpenseLogged
                      ? 'bg-[#006c49]/15 text-[#006c49] dark:text-emerald-400'
                      : 'border border-stone-300 dark:border-zinc-600'
                  }`}
                >
                  {checklist.hasExpenseLogged && (
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-xs font-sans ${
                    checklist.hasExpenseLogged
                      ? 'text-stone-500 dark:text-zinc-400 line-through'
                      : 'text-stone-800 dark:text-zinc-200 font-medium'
                  }`}
                >
                  1 expense logged
                </span>
              </div>
              {checklist.hasExpenseLogged ? (
                <span className="text-[11px] font-sans text-stone-400 dark:text-zinc-500">Done</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenQuickCapture?.('Expense: ')}
                  className="text-[11px] font-sans font-medium text-[#006c49] dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Log now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Focus Queue */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
              Focus Queue
            </span>
            <button
              type="button"
              onClick={() => onOpenQuickCapture?.('Task: ')}
              className="text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors font-sans text-[11px] font-medium flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Add Task</span>
            </button>
          </div>

          {displayTasks.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-zinc-800/40 border border-dashed border-stone-300 dark:border-zinc-700 text-center">
              <p className="text-xs font-medium text-stone-600 dark:text-zinc-300 font-sans">
                Your focus queue is clear.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {displayTasks.map((task) => {
                const isSelected = topPriorityTask?.id === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                      isSelected && !task.is_completed
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-stone-50/60 dark:bg-zinc-800/40 border-stone-200/60 dark:border-zinc-700/60 hover:border-stone-300 dark:hover:border-zinc-600'
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
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          task.is_completed
                            ? 'bg-[#006c49] text-white'
                            : isSelected
                            ? 'bg-[#006c49]/15 text-[#006c49] dark:text-emerald-400'
                            : 'border border-stone-300 dark:border-zinc-600 text-transparent hover:border-[#006c49]'
                        }`}
                      >
                        {task.is_completed ? (
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : isSelected ? (
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        ) : null}
                      </button>
                      <p
                        className={`text-[13px] truncate font-sans ${
                          task.is_completed
                            ? 'text-stone-400 dark:text-zinc-500 line-through'
                            : isSelected
                            ? 'font-semibold text-stone-900 dark:text-zinc-100'
                            : 'font-medium text-stone-800 dark:text-zinc-200'
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
        <div className="pt-3 border-t border-stone-100 dark:border-zinc-800 flex items-center gap-2 text-stone-500 dark:text-zinc-400 shrink-0">
          <svg
            className="w-4 h-4 text-amber-500 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs font-sans">{focusInsight.insightText}</span>
        </div>
      )}
    </div>
  );
}
