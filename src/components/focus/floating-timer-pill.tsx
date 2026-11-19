'use client';

import React from 'react';
import Link from 'next/link';
import { Maximize2, Pause, Play, SkipForward, Coffee, PauseCircle } from 'lucide-react';
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

/**
 * Stitch Floating Timer HUD.
 * Floats 32px above the universal 7-icon pill dock and expands controls on hover/focus.
 */
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

  // Dock sits at bottom-5 (20px) with ~56px pill height -> 76px + 32px clearance = 108px
  const bottomOffsetClass = isDockHidden ? 'bottom-5' : 'bottom-[108px]';
  const countdown = formatCountdownMMSS(remainingSeconds);

  const saveNotice = getSaveNoticeContent({
    saveError: timer.saveError,
    saveErrorCode: timer.saveErrorCode ?? null,
    isSaving,
  });

  if (showIdleRetryNotice) {
    return (
      <div
        className={`fixed ${bottomOffsetClass} left-1/2 -translate-x-1/2 z-40 transition-all duration-200 max-w-[92vw]`}
        data-purpose="floating-timer-pill"
        data-timer-status="retry"
      >
        <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-on-tertiary-container/30 bg-tertiary-fixed/95 px-3.5 py-2 font-sans text-xs text-on-tertiary-fixed shadow-ambient backdrop-blur-md">
          <span className="h-2 w-2 shrink-0 rounded-full bg-on-tertiary-container" aria-hidden="true" />
          <span>{saveNotice.text}</span>
          {saveNotice.showSignInLink && (
            <Link
              href="/login"
              className="shrink-0 font-semibold underline hover:opacity-80"
            >
              Sign in
            </Link>
          )}
          {saveNotice.showRetryButton && (
            <button
              type="button"
              onClick={onRetrySave}
              className="shrink-0 font-semibold underline hover:opacity-80 cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const pillThemeClass =
    timer.status === 'running'
      ? 'bg-secondary text-on-secondary border border-secondary/30 shadow-[0_8px_24px_rgba(0,0,0,0.14)]'
      : timer.status === 'paused'
      ? 'bg-tertiary-fixed text-on-tertiary-fixed border border-on-tertiary-container/30 shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
      : 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/25 shadow-[0_8px_24px_rgba(0,0,0,0.1)]';

  const statusLabel =
    timer.status === 'break'
      ? '5m Break'
      : timer.isStalePause
      ? 'Paused over 2h'
      : timer.status === 'paused'
      ? `Paused${timer.taskTitle ? ` · ${timer.taskTitle}` : ''}`
      : timer.taskTitle || 'Focus session';

  return (
    <div
      className={`group fixed ${bottomOffsetClass} left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1.5rem)] transition-all duration-200`}
      data-purpose="floating-timer-pill"
      data-timer-status={timer.status}
      data-dock-clearance="32px"
    >
      <div
        className={`flex items-center gap-2.5 rounded-full px-3.5 py-2 backdrop-blur-md select-none transition-all duration-200 ${pillThemeClass}`}
      >
        {/* Status Indicator + Clickable Countdown */}
        <button
          type="button"
          onClick={onOpenFullscreen}
          className="flex items-center gap-2 min-w-0 cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-secondary/50 rounded-full"
          title="Open Full-Screen Focus Mode"
        >
          {timer.status === 'running' ? (
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-on-secondary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-on-secondary" />
            </span>
          ) : timer.status === 'paused' ? (
            <PauseCircle className="h-3.5 w-3.5 shrink-0 text-on-tertiary-container" aria-hidden="true" />
          ) : (
            <Coffee className="h-3.5 w-3.5 shrink-0 text-on-secondary-fixed-variant" aria-hidden="true" />
          )}

          <span
            className="font-numeric-timer text-headline-sm font-mono tracking-tight tabular-nums leading-none"
            style={LINING_NUMS_STYLE}
          >
            {countdown}
          </span>

          <span className="opacity-40 font-mono text-xs" aria-hidden="true">·</span>

          <span className="max-w-[130px] sm:max-w-[190px] truncate font-sans text-xs font-medium">
            {statusLabel}
          </span>
        </button>

        {/* Expandable Controls — compact at rest, revealed cleanly on hover/focus-within */}
        <div
          className="flex items-center gap-1 overflow-hidden border-l border-current/20 pl-2 transition-all duration-200 sm:max-w-0 sm:opacity-0 sm:pl-0 sm:border-l-0 sm:group-hover:max-w-[240px] sm:group-hover:opacity-100 sm:group-hover:pl-2 sm:group-hover:border-l sm:group-focus-within:max-w-[240px] sm:group-focus-within:opacity-100 sm:group-focus-within:pl-2 sm:group-focus-within:border-l"
          data-purpose="timer-hud-controls"
        >
          {timer.status === 'running' && (
            <button
              type="button"
              onClick={onPause}
              aria-label="Pause focus timer"
              title="Pause"
              className="inline-flex h-7 items-center gap-1 rounded-full bg-on-secondary/15 px-2.5 font-mono text-[11px] font-medium transition-colors hover:bg-on-secondary/25 cursor-pointer"
            >
              <Pause className="h-3 w-3 fill-current" aria-hidden="true" />
              <span>Pause</span>
            </button>
          )}

          {timer.status === 'paused' && (
            <>
              <button
                type="button"
                onClick={onResume}
                className="inline-flex h-7 items-center gap-1 rounded-full bg-on-tertiary-container px-2.5 font-mono text-[11px] font-medium text-surface-container-lowest transition-opacity hover:opacity-90 cursor-pointer"
              >
                <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                <span>Resume</span>
              </button>
              {timer.isStalePause && (
                <button
                  type="button"
                  onClick={onDiscard}
                  className="inline-flex h-7 items-center rounded-full bg-surface-container-lowest/80 px-2.5 font-mono text-[11px] font-medium text-on-tertiary-fixed transition-colors hover:bg-surface-container-lowest cursor-pointer"
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
              className="inline-flex h-7 items-center gap-1 rounded-full bg-surface-container-lowest/90 px-2.5 font-mono text-[11px] font-medium text-on-secondary-fixed transition-colors hover:bg-surface-container-lowest cursor-pointer"
            >
              <SkipForward className="h-3 w-3" aria-hidden="true" />
              <span>Skip</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenFullscreen}
            aria-label="Expand focus mode"
            title="Full-Screen Focus Mode"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-current/15 cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Subtle retry line beneath pill if an earlier finished session is still retrying */}
      {hasPendingUnsaved && timer.saveError && (
        <div className="mt-1.5 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-on-tertiary-container/30 bg-tertiary-fixed/95 px-3 py-0.5 font-sans text-[11px] font-medium text-on-tertiary-fixed shadow-xs">
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
