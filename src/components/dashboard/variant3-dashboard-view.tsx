'use client';

import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { useFocusTimerStore } from '@/lib/store/use-focus-timer-store';
import { toggleHabitLog, type HabitWithLog } from '@/lib/actions/habits';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import type { NoteWithProject } from '@/lib/actions/notes';
import type { AssignmentWithProject } from '@/lib/actions/assignments';
import type { FinancialAnalytics } from '@/lib/actions/finances';
import { toggleTask, type TaskWithProject } from '@/lib/actions/tasks';
import type { DailyLoopDashboardData } from '@/lib/actions/daily-loop';
import type { TodayMode } from '@/lib/daily-loop/types';
import { StatsRow, buildDevMockDailyLoopData } from './stats-row/stats-row';
import { StreakMilestonesModal } from './stats-row/streak-milestones-modal';
import { TimezoneSync } from './timezone-sync';
import { TodayCard } from './today-card/today-card';
import type { TodayTaskItem } from './today-card/morning-state';
import type { FinishedTodayItem } from './today-card/evening-state';
import { DashboardExpensesCard } from './dashboard-expenses-card';
import { DashboardHabitsCard } from './dashboard-habits-card';
import { DashboardRightColumn } from './dashboard-right-column';
import { Pill } from '@/components/ui/pill';
import { daysBetweenDateStrings } from '@/lib/daily-loop/business-logic';
import { formatCalendarMetaFromDateString } from '@/lib/daily-loop/dashboard-derived';

interface Variant3DashboardProps {
  displayName?: string;
  greetingTime?: string;
  dayName?: string;
  dateFormatted?: string;
  weekNumber?: number;
  initialHabits?: HabitWithLog[];
  initialProjects?: ProjectWithMetrics[];
  initialNotes?: NoteWithProject[];
  initialAssignments?: AssignmentWithProject[];
  financialAnalytics?: FinancialAnalytics | null;
  todayTasks?: TaskWithProject[];
  dailyLoopData?: DailyLoopDashboardData | null;
  onOpenMilestones?: () => void;
}

