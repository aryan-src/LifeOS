'use client';

import React from 'react';
import type { StreakState } from '@/lib/daily-loop/types';
import type { WeekStripDay } from '@/lib/actions/daily-loop';

interface StreakPopoverProps {
  streakState: StreakState;
  weekStrip: WeekStripDay[];
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickCapture?: (prefix: string) => void;
}

export function StreakPopover({
  streakState,
  weekStrip,
  isOpen,
  onClose,
  onOpenQuickCapture,
}: StreakPopoverProps) {
  if (!isOpen) return null;

  const { checklist, freezesLeft, currentStreak, isTodayQualified } = streakState;

  return (
    <>
      {/* Backdrop for closing popover on outside click */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="absolute top-full left-0 mt-2 z-50 w-80 sm:w-88 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.12)] text-stone-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-label="Daily Streak Details"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight font-serif">
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </span>
              <span className="text-base">🔥</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-sans">
              2 of 3 daily keeps your streak alive
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors flex items-center justify-center text-xs"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 7-Day Strip */}
        <div className="py-3">
          <div className="flex items-center justify-between gap-1">
            {weekStrip.map((day) => {
              let circleContent: React.ReactNode = null;
              let circleStyle = 'bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700';

              if (day.isQualified) {
                circleStyle = 'bg-[#006c49] dark:bg-emerald-600 text-white font-bold';
                circleContent = (
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                );
              } else if (day.isFrozen) {
                circleStyle = 'bg-cyan-500 text-white font-bold';
                circleContent = <span className="text-[9px]">❄</span>;
              } else if (day.isToday) {
                circleStyle =
                  'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold';
                circleContent = <span className="text-[10px]">{currentStreak}</span>;
              }

              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5 flex-1">
                  <span
                    className={`text-[10px] font-sans font-medium ${
                      day.isToday
                        ? 'text-amber-700 dark:text-amber-400 font-semibold'
                        : 'text-stone-400 dark:text-zinc-500'
                    }`}
                  >
                    {day.dayLabel}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${circleStyle}`}
                  >
                    {circleContent}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Minimum: 2 of 3 Checklist */}
        <div className="pt-2 pb-3 border-t border-stone-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-zinc-400 font-sans">
              Today&apos;s Minimum
            </span>
            <span
              className={`text-xs font-semibold font-mono ${
                checklist.isQualified
                  ? 'text-[#006c49] dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {checklist.completedCount} of 2 required
            </span>
          </div>

          <div className="space-y-2">
            {/* 1. Focus Session */}
            <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-stone-50/70 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    checklist.hasFocusSession
                      ? 'bg-[#006c49] text-white'
                      : 'border border-stone-300 dark:border-zinc-600 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="text-stone-700 dark:text-zinc-300 font-medium font-sans">
                  1 focus session
                </span>
              </div>
              <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
                {checklist.hasFocusSession ? 'Done' : 'Pending'}
              </span>
            </div>

            {/* 2. Habit */}
            <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-stone-50/70 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    checklist.hasHabitCompleted
                      ? 'bg-[#006c49] text-white'
                      : 'border border-stone-300 dark:border-zinc-600 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="text-stone-700 dark:text-zinc-300 font-medium font-sans">
                  1 habit completed
                </span>
              </div>
              <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
                {checklist.hasHabitCompleted ? 'Done' : 'Pending'}
              </span>
            </div>

            {/* 3. Expense */}
            <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-stone-50/70 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    checklist.hasExpenseLogged
                      ? 'bg-[#006c49] text-white'
                      : 'border border-stone-300 dark:border-zinc-600 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="text-stone-700 dark:text-zinc-300 font-medium font-sans">
                  1 expense logged
                </span>
              </div>
              {checklist.hasExpenseLogged ? (
                <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400">
                  Done
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickCapture?.('Expense: ');
                  }}
                  className="text-[11px] font-medium text-[#006c49] dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Log now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Freezes Info */}
        <div className="pt-2.5 pb-2 border-t border-stone-100 dark:border-zinc-800 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200/60 dark:border-cyan-800/60 flex items-center justify-center shrink-0 text-cyan-600 dark:text-cyan-400 text-xs">
            ❄
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-800 dark:text-zinc-200 font-sans">
              {freezesLeft} {freezesLeft === 1 ? 'freeze' : 'freezes'} left (max 2)
            </div>
            <div className="text-[11px] text-stone-500 dark:text-zinc-400 font-sans">
              Earn 1 freeze per 7 consecutive days. Automatically saves your streak if you miss a day.
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div
          className={`mt-2 p-2 rounded-xl text-center text-xs font-medium ${
            isTodayQualified
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50'
          }`}
        >
          {isTodayQualified
            ? '✓ Today\'s minimum complete! Streak preserved.'
            : 'Complete 2 of 3 items before midnight to keep your streak.'}
        </div>
      </div>
    </>
  );
}
