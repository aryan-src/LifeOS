'use client';

import React, { useState } from 'react';
import type { DailyLoopDashboardData } from '@/lib/actions/daily-loop';
import type { TodayMode } from '@/lib/daily-loop/types';
import { LifeScoreCard } from './life-score-card';
import { DailyStreakCard } from './daily-streak-card';
import { TimeFocusedCard } from './time-focused-card';
import { PocketLedgerCard } from './pocket-ledger-card';

export function buildDevMockDailyLoopData(
  data: DailyLoopDashboardData
): DailyLoopDashboardData {
  return {
    lifeScore: {
      total: 72,
      habitsScore: 28,
      focusScore: 20,
      tasksScore: 12,
      financeScore: 12,
      deltaVsYesterday: 12,
    },
    streakState: {
      currentStreak: 12,
      bestStreak: 14,
      freezesEarnedTotal: 2,
      freezesUsedTotal: 0,
      freezesLeft: 2,
      isTodayQualified: true,
      nextMilestone: 14,
      streakPreview: { current: 12, next: 13, isPreviewActive: true },
      checklist: {
        hasFocusSession: true,
        hasHabitCompleted: true,
        hasExpenseLogged: false,
        completedCount: 2,
        totalRequired: 2,
        isQualified: true,
      },
      history: [],
    },
    timeFocused: {
      minutes: 130,
      goalMinutes: 240,
      formattedTime: '2h 10m',
      formattedGoal: '4h goal',
      percent: 54,
    },
    pocketLedger: {
      spentAmount: 840,
      monthlyAllowance: 2500,
      remainingAllowance: 1660,
      allowancePercent: 33.6,
      currentMonth: data.pocketLedger.currentMonth,
    },
    weekStrip: data.weekStrip.map((day, idx) => ({
      ...day,
      isQualified: idx < 5,
      isToday: idx === 5,
      isPast: idx < 5,
      isFuture: idx > 5,
    })),
    userTimezone: data.userTimezone,
    isTimezoneNull: false,
    todayDateStr: data.todayDateStr,
    todayMode: data.todayMode,
    todayCheckIn: null,
    focusInsight: {
      peakHour: 20,
      formattedPeakTime: '8 PM',
      totalSessions: 28,
      totalMinutes: 1420,
      daysTracked: 18,
      hasEnoughData: true,
      insightText: 'You focus best around 8 PM.',
    },
    todayExpenseAmount: 840,
  };
}

interface StatsRowProps {
  data: DailyLoopDashboardData;
  onOpenQuickCapture?: (prefix: string) => void;
  isDevMockActive?: boolean;
  onToggleDevMock?: () => void;
  devForcedTodayMode?: TodayMode | null;
  onChangeDevTodayMode?: (mode: TodayMode | null) => void;
}

const DEV_MODE_OPTIONS: Array<{ value: TodayMode | null; label: string }> = [
  { value: null, label: 'Auto' },
  { value: 'morning', label: 'Morning' },
  { value: 'daytime', label: 'Daytime' },
  { value: 'evening', label: 'Evening' },
];

export function StatsRow({
  data,
  onOpenQuickCapture,
  isDevMockActive: controlledDevMock,
  onToggleDevMock,
  devForcedTodayMode = null,
  onChangeDevTodayMode,
}: StatsRowProps) {
  const isDev = process.env.NODE_ENV !== 'production';
  const [internalDevMock, setInternalDevMock] = useState(false);

  const isDevMockActive =
    controlledDevMock !== undefined ? controlledDevMock : internalDevMock;

  const handleToggleDevMock = () => {
    if (onToggleDevMock) {
      onToggleDevMock();
    } else {
      setInternalDevMock((prev) => !prev);
    }
  };

  // If dev mock data is toggled on (strictly disabled in production)
  const activeData: DailyLoopDashboardData =
    isDev && isDevMockActive ? buildDevMockDailyLoopData(data) : data;

  return (
    <section className="relative my-1 sm:my-2 shrink-0" data-purpose="wide-focus-ribbon">
      {/* Dev-only Visual Check Controls (strictly disabled in production) */}
      {isDev && (
        <div className="flex flex-wrap items-center justify-end gap-1.5 mb-1">
          {onChangeDevTodayMode && (
            <div className="inline-flex items-center rounded border border-dashed border-stone-300 dark:border-zinc-700 p-0.5 text-[10px] font-mono">
              <span className="px-1.5 text-stone-400 dark:text-zinc-500">Today:</span>
              {DEV_MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onChangeDevTodayMode(opt.value)}
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                    devForcedTodayMode === opt.value
                      ? 'bg-stone-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-semibold'
                      : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleToggleDevMock}
            className="text-[10px] font-mono px-2 py-0.5 rounded border border-dashed border-stone-300 dark:border-zinc-700 text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Development-only visual check: toggle mock data numbers vs real database values"
          >
            Dev Mock: {isDevMockActive ? 'ON (72 Life / 12D / 2h10m)' : 'OFF (Real DB)'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Card 1: Life Score */}
        <LifeScoreCard lifeScore={activeData.lifeScore} />

        {/* Card 2: Daily Streak */}
        <DailyStreakCard
          streakState={activeData.streakState}
          weekStrip={activeData.weekStrip}
          onOpenQuickCapture={onOpenQuickCapture}
        />

        {/* Card 3: Time Focused */}
        <TimeFocusedCard timeFocused={activeData.timeFocused} />

        {/* Card 4: Pocket Ledger */}
        <PocketLedgerCard pocketLedger={activeData.pocketLedger} />
      </div>
    </section>
  );
}