export function Variant3DashboardView({
  displayName = 'Student',
  greetingTime = 'Good morning',
  dayName,
  dateFormatted,
  weekNumber,
  initialHabits = [],
  initialProjects = [],
  initialNotes = [],
  initialAssignments = [],
  financialAnalytics = null,
  todayTasks = [],
  dailyLoopData = null,
  onOpenMilestones,
}: Variant3DashboardProps) {
  const openQuickCapture = useUIStore((s) => s.openQuickCapture);

  const fallbackTodayStr = dailyLoopData?.todayDateStr || new Date().toISOString().slice(0, 10);
  const derivedMeta = formatCalendarMetaFromDateString(fallbackTodayStr);
  const resolvedDayName = dayName || derivedMeta.dayName;
  const resolvedDateFormatted = dateFormatted || derivedMeta.dateFormatted;
  const resolvedWeekNumber = weekNumber ?? derivedMeta.weekNumber;
  const currentMonth = resolvedDateFormatted.split(' ')[1] || derivedMeta.monthShort;

  const defaultDailyLoopData: DailyLoopDashboardData = {
    lifeScore: { total: 0, habitsScore: 0, focusScore: 0, tasksScore: 0, financeScore: 15, deltaVsYesterday: 0 },
    streakState: {
      currentStreak: 0,
      bestStreak: 0,
      freezesEarnedTotal: 0,
      freezesUsedTotal: 0,
      freezesLeft: 0,
      isTodayQualified: false,
      nextMilestone: 7,
      streakPreview: { current: 0, next: 1, isPreviewActive: false },
      checklist: {
        hasFocusSession: false,
        hasHabitCompleted: false,
        hasExpenseLogged: false,
        completedCount: 0,
        totalRequired: 2,
        isQualified: false,
      },
      history: [],
    },
    timeFocused: {
      minutes: 0,
      goalMinutes: 240,
      formattedTime: '0m',
      formattedGoal: '4h goal',
      percent: 0,
    },
    pocketLedger: {
      spentAmount: 0,
      monthlyAllowance: 15000,
      remainingAllowance: 15000,
      allowancePercent: 0,
      currentMonth,
    },
    weekStrip: [
      { dayLabel: 'M', date: 'fallback-0', isToday: false, isPast: true, isFuture: false, isQualified: false, isFrozen: false },
      { dayLabel: 'T', date: 'fallback-1', isToday: true, isPast: false, isFuture: false, isQualified: false, isFrozen: false },
      { dayLabel: 'W', date: 'fallback-2', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
      { dayLabel: 'T', date: 'fallback-3', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
      { dayLabel: 'F', date: 'fallback-4', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
      { dayLabel: 'S', date: 'fallback-5', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
      { dayLabel: 'S', date: 'fallback-6', isToday: false, isPast: false, isFuture: true, isQualified: false, isFrozen: false },
    ],
    userTimezone: 'UTC',
    isTimezoneNull: false,
    todayDateStr: fallbackTodayStr,
    todayMode: 'daytime',
    todayCheckIn: null,
    focusInsight: {
      peakHour: null,
      formattedPeakTime: null,
      totalSessions: 0,
      totalMinutes: 0,
      daysTracked: 0,
      hasEnoughData: false,
      insightText: null,
    },
    todayExpenseAmount: 0,
  };

  const isDev = process.env.NODE_ENV !== 'production';
  const [isDevMockActive, setIsDevMockActive] = useState(false);
  const [devForcedTodayMode, setDevForcedTodayMode] = useState<TodayMode | null>(null);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);

  const effectiveDailyLoop = dailyLoopData || defaultDailyLoopData;
  const activeTodayLoopData =
    isDev && isDevMockActive
      ? buildDevMockDailyLoopData(effectiveDailyLoop)
      : effectiveDailyLoop;

  const setTimerTimezone = useFocusTimerStore((s) => s.setUserTimezone);
  const setTimerDevMock = useFocusTimerStore((s) => s.setDevMockActive);

  useEffect(() => {
    setTimerTimezone(effectiveDailyLoop.userTimezone);
  }, [effectiveDailyLoop.userTimezone, setTimerTimezone]);

  useEffect(() => {
    setTimerDevMock(isDev && isDevMockActive);
  }, [isDev, isDevMockActive, setTimerDevMock]);

  // Habits Matrix state
  const [localHabits, setLocalHabits] = useState(initialHabits);

  useEffect(() => {
    setLocalHabits(initialHabits);
  }, [initialHabits]);

  const handleToggleHabitDay = async (habitId: string, dateStr: string, isFuture: boolean) => {
    if (isFuture || !dateStr || dateStr.startsWith('fallback-')) return;
    const todayDateStr = effectiveDailyLoop.weekStrip.find((d) => d.isToday)?.date;

    setLocalHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const isToday = dateStr === todayDateStr;
        const currentDone = isToday
          ? h.is_completed_today
          : !!h.weekly_history?.[dateStr];
        const nextDone = !currentDone;

        return {
          ...h,
          is_completed_today: isToday ? nextDone : h.is_completed_today,
          weekly_history: {
            ...(h.weekly_history || {}),
            [dateStr]: nextDone,
          },
          streak: isToday
            ? nextDone
              ? (h.streak || 0) + 1
              : Math.max(0, (h.streak || 1) - 1)
            : h.streak,
        };
      })
    );

    try {
      await toggleHabitLog(habitId, dateStr);
    } catch (err) {
      console.error('Failed to toggle habit log:', err);
    }
  };

  // Today Tasks for Today Card
  const [localTasks, setLocalTasks] = useState<TodayTaskItem[]>(() =>
    (todayTasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      is_completed: Boolean(t.is_completed),
    }))
  );

  useEffect(() => {
    setLocalTasks(
      (todayTasks || []).map((t) => ({
        id: t.id,
        title: t.title,
        is_completed: Boolean(t.is_completed),
      }))
    );
  }, [todayTasks]);

  const [mockTasks, setMockTasks] = useState<TodayTaskItem[]>([
    { id: 'dev-mock-1', title: 'Revise OS Ch. 4 (Virtual Memory)', is_completed: false },
    { id: 'dev-mock-2', title: 'Prepare Product Architecture RFC doc', is_completed: false },
    { id: 'dev-mock-3', title: 'Review PRs & design tokens', is_completed: false },
  ]);

  const handleToggleTask = async (taskId: string) => {
    if (isDev && isDevMockActive && taskId.startsWith('dev-mock-')) {
      setMockTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: !t.is_completed } : t))
      );
      return;
    }

    const target = localTasks.find((t) => t.id === taskId);
    if (!target) return;
    const nextCompleted = !target.is_completed;

    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, is_completed: nextCompleted } : t))
    );

    try {
      await toggleTask(taskId, nextCompleted);
    } catch (err) {
      console.error('Failed to toggle task status:', err);
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: target.is_completed } : t))
      );
    }
  };

  const effectiveTodayTasks: TodayTaskItem[] =
    isDev && isDevMockActive ? mockTasks : localTasks;

  const pendingAssignments = (initialAssignments || []).filter(
    (a) => a.status !== 'graded' && a.status !== 'submitted'
  );

  const deadlines48hCount =
    isDev && isDevMockActive
      ? 2
      : pendingAssignments.filter((a) => {
          if (!a.due_date) return false;
          const dueDay = a.due_date.slice(0, 10);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDay)) return false;
          const diffDays = daysBetweenDateStrings(effectiveDailyLoop.todayDateStr, dueDay);
          return diffDays >= 0 && diffDays <= 2;
        }).length;

  const pendingHabitsCount =
    isDev && isDevMockActive
      ? 3
      : localHabits.filter((h) => !h.is_completed_today).length;

  const finishedTodayItems: FinishedTodayItem[] =
    isDev && isDevMockActive
      ? [
          { id: 'mock-fin-1', title: 'Revise OS Ch. 4 (Virtual Memory)', meta: '2h 10m' },
          { id: 'mock-fin-2', title: 'Morning Sunlight & Walk', meta: 'Habit' },
          { id: 'mock-fin-3', title: 'Logged daily expenses', meta: '₹840' },
        ]
      : [
          ...localTasks
            .filter((t) => t.is_completed)
            .map((t) => ({ id: `task-${t.id}`, title: t.title, meta: 'Task' })),
          ...localHabits
            .filter((h) => h.is_completed_today)
            .map((h) => ({ id: `habit-${h.id}`, title: h.title, meta: 'Habit' })),
          ...(effectiveDailyLoop.timeFocused.minutes > 0
            ? [
                {
                  id: 'focus-today',
                  title: 'Focus session',
                  meta: effectiveDailyLoop.timeFocused.formattedTime,
                },
              ]
            : []),
          ...(effectiveDailyLoop.todayExpenseAmount > 0
            ? [
                {
                  id: 'expense-today',
                  title: 'Logged daily expenses',
                  meta: `₹${Math.round(effectiveDailyLoop.todayExpenseAmount).toLocaleString('en-IN')}`,
                },
              ]
            : []),
        ];

  const firstName = displayName.split(' ')[0] || 'Student';

  return (
    <div
      className="mx-auto flex min-h-[100dvh] w-full max-w-[1440px] flex-col justify-start font-sans antialiased"
      data-purpose="dashboard-stage"
    >
      <div
        className="flex w-full flex-1 flex-col bg-surface p-2.5 md:p-3.5 lg:p-4 transition-colors"
        data-purpose="dashboard-viewport-container"
      >
        <div
          className="flex flex-1 flex-col gap-6 min-w-0 pb-0"
          data-purpose="dashboard-workspace"
        >
          {/* 1. Greeting & Real Date Header */}
          <header className="flex w-full shrink-0 flex-col justify-between gap-2 border-b border-surface-container-high/60 pb-3 sm:flex-row sm:items-end">
            <h1 className="truncate font-serif text-page-title font-normal tracking-tight text-on-surface">
              {greetingTime}, {firstName}
            </h1>
            <div className="font-mono text-label-sm text-on-surface-variant">
              {resolvedDayName}, {resolvedDateFormatted}
            </div>
          </header>

          {/* Automatic Client Timezone Sync */}
          <TimezoneSync isTimezoneNull={effectiveDailyLoop.isTimezoneNull} />

          {/* 2. Four Stitch Telemetry Stat Cards */}
          <StatsRow
            data={effectiveDailyLoop}
            onOpenQuickCapture={openQuickCapture}
            onOpenMilestones={onOpenMilestones ?? (() => setIsMilestonesOpen(true))}
            isDevMockActive={isDevMockActive}
            onToggleDevMock={() => setIsDevMockActive((prev) => !prev)}
            devForcedTodayMode={devForcedTodayMode}
            onChangeDevTodayMode={setDevForcedTodayMode}
          />

          {/* 3. Three-Column Editorial Workspace (4 / 5 / 3 grid distribution) */}
          <section
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-h-0"
            data-purpose="2x2-bento-matrix"
          >
            {/* Left Column: Expenses & Habits (4 cols) */}
            <div className="lg:col-span-4 space-y-6 min-w-0">
              <DashboardExpensesCard
                financialAnalytics={financialAnalytics}
                currentMonth={currentMonth}
                onOpenQuickCapture={openQuickCapture}
              />
              <DashboardHabitsCard
                habits={localHabits}
                weekStrip={effectiveDailyLoop.weekStrip}
                onToggleHabitDay={handleToggleHabitDay}
              />
            </div>

            {/* Center Column: Time-Aware Today Card (5 cols) */}
            <div className="lg:col-span-5 space-y-6 min-w-0">
              <TodayCard
                initialMode={activeTodayLoopData.todayMode}
                userTimezone={activeTodayLoopData.userTimezone}
                forcedMode={isDev ? devForcedTodayMode : null}
                tasks={effectiveTodayTasks}
                deadlines48hCount={deadlines48hCount}
                pendingHabitsCount={pendingHabitsCount}
                streakState={activeTodayLoopData.streakState}
                focusInsight={activeTodayLoopData.focusInsight}
                initialCheckIn={activeTodayLoopData.todayCheckIn}
                finishedTodayItems={finishedTodayItems}
                isDevMockActive={isDev && isDevMockActive}
                onToggleTask={handleToggleTask}
                onOpenQuickCapture={openQuickCapture}
              />
            </div>

            {/* Right Column: Assignments, Projects & Ideas (3 cols) */}
            <DashboardRightColumn
              assignments={initialAssignments}
              projects={initialProjects}
              notes={initialNotes}
              onOpenQuickCapture={openQuickCapture}
            />
          </section>
        </div>
      </div>

      <StreakMilestonesModal
        open={isMilestonesOpen}
        onClose={() => setIsMilestonesOpen(false)}
        streakState={activeTodayLoopData.streakState}
      />
    </div>
  );
}
