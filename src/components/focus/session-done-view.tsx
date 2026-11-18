'use client';

import React from 'react';
import Link from 'next/link';
import { formatTimeInTimezone } from '@/lib/daily-loop/business-logic';
import { getSaveNoticeContent } from '@/lib/daily-loop/focus-timer-engine';
import type {
  FocusSaveStatus,
  FocusSessionErrorCode,
} from '@/lib/daily-loop/types';

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export interface SessionDoneViewProps {
  minutesAdded: number;
  taskTitle: string | null;
  endedWhileAway: boolean;
  finishedAtMs: number | null;
  userTimezone: string;
  hasUnsavedRetry: boolean;
  saveError?: string | null;
  saveErrorCode?: FocusSessionErrorCode | null;
  lastSaveStatus?: FocusSaveStatus;
  isSaving: boolean;
  onTakeBreak: () => void;
  onStartAnother: () => void;
  onDismiss: () => void;
  onRetrySave: () => void;
}

export function SessionDoneView({
  minutesAdded,
  taskTitle,
  endedWhileAway,
  finishedAtMs,
  userTimezone,
  hasUnsavedRetry,
  saveError = null,
  saveErrorCode = null,
  lastSaveStatus = 'idle',
  isSaving,
  onTakeBreak,
  onStartAnother,
  onDismiss,
  onRetrySave,
}: SessionDoneViewProps) {
  const formattedFinishTime =
    endedWhileAway && finishedAtMs !== null
      ? formatTimeInTimezone(finishedAtMs, userTimezone)
      : null;

  const showSavedConfirmation = !hasUnsavedRetry && !isSaving && lastSaveStatus === 'saved';
  const showSaveBanner = hasUnsavedRetry || isSaving || showSavedConfirmation;
  const notice = getSaveNoticeContent({
    saveError,
    saveErrorCode,
    isSaving,
    justSaved: showSavedConfirmation,
  });

  return (
    <div
      className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-[0_20px_60px_rgba(0,0,0,0.12)] text-center flex flex-col items-center gap-5"
      role="dialog"
      aria-label="Session done"
      data-purpose="session-done-view"
    >
      {/* Check Emblem */}
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center text-[#006c49] dark:text-emerald-400">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Heading & Telemetry */}
      <div className="space-y-1.5">
        <h2
          className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-zinc-100"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          Session done
        </h2>

        <p
          className="text-sm font-sans font-medium text-[#006c49] dark:text-emerald-400 tabular-nums lining-nums"
          style={LINING_NUMS_STYLE}
        >
          +{minutesAdded} {minutesAdded === 1 ? 'min' : 'mins'} added to Time Focused
        </p>

        {taskTitle && (
          <p className="text-xs font-sans text-stone-500 dark:text-zinc-400 max-w-xs mx-auto truncate">
            {taskTitle}
          </p>
        )}

        {formattedFinishTime && (
          <p
            className="text-xs font-sans text-stone-500 dark:text-zinc-400 tabular-nums lining-nums pt-0.5"
            style={LINING_NUMS_STYLE}
          >
            Finished at {formattedFinishTime}
          </p>
        )}
      </div>

      {/* Non-blocking Save Status / Retry Notice */}
      {showSaveBanner && (
        <div
          className={`w-full px-3 py-2 rounded-xl border text-xs font-sans flex items-center justify-between gap-2 ${
            notice.tone === 'emerald'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/60 text-[#006c49] dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
          }`}
          role="status"
          data-purpose="focus-save-notice"
        >
          <span className="text-left break-words min-w-0">{notice.text}</span>
          <div className="flex items-center gap-2 shrink-0">
            {notice.showSignInLink && (
              <Link
                href="/login"
                className="font-semibold underline hover:opacity-80"
              >
                Sign in
              </Link>
            )}
            {notice.showRetryButton && (
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

      {/* Primary Actions */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={onTakeBreak}
          className="flex-1 h-10 px-4 rounded-xl bg-[#E6ECE7] dark:bg-[#232F28] text-[#1F4032] dark:text-emerald-200 border border-[#C5D4C9] dark:border-emerald-800/50 hover:opacity-90 transition-opacity font-sans text-xs font-semibold cursor-pointer tabular-nums lining-nums"
          style={LINING_NUMS_STYLE}
        >
          Take a 5 min break
        </button>

        <button
          type="button"
          onClick={onStartAnother}
          className="flex-1 h-10 px-4 rounded-xl bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors font-sans text-xs font-semibold cursor-pointer"
        >
          Start another
        </button>
      </div>

      {/* Quiet Dismiss */}
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs font-sans text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
      >
        Done
      </button>
    </div>
  );
}
