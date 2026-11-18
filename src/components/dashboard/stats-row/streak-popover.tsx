'use client';

import React from 'react';
import { Check, X, Snowflake, Trophy } from 'lucide-react';
import type { StreakState } from '@/lib/daily-loop/types';
import type { WeekStripDay } from '@/lib/actions/daily-loop';

interface StreakPopoverProps {
  streakState: StreakState;
  weekStrip: WeekStripDay[];
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickCapture?: (prefix: string) => void;
  onOpenMilestones?: () => void;
}

export function StreakPopover({
  streakState,
  weekStrip,
  isOpen,
  onClose,
  onOpenQuickCapture,
  onOpenMilestones,
}: StreakPopoverProps) {
  if (!isOpen) return null;

  const { checklist, freezesLeft, currentStreak, isTodayQualified } = streakState;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="absolute top-full left-0 mt-2 z-50 w-80 sm:w-88 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 text-on-surface shadow-ambient"
        role="dialog"
        aria-label="Daily Streak Details"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-mono text-headline-md font-semibold tracking-tight text-on-surface"
                style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
              >
                {currentStreak}
              </span>
              <span className="font-sans text-body-sm text-on-surface-variant">
                {currentStreak === 1 ? 'day streak' : 'day streak'}
              </span>
            </div>
            <p className="font-sans text-label-sm text-on-surface-variant mt-0.5">
              2 of 3 daily keeps your streak alive
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
            aria-label="Close streak details"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* 7-Day Strip */}
        <div className="py-3">
          <div className="grid grid-cols-7 gap-1">
            {weekStrip.map((day) => {
              let circleContent: React.ReactNode = null;
              let circleStyle = 'bg-surface-container-low border border-outline-variant/50';

              if (day.isQualified) {
                circleStyle = 'bg-secondary text-on-secondary';
                circleContent = <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />;
              } else if (day.isFrozen) {
                circleStyle = 'bg-secondary/20 text-secondary border border-secondary/40';
                circleContent = <Snowflake className="h-3 w-3" aria-hidden="true" />;
              } else if (day.isToday) {
                circleStyle =
                  'border-2 border-on-tertiary-container bg-tertiary-fixed/50 text-on-tertiary-fixed font-mono font-semibold';
                circleContent = (
                  <span
                    className="text-[10px]"
                    style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
                  >
                    {currentStreak}
                  </span>
                );
              }

              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5">
                  <span
                    className={`font-mono text-[10px] ${
                      day.isToday ? 'font-semibold text-on-surface' : 'text-outline'
                    }`}
                  >
                    {day.dayLabel}
                  </span>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${circleStyle}`}
                  >
                    {circleContent}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Minimum: 2 of 3 Checklist */}
        <div className="pt-2.5 pb-3 border-t border-outline-variant/30">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
              Today&apos;s Minimum
            </span>
            <span
              className={`font-mono text-label-sm font-medium ${
                checklist.isQualified ? 'text-secondary' : 'text-on-tertiary-container'
              }`}
              style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
            >
              {checklist.completedCount} of {checklist.totalRequired} required
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-2.5 py-1.5 text-body-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    checklist.hasFocusSession
                      ? 'bg-secondary text-on-secondary'
                      : 'border border-outline-variant'
                  }`}
                >
                  {checklist.hasFocusSession && <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />}
                </span>
                <span className="font-sans text-on-surface">1 focus session</span>
              </div>
              <span className="font-mono text-label-sm text-on-surface-variant">
                {checklist.hasFocusSession ? 'Done' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-2.5 py-1.5 text-body-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    checklist.hasHabitCompleted
                      ? 'bg-secondary text-on-secondary'
                      : 'border border-outline-variant'
                  }`}
                >
                  {checklist.hasHabitCompleted && <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />}
                </span>
                <span className="font-sans text-on-surface">1 habit completed</span>
              </div>
              <span className="font-mono text-label-sm text-on-surface-variant">
                {checklist.hasHabitCompleted ? 'Done' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-2.5 py-1.5 text-body-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    checklist.hasExpenseLogged
                      ? 'bg-secondary text-on-secondary'
                      : 'border border-outline-variant'
                  }`}
                >
                  {checklist.hasExpenseLogged && <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden="true" />}
                </span>
                <span className="font-sans text-on-surface">1 expense logged</span>
              </div>
              {checklist.hasExpenseLogged ? (
                <span className="font-mono text-label-sm text-on-surface-variant">Done</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickCapture?.('Expense: ');
                  }}
                  className="font-mono text-label-sm font-medium text-secondary hover:underline cursor-pointer"
                >
                  Log now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Freeze Shields Info */}
        <div className="pt-2.5 pb-2 border-t border-outline-variant/30 flex items-start gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary/12 text-secondary">
            <Snowflake className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div>
            <div
              className="font-mono text-label-sm font-semibold text-on-surface"
              style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
            >
              {freezesLeft} {freezesLeft === 1 ? 'freeze' : 'freezes'} left (max 2)
            </div>
            <div className="font-sans text-[11px] text-on-surface-variant leading-snug mt-0.5">
              Earn 1 freeze per 7 consecutive days. Automatically saves your streak if you miss a day.
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div
          className={`mt-2 rounded-xl p-2 text-center font-sans text-label-sm font-medium ${
            isTodayQualified
              ? 'bg-secondary/12 text-secondary border border-secondary/25'
              : 'bg-tertiary-fixed/50 text-on-tertiary-fixed border border-on-tertiary-container/25'
          }`}
        >
          {isTodayQualified
            ? 'Today’s minimum complete. Streak preserved.'
            : 'Complete 2 of 3 items before midnight to keep your streak.'}
        </div>

        {onOpenMilestones && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMilestones();
            }}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-outline-variant/50 bg-surface-container-low py-2 font-mono text-label-sm font-medium text-on-surface transition-colors hover:bg-surface-container cursor-pointer"
          >
            <Trophy className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
            <span>View Streak Milestones</span>
          </button>
        )}
      </div>
    </>
  );
}
