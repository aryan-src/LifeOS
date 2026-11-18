'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Coffee, Play, X } from 'lucide-react';
import { formatTimeInTimezone } from '@/lib/daily-loop/business-logic';
import { getSaveNoticeContent } from '@/lib/daily-loop/focus-timer-engine';
import { Pill } from '@/components/ui/pill';
import { getWrappedFocusIndex } from '@/components/ui/modal';
import type {
  FocusSaveStatus,
  FocusSessionErrorCode,
} from '@/lib/daily-loop/types';

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap Tab focus within Session Complete modal
  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const focusables = Array.from(dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = Array.from(dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;
      const activeIdx = items.indexOf(document.activeElement as HTMLElement);
      const nextIdx = getWrappedFocusIndex(activeIdx, items.length, event.shiftKey);
      if (nextIdx >= 0) {
        event.preventDefault();
        items[nextIdx].focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      ref={dialogRef}
      className="relative mx-auto flex w-full max-w-[440px] flex-col items-center rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-7 text-center text-on-surface shadow-ambient sm:p-9"
      role="dialog"
      aria-modal="true"
      aria-label="Session done"
      data-purpose="session-done-view"
    >
      {/* Top Eyebrow & Close */}
      <div className="mb-6 flex w-full items-center justify-between border-b border-outline-variant/30 pb-4">
        <span className="font-mono text-label-sm font-medium uppercase tracking-[0.12em] text-on-surface-variant">
          Session Complete
        </span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close session summary"
          className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Playfair Display Hero Heading (one of the two designated modal hero headings) */}
      <div className="mb-6 flex flex-col items-center gap-3">
        <h2 className="font-serif text-modal-hero font-normal tracking-tight text-on-surface">
          Session done
        </h2>

        <Pill tone="secondary" dot={true} className="px-3.5 py-1 text-label-md font-semibold">
          +{minutesAdded} {minutesAdded === 1 ? 'min' : 'mins'} added to Time Focused
        </Pill>

        {taskTitle && (
          <p className="max-w-xs truncate font-sans text-body-sm font-medium text-on-surface-variant">
            {taskTitle}
          </p>
        )}

        {formattedFinishTime && (
          <p className="font-sans text-body-sm text-on-surface-variant">
            Finished at{' '}
            <span
              className="font-mono text-label-sm font-medium text-on-surface"
              style={LINING_NUMS_STYLE}
            >
              {formattedFinishTime}
            </span>
          </p>
        )}
      </div>

      {/* Non-blocking Save Status / Retry Notice */}
      {showSaveBanner && (
        <div
          className={`mb-5 flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 font-sans text-body-sm ${
            notice.tone === 'emerald'
              ? 'border-secondary/25 bg-secondary/10 text-secondary'
              : 'border-on-tertiary-container/30 bg-tertiary-fixed/50 text-on-tertiary-fixed'
          }`}
          role="status"
          data-purpose="focus-save-notice"
        >
          <span className="min-w-0 break-words text-left text-xs">{notice.text}</span>
          <div className="flex shrink-0 items-center gap-2 text-xs">
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
      <div className="flex w-full flex-col gap-2.5">
        <button
          type="button"
          onClick={onTakeBreak}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-secondary font-sans text-body-sm font-medium text-on-secondary shadow-xs transition-opacity hover:opacity-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
          style={LINING_NUMS_STYLE}
        >
          <Coffee className="h-4 w-4" aria-hidden="true" />
          <span>Take a 5 min break</span>
        </button>

        <button
          type="button"
          onClick={onStartAnother}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-sans text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
        >
          <Play className="h-4 w-4 fill-current" aria-hidden="true" />
          <span>Start another</span>
        </button>
      </div>

      {/* Quiet Dismiss */}
      <button
        type="button"
        onClick={onDismiss}
        className="mt-5 font-sans text-body-sm text-on-surface-variant transition-colors hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 rounded-md px-2 py-0.5"
      >
        Done <span className="font-mono text-label-sm text-outline">(Esc)</span>
      </button>
    </div>
  );
}
