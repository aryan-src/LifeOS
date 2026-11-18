'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { TimezoneSync } from './timezone-sync';
import { TodayCard } from './today-card/today-card';
import type { TodayTaskItem } from './today-card/morning-state';
import type { FinishedTodayItem } from './today-card/evening-state';
import { daysBetweenDateStrings, formatStreakBadge } from '@/lib/daily-loop/business-logic';

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
}

export function Variant3DashboardView({
  displayName = 'Aryan',
  greetingTime = 'Good morning',
  dayName = 'Tuesday',
  dateFormatted = '17 Nov',
  weekNumber = 47,
  initialHabits = [],
  initialProjects = [],
  initialNotes = [],
  initialAssignments = [],
  financialAnalytics = null,
  todayTasks = [],
  dailyLoopData = null,
}: Variant3DashboardProps) {
  const openQuickCapture = useUIStore((s) => s.openQuickCapture);

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
      checklist: { hasFocusSession: false, hasHabitCompleted: false, hasExpenseLogged: false, completedCount: 0, totalRequired: 2, isQualified: false },
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
      currentMonth: 'Nov',
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
    todayDateStr: '2026-11-17',
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

  // Pocket Money & Financials
  const monthlyAllowance = financialAnalytics?.monthlyAllowance ?? 5000;
  const remainingAllowance = financialAnalytics?.remainingAllowance ?? 0;
  const todaySpent = financialAnalytics?.todaySpent ?? 0;
  const allowancePercent =
    monthlyAllowance > 0
      ? Math.min(100, Math.round(((monthlyAllowance - remainingAllowance) / monthlyAllowance) * 100))
      : 0;

  // Category breakdown
  const categoryMap = (financialAnalytics?.categoryBreakdown || []).reduce<Record<string, number>>(
    (acc, cat) => {
      acc[cat.name.toLowerCase()] = cat.value;
      return acc;
    },
    {}
  );
  const booksSpend = categoryMap['books'] || categoryMap['education'] || 0;
  const cafeSpend = categoryMap['cafe'] || categoryMap['food'] || categoryMap['dining'] || 0;
  const transitSpend = categoryMap['transit'] || categoryMap['travel'] || categoryMap['transport'] || 0;

  // Shared Category Palette (synchronized between donut slices and breakdown dots)
  const CATEGORIES = [
    { key: 'books', name: 'Books', color: '#10B981', spend: booksSpend },
    { key: 'cafe', name: 'Cafe', color: '#F59E0B', spend: cafeSpend },
    { key: 'transit', name: 'Transit', color: '#64748B', spend: transitSpend },
  ];

  const categoryTotal = booksSpend + cafeSpend + transitSpend;
  const totalExpenses = todaySpent > 0 ? todaySpent : (financialAnalytics?.monthlySpent ?? categoryTotal);

  // Slim Donut Arc Slices Calculation (r = 78 in 200x200 viewBox, C ≈ 490.088)
  const donutCircumference = 2 * Math.PI * 78;
  const activeCategories = CATEGORIES.filter((c) => c.spend > 0);
  let cumulativeDonutLength = 0;
  const donutSlices = activeCategories.map((cat) => {
    const fraction = categoryTotal > 0 ? cat.spend / categoryTotal : 0;
    const sliceLen = fraction * donutCircumference;
    const gap = activeCategories.length > 1 ? 3 : 0;
    const dash = Math.max(0, sliceLen - gap);
    const offset = -cumulativeDonutLength;
    cumulativeDonutLength += sliceLen;
    return {
      key: cat.key,
      color: cat.color,
      dash,
      circumference: donutCircumference,
      offset,
    };
  });

  // Upcoming Submissions
  const pendingAssignments = (initialAssignments || []).filter(
    (a) => a.status !== 'graded' && a.status !== 'submitted'
  );
  const displayAssignments = pendingAssignments.slice(0, 3);

  // Habits Matrix
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

  // Dev-only sample tasks (strictly in-memory, never persisted to DB)
  const [mockTasks, setMockTasks] = useState<TodayTaskItem[]>([
    { id: 'dev-mock-1', title: 'Revise OS Ch. 4 (Virtual Memory)', is_completed: false },
    { id: 'dev-mock-2', title: 'Prepare Product Architecture RFC doc', is_completed: false },
    { id: 'dev-mock-3', title: 'Review PRs & design tokens', is_completed: false },
  ]);

  const effectiveTodayTasks: TodayTaskItem[] =
    isDev && isDevMockActive ? mockTasks : localTasks;

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

  // Active Projects
  const activeProjects = (initialProjects || []).filter(
    (p) => p.status === 'active' || p.status === 'backlog'
  );
  const displayProjects = activeProjects.slice(0, 3);

  // Recent Ideas
  const recentIdeas = (initialNotes || []).slice(0, 2);

  // Current Month abbreviation
  const currentMonth = dateFormatted.split(' ')[1] || 'NOV';

  return (
    <div
      className="w-full max-w-[1600px] mx-auto min-h-[100dvh] flex flex-col justify-start font-sans antialiased selection:bg-amber-100"
      data-purpose="dashboard-stage"
    >
      {/* Master Viewport Container */}
      <div
        className="w-full flex-1 bg-[var(--theme-bg-page,#FAF9F5)] dark:bg-[var(--theme-bg-page,#09090b)] p-2.5 md:p-3.5 lg:p-4 rounded-none md:rounded-3xl shadow-none md:shadow-xl flex flex-col transition-colors"
        data-purpose="dashboard-viewport-container"
      >
        {/* Main Dashboard Canvas */}
        <main
          className="flex-1 flex flex-col gap-2.5 md:gap-3.5 min-w-0 pb-0"
          data-purpose="dashboard-workspace"
        >
          {/* 1. Full-Width Greeting Strip */}
          <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/50 dark:border-zinc-800/60 pb-3 shrink-0">
            <div className="flex flex-col gap-1 min-w-0">
              <h1
                className="text-2xl sm:text-3xl lg:text-[2.25rem] leading-[2.6rem] font-bold tracking-tight text-stone-900 dark:text-zinc-100 truncate"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {greetingTime}, {displayName}
              </h1>
            </div>
            {/* Academic Cycle & Date Badge */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-stone-600 dark:text-zinc-400">
                <span className="text-[13px] font-medium text-stone-900 dark:text-zinc-200 font-sans">
                  {dayName}, {dateFormatted}
                </span>
                <span className="text-stone-300 dark:text-zinc-600">•</span>
                <span className="text-xs text-stone-500 dark:text-zinc-400 font-sans">
                  Week {weekNumber}
                </span>
              </div>
            </div>
          </header>

          {/* Automatic Client Timezone Sync */}
          <TimezoneSync isTimezoneNull={effectiveDailyLoop.isTimezoneNull} />

          {/* 2. Full-Width Telemetry Ribbon (Stats Row) */}
          <StatsRow
            data={effectiveDailyLoop}
            onOpenQuickCapture={openQuickCapture}
            isDevMockActive={isDevMockActive}
            onToggleDevMock={() => setIsDevMockActive((prev) => !prev)}
            devForcedTodayMode={devForcedTodayMode}
            onChangeDevTodayMode={setDevForcedTodayMode}
          />

          {/* 3. Band 4: 3-Column Asymmetric Bento Cockpit */}
          <section
            className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-2.5 sm:gap-3 min-h-0"
            data-purpose="2x2-bento-matrix"
          >
            {/* ================= LEFT COLUMN (lg:col-span-4) ================= */}
            <div className="lg:col-span-4 flex flex-col gap-2.5 sm:gap-3">
              {/* Top Card - Expenses (Slim Donut + Synchronized Breakdown) */}
              <article
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200"
                data-purpose="pocket-money-card"
              >
                {/* 1. Typography & Header Row */}
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-base font-semibold tracking-tight text-stone-900 dark:text-zinc-100"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                    >
                      Expenses
                    </h3>
                    <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {currentMonth}
                    </span>
                  </div>
                  <span
                    className="font-mono tabular-nums lining-nums text-xl font-bold text-stone-900 dark:text-zinc-100 leading-none"
                    style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
                  >
                    ₹{totalExpenses.toFixed(2)}
                  </span>
                </div>

                {/* 2. Slim Donut Chart & Synchronized Breakdown */}
                <div className="grid grid-cols-2 items-center gap-3 my-3">
                  {/* Left: Slim Donut Chart with generous clearance */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg
                      className="w-32 h-32 sm:w-36 sm:h-36 -rotate-90"
                      viewBox="0 0 200 200"
                      fill="none"
                    >
                      {/* Neutral empty-track ring (light: #E7E5E4, dark: #27272A) */}
                      <circle
                        cx="100"
                        cy="100"
                        r="78"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="16"
                        className="text-[#E7E5E4] dark:text-[#27272A]"
                      />

                      {/* Donut Colored Slices: only rendered when total spend > 0 */}
                      {categoryTotal > 0 &&
                        donutSlices.map((slice) => (
                          <circle
                            key={slice.key}
                            cx="100"
                            cy="100"
                            r="78"
                            fill="none"
                            stroke={slice.color}
                            strokeWidth="16"
                            strokeDasharray={`${slice.dash} ${slice.circumference - slice.dash}`}
                            strokeDashoffset={slice.offset}
                            strokeLinecap={activeCategories.length === 1 ? 'butt' : 'round'}
                            className="transition-all duration-500 ease-out"
                          />
                        ))}
                    </svg>

                    {/* Center Readout with generous inner clearance */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                      <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-stone-400 dark:text-zinc-500">
                        {currentMonth} CYCLE
                      </span>
                      <span
                        className="text-lg font-mono font-bold tabular-nums lining-nums text-stone-900 dark:text-zinc-100 leading-tight mt-0.5"
                        style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
                      >
                        {totalExpenses > 0 ? `₹${Math.round(totalExpenses).toLocaleString('en-IN')}` : '₹0'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Synchronized Compact Breakdown Rows */}
                  <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
                    {CATEGORIES.map((cat) => {
                      const pct = categoryTotal > 0 ? Math.round((cat.spend / categoryTotal) * 100) : 0;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => openQuickCapture(`Expense ${cat.name}: `)}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-stone-50/80 dark:bg-zinc-900/60 border border-stone-200/50 dark:border-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left min-w-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-xs font-medium text-stone-800 dark:text-zinc-200 truncate font-sans">
                              {cat.name}
                            </span>
                          </div>
                          <span
                            className="font-mono tabular-nums lining-nums text-xs text-stone-600 dark:text-zinc-400 font-medium shrink-0 ml-2"
                            style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
                          >
                            {pct}% · ₹{cat.spend.toLocaleString('en-IN')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>

              {/* Bottom Card - Habits Matrix */}
              <article
                className="flex-1 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-start hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200 min-w-0"
                data-purpose="habits-card"
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-stone-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-stone-500 dark:text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span
                        className="text-base font-semibold text-stone-900 dark:text-zinc-100"
                        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                      >
                        Habits
                      </span>
                    </div>
                    <Link
                      href="/habits"
                      className="text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors text-xs font-sans font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Add Habit</span>
                    </Link>
                  </div>

                  {localHabits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-stone-50/50 dark:bg-zinc-800/40 border border-dashed border-stone-300 dark:border-zinc-700 text-center my-1.5">
                      <svg className="w-8 h-8 text-stone-300 dark:text-zinc-600 mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-sm font-medium text-stone-700 dark:text-zinc-300 font-serif">
                        No habits tracked yet.
                      </p>
                      <p className="text-xs text-stone-400 dark:text-zinc-500 mt-0.5 max-w-xs font-serif">
                        Create daily protocols to build recurring momentum.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 py-0.5">
                      {localHabits.slice(0, 3).map((habit) => (
                        <div
                          key={habit.id}
                          className="p-2 sm:p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-medium text-stone-900 dark:text-zinc-100 truncate font-sans">
                                {habit.title}
                              </span>
                              <span
                                className="text-[10px] font-mono tabular-nums lining-nums px-1.5 py-0.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40 rounded shrink-0 font-medium"
                                style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
                              >
                                🔥 {formatStreakBadge(habit.streak || 0)}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-mono font-semibold shrink-0 ml-1 ${
                                habit.is_completed_today
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {habit.is_completed_today ? 'Done Today ✓' : 'In Progress'}
                            </span>
                          </div>
                          {/* 7-day checkboxes backed by real habit_logs */}
                          <div className="flex items-center justify-between gap-1">
                            {effectiveDailyLoop.weekStrip.map((day) => {
                              const isDone = day.isFuture
                                ? false
                                : day.isToday
                                ? habit.is_completed_today
                                : !!habit.weekly_history?.[day.date];

                              let btnClasses =
                                'bg-stone-100 dark:bg-zinc-800/40 text-stone-300 dark:text-zinc-600 border border-stone-200/50 dark:border-zinc-800/60 cursor-default';

                              if (!day.isFuture) {
                                if (isDone) {
                                  btnClasses =
                                    'bg-[#006c49] dark:bg-emerald-600 text-white font-medium hover:opacity-90 cursor-pointer';
                                } else if (day.isToday) {
                                  btnClasses =
                                    'border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-semibold cursor-pointer';
                                } else {
                                  btnClasses =
                                    'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border border-stone-200/60 dark:border-zinc-700/60 hover:bg-stone-200 dark:hover:bg-zinc-700 cursor-pointer';
                                }
                              }

                              return (
                                <button
                                  key={day.date}
                                  type="button"
                                  disabled={day.isFuture}
                                  onClick={() => handleToggleHabitDay(habit.id, day.date, day.isFuture)}
                                  className={`w-6 h-6 rounded-md text-[10px] font-mono tabular-nums lining-nums flex items-center justify-center transition-all ${btnClasses}`}
                                  style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
                                  title={`${day.dayLabel}${day.date && !day.date.startsWith('fallback-') ? ` (${day.date})` : ''}: ${
                                    day.isFuture ? 'Upcoming' : isDone ? 'Completed' : 'Not done'
                                  }`}
                                >
                                  {day.dayLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </div>

            {/* ================= CENTER COLUMN (lg:col-span-4) ================= */}
            {/* Time-Aware Today Card (Morning / Daytime / Evening) */}
            <div className="lg:col-span-4 flex flex-col">
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

            {/* ================= RIGHT COLUMN (lg:col-span-4) ================= */}
            <div className="lg:col-span-4 flex flex-col gap-2.5 sm:gap-3">
              {/* Top Card - Assignments */}
              <article
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200"
                data-purpose="submissions-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-stone-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-stone-500 dark:text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <h3
                        className="text-base font-semibold text-stone-900 dark:text-zinc-100"
                        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                      >
                        Assignments
                      </h3>
                    </div>
                    <span className="text-xs text-stone-500 dark:text-zinc-400 font-sans font-medium">
                      {pendingAssignments.length} due
                    </span>
                  </div>

                  {displayAssignments.length === 0 ? (
                    <div className="py-5 flex flex-col items-center justify-center text-center">
                      <div className="flex items-center justify-center text-stone-300 dark:text-zinc-600 mb-2">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-stone-900 dark:text-zinc-100 font-serif">
                        No pending submissions
                      </span>
                      <p className="text-xs text-stone-400 dark:text-zinc-500 mt-1 max-w-xs font-serif">
                        All academic deliverables and coursework up to date.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-1">
                      {displayAssignments.map((a) => (
                        <div
                          key={a.id}
                          className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <h4 className="text-xs font-medium text-stone-900 dark:text-zinc-100 truncate font-sans">
                              {a.title}
                            </h4>
                            <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-sans">
                              {a.due_date ? `Due ${a.due_date}` : 'Upcoming'}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 font-mono shrink-0">
                            Pending
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>

              {/* Middle Card - Projects */}
              <article
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-stone-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-stone-500 dark:text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span
                        className="text-base font-semibold text-stone-900 dark:text-zinc-100"
                        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                      >
                        Projects
                      </span>
                    </div>
                    <span className="text-xs text-stone-500 dark:text-zinc-400 font-sans font-medium">
                      {activeProjects.length} active
                    </span>
                  </div>

                  {displayProjects.length === 0 ? (
                    <div className="py-5 flex flex-col items-center justify-center text-center">
                      <div className="flex items-center justify-center text-stone-300 dark:text-zinc-600 mb-2">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-stone-900 dark:text-zinc-100 font-serif">
                        No active projects
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 py-1">
                      {displayProjects.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 flex items-center justify-between"
                        >
                          <span className="text-xs font-medium text-stone-900 dark:text-zinc-100 truncate font-sans">
                            {p.title}
                          </span>
                          <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-400">
                            {p.total_tasks ?? 0} tasks
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>

              {/* Bottom Card - Ideas Scratchpad */}
              <article
                className="flex-1 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200 min-w-0"
                data-purpose="projects-ideas-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-stone-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span
                        className="text-base font-semibold text-stone-900 dark:text-zinc-100"
                        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                      >
                        Ideas
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>

                  {recentIdeas.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-stone-50/50 dark:bg-zinc-800/40 border border-dashed border-stone-300 dark:border-zinc-700 text-center my-2">
                      <svg className="w-9 h-9 text-stone-300 dark:text-zinc-600 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-xs text-stone-500 dark:text-zinc-400 font-serif">
                        No ideas recorded yet for this cycle.
                      </p>
                      <p className="text-[11px] text-stone-400 dark:text-zinc-500 mt-1 font-serif">
                        Capture spontaneous cognitive fragments.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-1">
                      {recentIdeas.map((note) => (
                        <div
                          key={note.id}
                          className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60"
                        >
                          <h4 className="text-xs font-medium text-stone-900 dark:text-zinc-100 truncate font-sans">
                            {note.title}
                          </h4>
                          {note.content && (
                            <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-1 mt-0.5 font-serif">
                              {note.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
