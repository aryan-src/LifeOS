'use client';

import React, { useState } from 'react';
import type { DailyLoopDashboardData } from '@/lib/actions/daily-loop';
import { LifeScoreCard } from './life-score-card';
import { DailyStreakCard } from './daily-streak-card';
import { TimeFocusedCard } from './time-focused-card';
import { PocketLedgerCard } from './pocket-ledger-card';

interface StatsRowProps {
  data: DailyLoopDashboardData;
  onOpenQuickCapture?: (prefix: string) => void;
}

export function StatsRow({ data, onOpenQuickCapture }: StatsRowProps) {
  const isDev = process.env.NODE_ENV !== 'production';
  const [isDevMockActive, setIsDevMockActive] = useState(false);

  // If dev mock data is toggled on (strictly disabled in production)
  const activeData: DailyLoopDashboardData =
    isDev && isDevMockActive
      ? {
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
          })),
          userTimezone: data.userTimezone,
          isTimezoneNull: false,
        }
      : data;

  return (
    <section className="relative my-1 sm:my-2 shrink-0" data-purpose="wide-focus-ribbon">
      {/* Dev-only Mock Data Toggle */}
      {isDev && (
        <div className="flex justify-end mb-1">
          <button
            type="button"
            onClick={() => setIsDevMockActive((prev) => !prev)}
            className="text-[10px] font-mono px-2 py-0.5 rounded border border-dashed border-stone-300 dark:border-zinc-700 text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200 transition-colors"
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
