'use client';

import React from 'react';
import type { FocusInsight } from '@/lib/daily-loop/types';

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
  onSelectTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onStartDay: () => void;
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
  onSelectTask,
  onToggleTask,
  onStartDay,
  onAddTask,
}: MorningStateProps) {
  const incompleteTasks = tasks.filter((t) => !t.is_completed);
  const topPriorityTask =
    tasks.find((t) => t.id === selectedTaskId && !t.is_completed) ||
    incompleteTasks[0] ||
    null;

  const displayTasks = tasks.slice(0, 4);

  return (
    <div className="flex-1 flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-3.5">
        {/* Top Priority Panel */}
        <div className="p-4 rounded-xl bg-stone-50/90 dark:bg-zinc-800/60 border border-stone-200/70 dark:border-zinc-700/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-sans font-bold text-amber-700 dark:text-amber-400 tracking-wider uppercase">
              TOP PRIORITY
            </span>
            <span className="text-xs font-sans font-medium text-stone-500 dark:text-zinc-400">
              Ready for today?
            </span>
          </div>

          {topPriorityTask ? (
            <p
              className="text-base font-semibold text-stone-900 dark:text-zinc-100 tracking-tight mb-3 leading-snug"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {topPriorityTask.title}
            </p>
          ) : (
            <p
              className="text-base font-semibold text-stone-700 dark:text-zinc-300 tracking-tight mb-3 leading-snug"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Set your top priority for today
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={topPriorityTask ? onStartDay : onAddTask}
              className="h-9 px-4 rounded-xl bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-1.5 font-sans text-xs font-medium shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              <span>{topPriorityTask ? 'Start my day' : 'Add top priority'}</span>
            </button>
          </div>
        </div>

        {/* Context Pills: Deadlines in 48h & Pending Habits */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/70 dark:border-zinc-700/60 text-stone-700 dark:text-zinc-300">
            <svg
              className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="text-[11px] font-sans font-medium tabular-nums lining-nums"
              style={LINING_NUMS_STYLE}
            >
              {deadlines48hCount} {deadlines48hCount === 1 ? 'deadline' : 'deadlines'} in 48h
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 dark:bg-zinc-800/70 border border-stone-200/70 dark:border-zinc-700/60 text-stone-700 dark:text-zinc-300">
            <svg
              className="w-3.5 h-3.5 text-[#006c49] dark:text-emerald-400 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="text-[11px] font-sans font-medium tabular-nums lining-nums"
              style={LINING_NUMS_STYLE}
            >
              {pendingHabitsCount} {pendingHabitsCount === 1 ? 'habit' : 'habits'} pending
            </span>
          </div>
        </div>

        {/* Today's Plan Task List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
              Today&apos;s plan
            </span>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-sans font-medium text-stone-500 dark:text-zinc-400 tabular-nums lining-nums"
                style={LINING_NUMS_STYLE}
              >
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} scheduled
              </span>
              <button
                type="button"
                onClick={onAddTask}
                className="text-[11px] font-sans font-medium text-[#006c49] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {displayTasks.length === 0 ? (
            <div className="p-4 rounded-xl bg-stone-50/70 dark:bg-zinc-800/40 border border-dashed border-stone-300 dark:border-zinc-700 text-center">
              <p className="text-xs font-medium text-stone-600 dark:text-zinc-300 font-sans">
                No tasks scheduled for today yet.
              </p>
              <button
                type="button"
                onClick={onAddTask}
                className="mt-2 text-xs font-medium text-[#006c49] dark:text-emerald-400 hover:underline cursor-pointer font-sans"
              >
                Add your first task
              </button>
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
