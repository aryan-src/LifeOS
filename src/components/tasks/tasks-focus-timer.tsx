'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  Square,
  Maximize2,
  ChevronDown,
  AlertCircle,
  Check,
  SkipForward,
  RotateCcw,
} from 'lucide-react';
import { useFocusTimerStore } from '@/lib/store/use-focus-timer-store';
import {
  computeRemainingSeconds,
  formatCountdownMMSS,
  getSaveNoticeContent,
} from '@/lib/daily-loop/focus-timer-engine';
import { isValidUuid } from '@/lib/validations';

export interface TasksFocusTimerProps {
  tasks: Array<{ id: string; title: string }>;
  boundTaskId?: string | null;
  onBindTask?: (task: { id: string; title: string } | null) => void;
  onTaskStatusChange?: (taskId: string, inProgress: boolean) => void;
}

const DURATION_PRESETS = [
  { minutes: 15, label: '15m' },
  { minutes: 25, label: '25m' },
  { minutes: 50, label: '50m' },
  { minutes: 90, label: '90m' },
] as const;

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

/**
 * Shared start handler for the Tasks page Global Focus Timer.
 * Starts a session in `useFocusTimerStore` even with no task selected,
 * and strictly guards task status syncing so invalid IDs never reach `updateTaskStatus`.
 */
export function launchTasksFocusSession(params: {
  durationMinutes: number;
  selectedTask: { id: string; title: string } | null;
  startFocus: (args: {
    durationMinutes: number;
    taskId?: string | null;
    taskTitle?: string | null;
    openFullscreen?: boolean;
  }) => void;
  onTaskStatusChange?: (taskId: string, inProgress: boolean) => void;
}): void {
  const { durationMinutes, selectedTask, startFocus, onTaskStatusChange } = params;
  const validTaskId = selectedTask && isValidUuid(selectedTask.id) ? selectedTask.id : null;
  const taskTitle = selectedTask ? selectedTask.title : null;

  startFocus({
    durationMinutes,
    taskId: validTaskId,
    taskTitle,
    openFullscreen: true,
  });

  if (validTaskId && onTaskStatusChange) {
    onTaskStatusChange(validTaskId, true);
  }
}

/**
 * Tasks page Focus Timer card wired directly to the Global Focus Timer store (`useFocusTimerStore`).
 * Shares state, saving rules, early-exit threshold, and Full-Screen Focus Mode with the Today card.
 */
