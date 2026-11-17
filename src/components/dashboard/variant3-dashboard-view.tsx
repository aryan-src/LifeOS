'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUIStore } from '@/lib/store/use-ui-store';
import type { HabitWithLog } from '@/lib/actions/habits';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import type { NoteWithProject } from '@/lib/actions/notes';
import type { AssignmentWithProject } from '@/lib/actions/assignments';
import type { FinancialAnalytics } from '@/lib/actions/finances';
import type { TaskWithProject } from '@/lib/actions/tasks';

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
}: Variant3DashboardProps) {
  const openQuickCapture = useUIStore((s) => s.openQuickCapture);

  // Focus Timer Interactive Engine
  const [timerDuration, setTimerDuration] = useState(25 * 60);
  const [timerLeft, setTimerLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const selectPreset = (minutes: number) => {
    const sec = minutes * 60;
    setTimerDuration(sec);
    setTimerLeft(sec);
    setIsTimerRunning(false);
  };

  const togglePlayPause = () => {
    if (timerLeft === 0) setTimerLeft(timerDuration);
    setIsTimerRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerLeft(timerDuration);
  };

  const timerMins = Math.floor(timerLeft / 60);
  const timerSecs = timerLeft % 60;
  const timerFormatted = `${timerMins < 10 ? '0' : ''}${timerMins}:${timerSecs < 10 ? '0' : ''}${timerSecs}`;

  const circumference = 251.2;
  const progress = timerDuration > 0 ? (timerDuration - timerLeft) / timerDuration : 0;
  const strokeDashoffset = Math.max(0, Math.min(251.2, circumference * (1 - progress)));

  // Computed Telemetry
  const totalBlocks = Math.max(6, todayTasks.length);
  const completedBlocks = todayTasks.filter((t) => t.is_completed).length;
  const dailyProgressPercent = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  // Streak calculation
  const streakDays = initialHabits.length > 0 ? Math.max(...initialHabits.map((h) => h.streak || 0), 0) : 0;
  const consistencyPercent =
    initialHabits.length > 0
      ? Math.round(
          (initialHabits.filter((h) => h.is_completed_today).length / initialHabits.length) * 100
        )
      : 0;

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
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const [localHabits, setLocalHabits] = useState(initialHabits);

  useEffect(() => {
    setLocalHabits(initialHabits);
  }, [initialHabits]);

  const toggleHabitDay = (habitId: string) => {
    setLocalHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        return {
          ...h,
          is_completed_today: !h.is_completed_today,
          streak: !h.is_completed_today ? (h.streak || 0) + 1 : Math.max(0, (h.streak || 1) - 1),
        };
      })
    );
  };

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

          {/* 2. Full-Width Telemetry Ribbon */}
          <section
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 my-1 sm:my-2 gap-2.5 shrink-0"
            data-purpose="wide-focus-ribbon"
          >
            {/* Card 1 - Daily Progress */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-sans">
                  Daily Progress
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span
                  className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums"
                  style={{ fontFamily: '"Lora", serif' }}
                >
                  {completedBlocks}/{totalBlocks}
                </span>
                <span className="text-xs text-stone-500 dark:text-zinc-400 font-serif">done</span>
              </div>
              <div className="space-y-2">
                <div className="w-full h-1.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#006c49] dark:bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${dailyProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2 - Habit Streak */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-sans">
                  Habit Streak
                </span>
                <div className="inline-flex items-center gap-1 text-amber-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path
                      clipRule="evenodd"
                      fillRule="evenodd"
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.527.82-1.17 2.107-1.17 3.52 0 .048.002.096.005.143-.377-.384-.71-.853-.948-1.378a1 1 0 00-1.666-.277C5.556 6.182 5 7.608 5 9.091 5 12.907 8.134 16 12 16c3.866 0 7-3.093 7-6.909 0-3.328-2.229-5.957-4.444-6.425a1 1 0 00-.73.136c-.22.146-.425.32-.615.518-.328-.27-.665-.548-.816-.767zM8.5 10.5A3.5 3.5 0 0012 14a3.5 3.5 0 003.5-3.5c0-1.636-1.042-3.033-2.33-3.418.156.495.19 1.042.062 1.58-.2 0.835-.788 1.488-1.528 1.776A1 1 0 0110.39 9.17c.074-.525-.015-1.063-.263-1.554C9.28 8.442 8.5 9.38 8.5 10.5z"
                    />
                  </svg>
                  <span
                    className="text-[15px] text-stone-900 dark:text-zinc-100 tracking-tight font-bold"
                    style={{ fontFamily: '"Lora", serif' }}
                  >
                    {streakDays}D
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span
                  className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums"
                  style={{ fontFamily: '"Lora", serif' }}
                >
                  {consistencyPercent}%
                </span>
                <span className="text-xs text-stone-500 dark:text-zinc-400 font-serif">Consistency</span>
              </div>
              <div className="space-y-2">
                <div className="w-full h-1.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#006c49] dark:bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${consistencyPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3 - Time Focused */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-sans">
                  Time Focused
                </span>
                <span className="w-2 h-2 rounded-full bg-[#006c49] animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span
                  className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums"
                  style={{ fontFamily: '"Lora", serif' }}
                >
                  {Math.floor((timerDuration - timerLeft) / 60)}m active
                </span>
                <span className="text-xs text-stone-500 dark:text-zinc-400 font-serif">today</span>
              </div>
              <div className="space-y-2">
                <div className="w-full h-1.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#006c49] dark:bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 4 - Pocket Ledger */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-sans">
                  Pocket Ledger
                </span>
                <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {currentMonth}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span
                  className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 tabular-nums"
                  style={{ fontFamily: '"Lora", serif' }}
                >
                  ₹{remainingAllowance.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-stone-500 dark:text-zinc-400 font-serif">
                  / ₹{monthlyAllowance.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="space-y-2">
                <div className="w-full h-1.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#006c49] dark:bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${allowancePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

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
                      className="text-base font-semibold tracking-tight text-stone-900 dark:text-zinc-100 font-sans"
                      style={{ fontFamily: 'var(--font-sans, "Geist", "Inter", sans-serif)' }}
                    >
                      Expenses
                    </h3>
                    <span className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {currentMonth}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-xl font-bold text-stone-900 dark:text-zinc-100 leading-none">
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
                      <span className="text-lg font-mono font-bold tabular-nums text-stone-900 dark:text-zinc-100 leading-tight mt-0.5">
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
                          <span className="font-mono tabular-nums text-xs text-stone-600 dark:text-zinc-400 font-medium shrink-0 ml-2">
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
                className="flex-1 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-stone-300/80 dark:hover:border-zinc-700 transition-all duration-200 min-w-0"
                data-purpose="habits-card"
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2 pb-2.5 border-b border-stone-100 dark:border-zinc-800">
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
                    <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-xl bg-stone-50/50 dark:bg-zinc-800/40 border border-dashed border-stone-300 dark:border-zinc-700 text-center my-2.5">
                      <svg className="w-10 h-10 text-stone-300 dark:text-zinc-600 mb-1.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-sm font-medium text-stone-700 dark:text-zinc-300 italic font-serif">
                        No habits tracked yet.
                      </p>
                      <p className="text-xs text-stone-400 dark:text-zinc-500 mt-1 max-w-xs font-serif">
                        Create daily protocols to build recurring momentum.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center space-y-2.5 py-1">
                      {localHabits.slice(0, 3).map((habit) => (
                        <div
                          key={habit.id}
                          className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-stone-900 dark:text-zinc-100 truncate font-sans">
                              {habit.title}
                            </span>
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
                          {/* 7-day checkboxes */}
                          <div className="flex items-center justify-between gap-1">
                            {dayLabels.map((lbl, idx) => {
                              const isSunday = idx === 6;
                              const isDone = isSunday ? habit.is_completed_today : true;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => toggleHabitDay(habit.id)}
                                  className={`w-6 h-6 rounded-md text-[10px] font-mono flex items-center justify-center transition-all cursor-pointer ${
                                    isDone
                                      ? 'bg-[#006c49] text-white font-medium hover:opacity-90'
                                      : isSunday
                                      ? 'bg-amber-400 text-white font-bold hover:bg-amber-500'
                                      : 'bg-stone-200 dark:bg-zinc-700 text-stone-600 dark:text-zinc-400 hover:bg-stone-300'
                                  }`}
                                >
                                  {lbl}
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
            {/* Full-Height Focus Mode Centerpiece */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="h-full flex flex-col justify-between p-5 sm:p-7 rounded-2xl bg-white dark:bg-zinc-900/90 border border-stone-200/70 dark:border-zinc-800 shadow-[0_1px_4px_rgba(0,0,0,0.03)] relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#006c49] dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h3
                      className="text-lg font-semibold text-stone-900 dark:text-zinc-100 tracking-tight"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                    >
                      Focus Mode
                    </h3>
                  </div>
                </div>

                {/* Timer Circular Display & Presets */}
                <div className="my-auto py-4 sm:py-6 flex flex-col items-center justify-center text-center">
                  <div
                    className="relative flex items-center justify-center mb-5 shrink-0"
                    style={{ borderRadius: '9999px' }}
                  >
                    <svg className="w-40 h-40 sm:w-44 sm:h-44 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        fill="none"
                        r="40"
                        stroke="#EAE7DF"
                        strokeWidth="5"
                        className="dark:stroke-zinc-800"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        fill="none"
                        r="40"
                        stroke="#10B981"
                        strokeDasharray="251.2"
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        strokeWidth="5"
                        className="transition-all duration-500 ease-linear"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span
                        className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 leading-none tabular-nums"
                        style={{ fontFamily: '"Lora", serif' }}
                      >
                        {timerFormatted}
                      </span>
                      <span className="text-[10px] font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-wider mt-1.5 font-sans">
                        Focus Session
                      </span>
                    </div>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center justify-center gap-2 mb-5">
                    <button
                      type="button"
                      onClick={() => selectPreset(15)}
                      className={`px-3 py-1 rounded-full text-xs transition-all font-sans cursor-pointer ${
                        timerDuration === 15 * 60
                          ? 'bg-[#006c49] text-white shadow-sm font-semibold'
                          : 'border border-stone-200/80 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 font-medium hover:border-stone-300'
                      }`}
                    >
                      15m
                    </button>
                    <button
                      type="button"
                      onClick={() => selectPreset(25)}
                      className={`px-3.5 py-1 rounded-full text-xs transition-all font-sans cursor-pointer ${
                        timerDuration === 25 * 60
                          ? 'bg-[#006c49] text-white shadow-sm font-semibold'
                          : 'border border-stone-200/80 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 font-medium hover:border-stone-300'
                      }`}
                    >
                      25m
                    </button>
                    <button
                      type="button"
                      onClick={() => selectPreset(50)}
                      className={`px-3 py-1 rounded-full text-xs transition-all font-sans cursor-pointer ${
                        timerDuration === 50 * 60
                          ? 'bg-[#006c49] text-white shadow-sm font-semibold'
                          : 'border border-stone-200/80 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 font-medium hover:border-stone-300'
                      }`}
                    >
                      50m
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-3 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="flex-1 h-10 px-5 rounded-xl bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-stone-800 dark:hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm text-[13px] font-medium font-sans cursor-pointer"
                    >
                      {isTimerRunning ? (
                        <>
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                          <span>Pause Sprint</span>
                        </>
                      ) : timerLeft < timerDuration && timerLeft > 0 ? (
                        <>
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          <span>Resume Sprint</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          <span>Start Focus</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetTimer}
                      title="Reset Timer"
                      className="h-10 w-10 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200/60 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 transition-colors flex items-center justify-center shrink-0 border border-stone-200/60 dark:border-zinc-700 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Bottom Focus Subject Bar (Focus Queue) */}
                <div className="pt-3.5 border-t border-stone-100 dark:border-zinc-800 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-sans">
                        Focus Queue
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openQuickCapture('Task: ')}
                      className="text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors text-[11px] font-medium flex items-center gap-1 font-sans cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Add Task</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* Active Queue Task */}
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/80 border border-[#006c49]/40 dark:border-emerald-500/40 shadow-xs flex items-center justify-between gap-3 cursor-pointer">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-[#006c49]/15 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 text-[#006c49] dark:text-emerald-400">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-stone-900 dark:text-zinc-100 truncate font-serif">
                            {todayTasks[0]?.title || 'Revise OS Ch. 4 (Virtual Memory)'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[#006c49] dark:text-emerald-400 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>

                    {/* Secondary Queue Items */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200/60 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-3 cursor-pointer">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-full border border-stone-300 dark:border-zinc-600 flex items-center justify-center shrink-0 text-stone-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-zinc-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-stone-800 dark:text-zinc-200 truncate font-serif">
                            {todayTasks[1]?.title || 'Prepare Product Architecture RFC doc'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200/60 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-3 cursor-pointer">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-full border border-stone-300 dark:border-zinc-600 flex items-center justify-center shrink-0 text-stone-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-zinc-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-stone-800 dark:text-zinc-200 truncate font-serif">
                            {todayTasks[2]?.title || 'Review PRs & design tokens'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                      <p className="text-xs text-stone-500 dark:text-zinc-400 italic font-serif">
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
