'use client';

import React, { useState, useEffect } from 'react';
import { getTodayCardMode } from '@/lib/daily-loop/business-logic';
import {
  computeRemainingSeconds,
  formatCountdownMMSS,
} from '@/lib/daily-loop/focus-timer-engine';
import { useFocusTimerStore } from '@/lib/store/use-focus-timer-store';
import type {
  DailyCheckIn,
  FocusInsight,
  StreakState,
  TodayMode,
} from '@/lib/daily-loop/types';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { MorningState, type TodayTaskItem } from './morning-state';
import { DaytimeState, type ActiveTimerSnapshot } from './daytime-state';
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
  onStartFocus?: (durationMinutes: number, taskId: string | null, taskTitle: string | null) => void;
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
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    () => tasks.find((t) => !t.is_completed)?.id ?? null
  );

  const timer = useFocusTimerStore((s) => s.timer);
  const startFocusGlobal = useFocusTimerStore((s) => s.startFocus);
  const openFullscreenGlobal = useFocusTimerStore((s) => s.openFullscreen);

  // Keep clock-driven mode aligned with user's profile timezone (never server time)
  useEffect(() => {
    const syncMode = () => {
      setClockMode(getTodayCardMode(new Date(), userTimezone));
    };
    syncMode();
    const interval = setInterval(syncMode, 60_000);
    return () => clearInterval(interval);
  }, [userTimezone]);

  // Lightweight 1s display refresh for Today card inline countdown while timer is active
  useEffect(() => {
    if (timer.status !== 'running' && timer.status !== 'break') return;
    setNowMs(Date.now());
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timer.status]);

  const activeTimerSnapshot: ActiveTimerSnapshot | null =
    timer.status === 'running' || timer.status === 'paused' || timer.status === 'break'
      ? {
          status: timer.status,
          remainingFormatted: formatCountdownMMSS(computeRemainingSeconds(timer, nowMs)),
          taskTitle: timer.taskTitle,
        }
      : null;

  const handleStartFocus = (
    durationMinutes: number,
    taskId: string | null,
    taskTitle: string | null
  ) => {
    if (onStartFocus) {
      onStartFocus(durationMinutes, taskId, taskTitle);
      return;
    }
    startFocusGlobal({
      durationMinutes,
      taskId,
      taskTitle,
      openFullscreen: true,
    });
  };

  const effectiveMode: TodayMode = forcedMode
    ? forcedMode
    : clockMode === 'morning' && hasStartedDay
    ? 'daytime'
    : clockMode;

  const badgeTone =
    effectiveMode === 'morning'
      ? 'tertiary'
      : effectiveMode === 'evening'
      ? 'neutral'
      : 'secondary';

  return (
    <Card
      as="article"
      padding="md"
      surface="lowest"
      className="relative flex h-full flex-col justify-between"
      data-purpose="today-card"
      data-today-mode={effectiveMode}
    >
      {/* Header */}
      <div className="mb-4 flex shrink-0 items-center justify-between border-b border-outline-variant/30 pb-3">
        <h2 className="font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
          Today
        </h2>

        <Pill tone={badgeTone} dot={true}>
          {MODE_LABELS[effectiveMode]}
        </Pill>
      </div>

      {/* Mode Content */}
      {effectiveMode === 'morning' && (
        <MorningState
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          deadlines48hCount={deadlines48hCount}
          pendingHabitsCount={pendingHabitsCount}
          focusInsight={focusInsight}
          activeTimer={activeTimerSnapshot}
          onSelectTask={setSelectedTaskId}
          onToggleTask={onToggleTask}
          onStartDay={() => setHasStartedDay(true)}
          onOpenFocusView={openFullscreenGlobal}
          onAddTask={() => onOpenQuickCapture?.('Task: ')}
        />
      )}

      {effectiveMode === 'daytime' && (
        <DaytimeState
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          checklist={streakState.checklist}
          focusInsight={focusInsight}
          activeTimer={activeTimerSnapshot}
          onSelectTask={setSelectedTaskId}
          onToggleTask={onToggleTask}
          onStartFocus={handleStartFocus}
          onOpenFocusView={openFullscreenGlobal}
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
    </Card>
  );
}