export function TasksFocusTimer({
  tasks,
  boundTaskId = null,
  onBindTask,
  onTaskStatusChange,
}: TasksFocusTimerProps) {
  const timer = useFocusTimerStore((s) => s.timer);
  const isSaving = useFocusTimerStore((s) => s.isSaving);
  const startFocus = useFocusTimerStore((s) => s.startFocus);
  const pauseFocus = useFocusTimerStore((s) => s.pauseFocus);
  const resumeFocus = useFocusTimerStore((s) => s.resumeFocus);
  const stopEarly = useFocusTimerStore((s) => s.stopEarly);
  const discardPaused = useFocusTimerStore((s) => s.discardPaused);
  const skipBreak = useFocusTimerStore((s) => s.skipBreak);
  const openFullscreen = useFocusTimerStore((s) => s.openFullscreen);
  const flushPendingSaves = useFocusTimerStore((s) => s.flushPendingSaves);

  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [localTaskId, setLocalTaskId] = useState<string | null>(boundTaskId);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync externally bound task ID (e.g. clicking "In Progress" on a task row)
  useEffect(() => {
    setLocalTaskId(boundTaskId);
  }, [boundTaskId]);

  // Close task selector on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // 1s visual refresh while timer is actively running or in break
  useEffect(() => {
    if (timer.status !== 'running' && timer.status !== 'break') return;
    setNowMs(Date.now());
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timer.status]);

  // Only bind to real tasks present in `tasks`; never fall back to fake placeholders
  const selectedTask = useMemo(() => {
    if (!localTaskId) return null;
    return tasks.find((t) => t.id === localTaskId) ?? null;
  }, [localTaskId, tasks]);

  const isRunning = timer.status === 'running';
  const isPaused = timer.status === 'paused';
  const isBreak = timer.status === 'break';
  const isActive = isRunning || isPaused || isBreak;

  const remainingSeconds = isActive
    ? computeRemainingSeconds(timer, nowMs)
    : selectedMinutes * 60;

  const displayTaskTitle = isActive
    ? timer.taskTitle || 'No task selected'
    : selectedTask
    ? selectedTask.title
    : 'No task selected';

  const statusLabel = isRunning
    ? 'Focusing'
    : isPaused
    ? timer.isStalePause
      ? 'Paused for a while'
      : 'Paused'
    : isBreak
    ? 'Break'
    : 'Ready';

  const handleSelectTask = (task: { id: string; title: string } | null) => {
    setLocalTaskId(task ? task.id : null);
    onBindTask?.(task);
    setIsDropdownOpen(false);
  };

  const handleStart = () => {
    launchTasksFocusSession({
      durationMinutes: selectedMinutes,
      selectedTask,
      startFocus,
      onTaskStatusChange,
    });
  };

  const handleStopEarly = () => {
    const res = stopEarly();
    if (res.qualified && res.sessionToPersist) {
      void flushPendingSaves();
    }
  };

  const hasUnsavedNotice =
    timer.pendingUnsavedSessions.length > 0 && Boolean(timer.saveError);

  return (
    <section
      aria-label="Global Focus Timer"
      data-purpose="tasks-global-focus-timer"
      className="rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h2
            className="text-base font-semibold text-stone-900 dark:text-zinc-100 tracking-tight"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Focus Timer
          </h2>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full border ${
            isRunning
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#006c49] dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/60'
              : isPaused
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/60'
              : isBreak
              ? 'bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border-stone-200/70 dark:border-zinc-700'
              : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border-stone-200/60 dark:border-zinc-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isRunning
                ? 'bg-[#006c49] dark:bg-emerald-400'
                : isPaused
                ? 'bg-amber-500'
                : isBreak
                ? 'bg-[#6B8F78]'
                : 'bg-stone-400 dark:bg-zinc-500'
            }`}
          />
          <span>{statusLabel}</span>
        </span>
      </div>

      {/* Countdown Readout */}
      <div className="flex flex-col items-center py-2">
        <div
          className="text-4xl font-mono font-semibold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums lining-nums"
          style={LINING_NUMS_STYLE}
          data-purpose="tasks-timer-readout"
        >
          {formatCountdownMMSS(remainingSeconds)}
        </div>
        <p className="mt-1.5 text-xs font-sans text-stone-500 dark:text-zinc-400 text-center truncate max-w-full">
          {isBreak ? 'Short break — rest your eyes' : displayTaskTitle}
        </p>
      </div>

      {/* Duration Presets (Idle state only) */}
      {!isActive && (
        <div
          className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-stone-100/80 dark:bg-zinc-800/70 border border-stone-200/60 dark:border-zinc-700/60"
          role="group"
          aria-label="Focus duration presets"
        >
          {DURATION_PRESETS.map((preset) => {
            const active = selectedMinutes === preset.minutes;
            return (
              <button
                key={preset.minutes}
                type="button"
                onClick={() => setSelectedMinutes(preset.minutes)}
                className={`py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer tabular-nums lining-nums ${
                  active
                    ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-xs border border-stone-200/80 dark:border-zinc-700'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
                }`}
                style={LINING_NUMS_STYLE}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Primary Action Controls */}
      <div className="flex items-center gap-2">
        {!isActive && (
          <button
            type="button"
            onClick={handleStart}
            className="flex-1 h-10 px-4 rounded-xl bg-stone-900 dark:bg-zinc-100 hover:bg-stone-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-sans font-medium transition-colors inline-flex items-center justify-center gap-2 cursor-pointer tabular-nums lining-nums"
            style={LINING_NUMS_STYLE}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{`Start Focus (${selectedMinutes}m)`}</span>
          </button>
        )}

        {isRunning && (
          <>
            <button
              type="button"
              onClick={pauseFocus}
              className="flex-1 h-10 px-3 rounded-xl bg-stone-900 dark:bg-zinc-100 hover:bg-stone-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-sans font-medium transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
            <button
              type="button"
              onClick={openFullscreen}
              aria-label="Open focus view"
              className="h-10 px-3 rounded-xl border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 text-xs font-sans font-medium transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Focus view</span>
            </button>
            <button
              type="button"
              onClick={handleStopEarly}
              aria-label="Stop focus session"
              className="h-10 w-10 rounded-xl border border-stone-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 text-stone-600 dark:text-zinc-300 hover:text-rose-700 dark:hover:text-rose-400 transition-colors inline-flex items-center justify-center cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              type="button"
              onClick={resumeFocus}
              className="flex-1 h-10 px-3 rounded-xl bg-stone-900 dark:bg-zinc-100 hover:bg-stone-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-sans font-medium transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
            <button
              type="button"
              onClick={openFullscreen}
              aria-label="Open focus view"
              className="h-10 px-3 rounded-xl border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 text-xs font-sans font-medium transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Focus view</span>
            </button>
            <button
              type="button"
              onClick={timer.isStalePause ? discardPaused : handleStopEarly}
              aria-label={timer.isStalePause ? 'Discard paused session' : 'Stop focus session'}
              className="h-10 w-10 rounded-xl border border-stone-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 text-stone-600 dark:text-zinc-300 hover:text-rose-700 dark:hover:text-rose-400 transition-colors inline-flex items-center justify-center cursor-pointer"
            >
              {timer.isStalePause ? (
                <RotateCcw className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
            </button>
          </>
        )}

        {isBreak && (
          <>
            <button
              type="button"
              onClick={skipBreak}
              className="flex-1 h-10 px-3 rounded-xl bg-stone-900 dark:bg-zinc-100 hover:bg-stone-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-sans font-medium transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip break</span>
            </button>
            <button
              type="button"
              onClick={openFullscreen}
              aria-label="Open focus view"
              className="h-10 px-3 rounded-xl border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 text-xs font-sans font-medium transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Focus view</span>
            </button>
          </>
        )}
      </div>

      {/* Task Binding Selector (Idle state) */}
      {!isActive && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-label="Select task to focus on"
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-stone-50/90 dark:bg-zinc-800/60 hover:bg-stone-100/80 dark:hover:bg-zinc-800 border border-stone-200/70 dark:border-zinc-700/70 transition-colors text-left cursor-pointer"
          >
            <div className="min-w-0">
              <span className="block text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                Linked Task
              </span>
              <span className="block text-xs font-sans font-medium text-stone-800 dark:text-zinc-200 truncate">
                {selectedTask ? selectedTask.title : 'No task selected'}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-stone-400 dark:text-zinc-500 shrink-0 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div
              role="listbox"
              aria-label="Available open tasks"
              className="absolute left-0 right-0 bottom-full mb-1.5 z-30 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 shadow-lg p-1.5 max-h-56 overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => handleSelectTask(null)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-sans text-left transition-colors cursor-pointer ${
                  selectedTask === null
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-[#006c49] dark:text-emerald-400 font-medium'
                    : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>No task selected</span>
                {selectedTask === null && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>

              {tasks.length === 0 ? (
                <p className="px-2.5 py-2 text-[11px] font-sans text-stone-400 dark:text-zinc-500">
                  No open tasks yet. You can still start a focus session.
                </p>
              ) : (
                <div className="mt-1 pt-1 border-t border-stone-100 dark:border-zinc-800 space-y-0.5">
                  {tasks.map((task) => {
                    const isSelected = selectedTask?.id === task.id;
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleSelectTask(task)}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-sans text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-[#006c49] dark:text-emerald-400 font-medium'
                            : 'text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span className="truncate">{task.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Non-blocking save status / retry notice */}
      {(hasUnsavedNotice || isSaving || (!hasUnsavedNotice && timer.lastSaveStatus === 'saved')) && (() => {
        const justSaved = !hasUnsavedNotice && !isSaving && timer.lastSaveStatus === 'saved';
        const notice = getSaveNoticeContent({
          saveError: timer.saveError,
          saveErrorCode: timer.saveErrorCode ?? null,
          isSaving,
          justSaved,
        });
        return (
          <div
            role="status"
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-[11px] font-sans ${
              notice.tone === 'emerald'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/60 text-[#006c49] dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {notice.tone === 'emerald' ? (
                <Check className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="break-words min-w-0">{notice.text}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {notice.showSignInLink && (
                <Link href="/login" className="font-semibold underline hover:opacity-80">
                  Sign in
                </Link>
              )}
              {notice.showRetryButton && (
                <button
                  type="button"
                  onClick={() => void flushPendingSaves()}
                  className="font-semibold underline cursor-pointer"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </section>
  );
}
