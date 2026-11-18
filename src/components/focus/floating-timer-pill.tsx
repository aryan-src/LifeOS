'use client';

import React from 'react';
import Link from 'next/link';
import type { FocusTimerState } from '@/lib/daily-loop/types';
import {
  formatCountdownMMSS,
  getSaveNoticeContent,
} from '@/lib/daily-loop/focus-timer-engine';

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export interface FloatingTimerPillProps {
  timer: FocusTimerState;
  remainingSeconds: number;
  isDockHidden: boolean;
  isSaving: boolean;
  onOpenFullscreen: () => void;
  onPause: () => void;
  onResume: () => void;
  onDiscard: () => void;
  onSkipBreak: () => void;
  onRetrySave: () => void;
}

export function FloatingTimerPill({
  timer,
  remainingSeconds,
  isDockHidden,
  isSaving,
  onOpenFullscreen,
  onPause,
  onResume,
  onDiscard,
  onSkipBreak,
  onRetrySave,
}: FloatingTimerPillProps) {
  // Never overlap Full-Screen Focus Mode
  if (timer.isFullscreenOpen) return null;

  const hasPendingUnsaved = timer.pendingUnsavedSessions.length > 0;
  const showIdleRetryNotice = timer.status === 'idle' && hasPendingUnsaved;
  const showActivePill =
    timer.status === 'running' ||
    timer.status === 'paused' ||
    timer.status === 'break';

  if (!showActivePill && !showIdleRetryNotice) {
    return null;
  }

  const bottomOffsetClass = isDockHidden ? 'bottom-5' : 'bottom-16';
  const countdown = formatCountdownMMSS(remainingSeconds);

  const saveNotice = getSaveNoticeContent({
    saveError: timer.saveError,
    saveErrorCode: timer.saveErrorCode ?? null,
    isSaving,
  });

  // Subtle non-blocking retry notice when idle with failed save queued
  if (showIdleRetryNotice) {
    return (
      <div
        className={`fixed ${bottomOffsetClass} left-1/2 -translate-x-1/2 z-40 transition-all duration-200 max-w-[92vw]`}
        data-purpose="floating-timer-pill"
        data-timer-status="retry"
      >
        <div className="flex flex-wrap items-center justify-center gap-2.5 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/70 shadow-lg backdrop-blur-md text-xs font-sans">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span>{saveNotice.text}</span>
          {saveNotice.showSignInLink && (
            <Link
              href="/login"
              className="font-semibold underline hover:opacity-80 shrink-0"
            >
              Sign in
            </Link>
          )}
          {saveNotice.showRetryButton && (
            <button
              type="button"
              onClick={onRetrySave}
              className="font-semibold underline hover:opacity-80 cursor-pointer shrink-0"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Color states: running = teal, paused = amber/mustard, break = soft grey-green
  const pillThemeClass =
    timer.status === 'running'
      ? 'bg-[#006c49] text-white border border-emerald-700/40 shadow-[0_8px_24px_rgba(0,108,73,0.28)]'
      : timer.status === 'paused'
      ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-stone-950 border border-amber-700/30 shadow-[0_8px_24px_rgba(217,119,6,0.28)]'
      : 'bg-[#E6ECE7] dark:bg-[#232F28] text-[#1F4032] dark:text-emerald-200 border border-[#C5D4C9] dark:border-emerald-800/60 shadow-[0_8px_24px_rgba(0,0,0,0.12)]';

  return (
    <div
      className={`fixed ${bottomOffsetClass} left-1/2 -translate-x-1/2 z-40 transition-all duration-200`}
      data-purpose="floating-timer-pill"
      data-timer-status={timer.status}
    >
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full backdrop-blur-md select-none ${pillThemeClass}`}
      >
        {/* Status Indicator + Clickable Countdown Area (opens Full-Screen Focus Mode) */}
        <button
          type="button"
          onClick={onOpenFullscreen}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          title="Open Full-Screen Focus Mode"
        >
          {timer.status === 'running' ? (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200" />
            </span>
          ) : timer.status === 'paused' ? (
            <span className="w-2 h-2 rounded-full bg-white/90 dark:bg-stone-950/80 shrink-0" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#006c49] dark:bg-emerald-400 shrink-0" />
          )}

          <span
            className="font-mono font-semibold text-xs tracking-tight tabular-nums lining-nums"
            style={LINING_NUMS_STYLE}
          >
            {countdown}
          </span>

          <span className="w-1 h-1 rounded-full bg-current opacity-40 shrink-0" />

          <span className="text-xs font-sans font-medium truncate max-w-[140px] sm:max-w-[200px]">
            {timer.status === 'break'
              ? '5m Break'
              : timer.isStalePause
              ? 'Paused over 2h'
              : timer.status === 'paused'
              ? `Paused${timer.taskTitle ? ` · ${timer.taskTitle}` : ''}`
              : timer.taskTitle || 'Focus session'}
          </span>
        </button>

        {/* Quick Controls */}
        <div className="flex items-center gap-1 pl-1 border-l border-current/20">
          {timer.status === 'running' && (
            <button
              type="button"
              onClick={onPause}
              aria-label="Pause focus timer"
              title="Pause"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
              </svg>
            </button>
          )}

          {timer.status === 'paused' && (
            <>
              <button
                type="button"
                onClick={onResume}
                className="px-2 py-0.5 rounded-full bg-white/20 dark:bg-stone-950/15 hover:bg-white/30 text-[11px] font-sans font-semibold transition-colors cursor-pointer"
              >
                Resume
              </button>
              {timer.isStalePause && (
                <button
                  type="button"
                  onClick={onDiscard}
                  className="px-2 py-0.5 rounded-full hover:bg-white/15 text-[11px] font-sans font-medium transition-colors cursor-pointer"
                >
                  Discard
                </button>
              )}
            </>
          )}

          {timer.status === 'break' && (
            <button
              type="button"
              onClick={onSkipBreak}
              className="px-2 py-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[11px] font-sans font-semibold transition-colors cursor-pointer"
            >
              Skip
            </button>
          )}

          <button
            type="button"
            onClick={onOpenFullscreen}
            aria-label="Expand focus mode"
            title="Full-Screen Focus Mode"
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/15 dark:hover:bg-black/15 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subtle retry line beneath pill if an earlier finished session is still retrying */}
      {hasPendingUnsaved && timer.saveError && (
        <div className="mt-1 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-100/95 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60 text-[10px] font-sans font-medium shadow-xs">
            <span>{saveNotice.text}</span>
            {saveNotice.showSignInLink && (
              <Link href="/login" className="font-semibold underline hover:opacity-80">
                Sign in
              </Link>
            )}
            {saveNotice.showRetryButton && (
              <button
                type="button"
                onClick={onRetrySave}
                className="font-semibold underline hover:opacity-80 cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
