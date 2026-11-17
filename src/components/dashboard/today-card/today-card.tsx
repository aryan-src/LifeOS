'use client';

import React, { useState, useEffect } from 'react';
import { getTodayCardMode } from '@/lib/daily-loop/business-logic';
import type {
  DailyCheckIn,
  FocusInsight,
  StreakState,
  TodayMode,
} from '@/lib/daily-loop/types';
import { MorningState, type TodayTaskItem } from './morning-state';
import { DaytimeState } from './daytime-state';
import { EveningState, type FinishedTodayItem } from './evening-state';

export interface TodayCardProps {
  initialMode: TodayMode;
  userTimezone: string;
  forcedMode?: TodayMode | null;
  tasks: TodayTaskItem[];
  deadlines48hCount: number;
  pendingHabitsCount: number;
  streakState: StreakState;
  focusInsight: FocusInsight;
  initialCheckIn: DailyCheckIn | null;
  finishedTodayItems: FinishedTodayItem[];
  isDevMockActive?: boolean;
  onToggleTask: (taskId: string) => void;
  onOpenQuickCapture?: (prefix: string) => void;
  onStartFocus?: (durationMinutes: number, taskId: string | null) => void;
}

const MODE_LABELS: Record<TodayMode, string> = {
  morning: 'Morning',
  daytime: 'Daytime',
  evening: 'Evening',
};

export function TodayCard({
  initialMode,
  userTimezone,
  forcedMode = null,
  tasks,
  deadlines48hCount,
  pendingHabitsCount,
  streakState,
  focusInsight,
  initialCheckIn,
  finishedTodayItems,
  isDevMockActive = false,
  onToggleTask,
  onOpenQuickCapture,
  onStartFocus,
}: TodayCardProps) {
  const [clockMode, setClockMode] = useState<TodayMode>(initialMode);
  const [hasStartedDay, setHasStartedDay] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    () => tasks.find((t) => !t.is_completed)?.id ?? null
  );

  // Keep clock-driven mode aligned with user's profile timezone (never server time)
  useEffect(() => {
    const syncMode = () => {
      setClockMode(getTodayCardMode(new Date(), userTimezone));
    };
    syncMode();
    const interval = setInterval(syncMode, 60_000);
    return () => clearInterval(interval);
  }, [userTimezone]);

  const effectiveMode: TodayMode = forcedMode
    ? forcedMode
    : clockMode === 'morning' && hasStartedDay
    ? 'daytime'
    : clockMode;

  const badgeClass =
    effectiveMode === 'morning'
      ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60'
      : effectiveMode === 'evening'
      ? 'text-stone-700 dark:text-zinc-200 bg-stone-100 dark:bg-zinc-800 border border-stone-200/70 dark:border-zinc-700'
      : 'text-stone-600 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700';

  return (
    <article
      className="h-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_4px_rgba(0,0,0,0.03)] relative"
      data-purpose="today-card"
      data-today-mode={effectiveMode}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-stone-100 dark:border-zinc-800 shrink-0">
        <h3
          className="text-base font-semibold text-stone-900 dark:text-zinc-100 tracking-tight"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          Today
        </h3>

        <span
          className={`text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${badgeClass}`}
        >
          {effectiveMode === 'evening' && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          )}
          <span>{MODE_LABELS[effectiveMode]}</span>
        </span>
      </div>

      {/* Mode Content */}
      {effectiveMode === 'morning' && (
        <MorningState
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          deadlines48hCount={deadlines48hCount}
          pendingHabitsCount={pendingHabitsCount}
          focusInsight={focusInsight}
          onSelectTask={setSelectedTaskId}
          onToggleTask={onToggleTask}
          onStartDay={() => setHasStartedDay(true)}
          onAddTask={() => onOpenQuickCapture?.('Task: ')}
        />
      )}

      {effectiveMode === 'daytime' && (
        <DaytimeState
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          checklist={streakState.checklist}
          focusInsight={focusInsight}
          onSelectTask={setSelectedTaskId}
          onToggleTask={onToggleTask}
          onStartFocus={onStartFocus}
          onOpenQuickCapture={onOpenQuickCapture}
        />
      )}

      {effectiveMode === 'evening' && (
        <EveningState
          initialCheckIn={initialCheckIn}
          finishedItems={finishedTodayItems}
          streakState={streakState}
          isDevMockActive={isDevMockActive}
        />
      )}
    </article>
  );
}
