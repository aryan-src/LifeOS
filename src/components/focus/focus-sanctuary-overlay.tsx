'use client';

import React, { useEffect } from 'react';
import type { FocusTimerState } from '@/lib/daily-loop/types';
import {
  computeActiveElapsedSeconds,
  formatCountdownMMSS,
  MIN_EARLY_EXIT_SECONDS,
} from '@/lib/daily-loop/focus-timer-engine';
import { SessionDoneView } from './session-done-view';

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

const DIAL_RADIUS = 126;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

export interface FocusSanctuaryOverlayProps {
  timer: FocusTimerState;
  remainingSeconds: number;
  nowMs: number;
  userTimezone: string;
  isSaving: boolean;
  onExit: () => void;
  onPause: () => void;
  onResume: () => void;
  onDiscardPaused: () => void;
  onStopEarly: () => void;
  onSkipBreak: () => void;
  onTakeBreak: () => void;
  onStartAnother: () => void;
  onDismissDone: () => void;
  onToggleSound: () => void;
  onToggleNotifications: () => void;
  onRetrySave: () => void;
}

export function FocusSanctuaryOverlay({
  timer,
  remainingSeconds,
  nowMs,
  userTimezone,
  isSaving,
  onExit,
  onPause,
  onResume,
  onDiscardPaused,
  onStopEarly,
  onSkipBreak,
  onTakeBreak,
  onStartAnother,
  onDismissDone,
  onToggleSound,
  onToggleNotifications,
  onRetrySave,
}: FocusSanctuaryOverlayProps) {
  const showSessionDone = timer.status === 'finished' && !timer.isAcknowledged;
  const isVisible = timer.isFullscreenOpen || showSessionDone;

  // Keyboard shortcuts: Esc exits fullscreen (or dismisses Session Done), Space toggles Pause/Resume
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (showSessionDone) {
          onDismissDone();
        } else {
          onExit();
        }
      } else if (e.key === ' ' && !showSessionDone) {
        if (timer.status === 'running') {
          e.preventDefault();
          onPause();
        } else if (timer.status === 'paused' && !timer.isStalePause) {
          e.preventDefault();
          onResume();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, showSessionDone, timer.status, timer.isStalePause, onExit, onDismissDone, onPause, onResume]);

  if (!isVisible) return null;

  // If completed outside fullscreen, render calm centered modal backdrop
  if (showSessionDone && !timer.isFullscreenOpen) {
    return (
      <div
        className="fixed inset-0 z-[70] bg-stone-900/35 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        data-purpose="session-done-modal"
      >
        <SessionDoneView
          minutesAdded={timer.lastCompletedMinutes}
          taskTitle={timer.taskTitle}
          endedWhileAway={timer.endedWhileAway}
          finishedAtMs={timer.finishedAtMs}
          userTimezone={userTimezone}
          hasUnsavedRetry={timer.pendingUnsavedSessions.length > 0 && Boolean(timer.saveError)}
          isSaving={isSaving}
          onTakeBreak={onTakeBreak}
          onStartAnother={onStartAnother}
          onDismiss={onDismissDone}
          onRetrySave={onRetrySave}
        />
      </div>
    );
  }

  const totalSeconds = Math.max(1, timer.plannedDurationSeconds);
  const progressFraction = Math.max(0, Math.min(1, remainingSeconds / totalSeconds));
  const strokeDashoffset = DIAL_CIRCUMFERENCE * (1 - progressFraction);
  const elapsedSeconds = computeActiveElapsedSeconds(timer, nowMs);
  const meetsEarlyExit = elapsedSeconds >= MIN_EARLY_EXIT_SECONDS;

  const arcColorClass =
    timer.status === 'paused'
      ? 'text-amber-500'
      : timer.status === 'break'
      ? 'text-[#6B8F78] dark:text-emerald-400/70'
      : 'text-[#006c49] dark:text-emerald-500';

  return (
    <div
      className="fixed inset-0 z-[70] bg-[#FAF9F5] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 flex flex-col justify-between px-4 sm:px-8 py-5 select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Full-Screen Focus Mode"
      data-purpose="fullscreen-focus-mode"
    >
      {/* Ambient Serene Gradient Accents */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full bg-emerald-200/20 dark:bg-emerald-900/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 right-1/4 w-[28rem] h-[28rem] rounded-full bg-amber-200/20 dark:bg-amber-900/10 blur-3xl pointer-events-none" />

      {/* Minimal Top Bar */}
      <header className="flex items-center justify-between w-full max-w-5xl mx-auto z-10">
        <div className="flex items-center gap-2 text-stone-500 dark:text-zinc-400">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              timer.status === 'paused'
                ? 'bg-amber-500'
                : timer.status === 'break'
                ? 'bg-[#6B8F78]'
                : 'bg-[#006c49] dark:bg-emerald-500'
            }`}
          />
          <span className="text-xs font-sans tracking-wider uppercase font-semibold text-stone-700 dark:text-zinc-300">
            LifeOS
          </span>
          <span className="text-stone-300 dark:text-zinc-700">/</span>
          <span className="text-xs font-sans tracking-wider uppercase text-stone-400 dark:text-zinc-500">
            Focus Sanctuary
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Optional Sound Chime Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={timer.soundEnabled ? 'Mute completion chime' : 'Enable completion chime'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-stone-100/90 dark:bg-zinc-900 hover:bg-stone-200/80 dark:hover:bg-zinc-800 text-stone-600 dark:text-zinc-400 text-[11px] font-sans transition-colors cursor-pointer"
          >
            <span>{timer.soundEnabled ? 'Chime on' : 'Chime off'}</span>
          </button>

          {/* Opt-in Browser Notification Toggle (requests permission only on click) */}
          <button
            type="button"
            onClick={onToggleNotifications}
            title="Toggle browser notification when session finishes"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-sans transition-colors cursor-pointer ${
              timer.notificationsEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#006c49] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                : 'bg-stone-100/90 dark:bg-zinc-900 hover:bg-stone-200/80 dark:hover:bg-zinc-800 text-stone-600 dark:text-zinc-400'
            }`}
          >
            <span>{timer.notificationsEnabled ? 'Notify on' : 'Notify when done'}</span>
          </button>

          {/* Minimal Exit Trigger */}
          <button
            type="button"
            onClick={showSessionDone ? onDismissDone : onExit}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-zinc-900 hover:bg-stone-200 dark:hover:bg-zinc-800 transition-colors text-stone-600 dark:text-zinc-300 cursor-pointer"
          >
            <span className="text-xs font-sans font-medium">Exit</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200/80 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 leading-none">
              esc
            </kbd>
          </button>
        </div>
      </header>

      {/* Center Focus Sanctuary or Session Done */}
      <main className="flex flex-col items-center justify-center my-auto w-full max-w-2xl mx-auto text-center z-10">
        {showSessionDone ? (
          <SessionDoneView
            minutesAdded={timer.lastCompletedMinutes}
            taskTitle={timer.taskTitle}
            endedWhileAway={timer.endedWhileAway}
            finishedAtMs={timer.finishedAtMs}
            userTimezone={userTimezone}
            hasUnsavedRetry={timer.pendingUnsavedSessions.length > 0 && Boolean(timer.saveError)}
            isSaving={isSaving}
            onTakeBreak={onTakeBreak}
            onStartAnother={onStartAnother}
            onDismiss={onDismissDone}
            onRetrySave={onRetrySave}
          />
        ) : (
          <>
            {/* Forgotten Pause Banner (> 2 hours) */}
            {timer.status === 'paused' && timer.isStalePause && (
              <div className="mb-5 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs font-sans flex flex-wrap items-center justify-center gap-3">
                <span>Paused for more than 2 hours. Resume where you left off or discard?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onResume}
                    className="px-3 py-1 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 cursor-pointer"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={onDiscardPaused}
                    className="px-3 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-medium hover:bg-amber-100/50 cursor-pointer"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Large Circular Countdown Dial */}
            <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
                <circle
                  className="text-stone-200/80 dark:text-zinc-800"
                  cx="140"
                  cy="140"
                  fill="transparent"
                  r={DIAL_RADIUS}
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <circle
                  className={`${arcColorClass} transition-all duration-700 ease-linear`}
                  cx="140"
                  cy="140"
                  fill="transparent"
                  r={DIAL_RADIUS}
                  stroke="currentColor"
                  strokeDasharray={DIAL_CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span
                  className="text-5xl sm:text-6xl font-semibold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums lining-nums"
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontVariantNumeric: 'lining-nums tabular-nums',
                  }}
                >
                  {formatCountdownMMSS(remainingSeconds)}
                </span>
                <span className="text-xs font-sans text-stone-500 dark:text-zinc-400 mt-2 tracking-widest uppercase">
                  {timer.status === 'break'
                    ? '5m Break'
                    : timer.status === 'paused'
                    ? 'Paused'
                    : 'Remaining'}
                </span>
              </div>
            </div>

            {/* Bound Task Title */}
            <div className="mt-6 mb-7 px-4">
              <h1
                className="text-xl sm:text-2xl font-medium text-stone-900 dark:text-zinc-100 tracking-tight max-w-xl"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {timer.status === 'break'
                  ? 'Step away and rest your eyes'
                  : timer.taskTitle || 'Deep focus block'}
              </h1>
            </div>

            {/* Minimal Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {timer.status === 'running' && (
                <button
                  type="button"
                  onClick={onPause}
                  className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-sans text-sm font-medium shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                  </svg>
                  <span>Pause</span>
                </button>
              )}

              {timer.status === 'paused' && (
                <button
                  type="button"
                  onClick={onResume}
                  className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#006c49] text-white hover:bg-[#00583b] transition-colors font-sans text-sm font-medium shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  <span>Resume</span>
                </button>
              )}

              {timer.status === 'break' ? (
                <button
                  type="button"
                  onClick={onSkipBreak}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-100 dark:bg-zinc-900 hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 transition-colors font-sans text-sm font-medium cursor-pointer"
                >
                  <span>Skip break</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={timer.isStalePause ? onDiscardPaused : onStopEarly}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-100 dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-stone-600 dark:text-zinc-300 hover:text-red-700 dark:hover:text-red-400 transition-colors font-sans text-sm font-medium cursor-pointer"
                >
                  <span>{timer.isStalePause ? 'Discard' : 'End'}</span>
                </button>
              )}
            </div>

            {/* Subtle Early-Exit Rule Hint */}
            {(timer.status === 'running' || (timer.status === 'paused' && !timer.isStalePause)) && (
              <p
                className="mt-3 text-[11px] font-sans text-stone-400 dark:text-zinc-500 tabular-nums lining-nums"
                style={LINING_NUMS_STYLE}
              >
                {meetsEarlyExit
                  ? `${Math.floor(elapsedSeconds / 60)}m focused — ending now saves this session`
                  : 'Sessions under 10m are discarded if ended early'}
              </p>
            )}
          </>
        )}
      </main>

      {/* Quiet Footer Space */}
      <footer className="w-full max-w-5xl mx-auto text-center z-10 h-5 flex items-center justify-center">
        {timer.pendingUnsavedSessions.length > 0 && timer.saveError && !showSessionDone && (
          <span className="text-[11px] font-sans text-amber-700 dark:text-amber-400">
            Couldn&apos;t save previous session yet, retrying
          </span>
        )}
      </footer>
    </div>
  );
}
