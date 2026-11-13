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
  dayName = 'Wednesday',
  dateFormatted = '15 Nov',
  weekNumber = 46,
  initialHabits = [],
  initialProjects = [],
  initialNotes = [],
  initialAssignments = [],
  financialAnalytics = null,
  todayTasks = [],
}: Variant3DashboardProps) {
  const openQuickCapture = useUIStore((s) => s.openQuickCapture);

  // Zen Focus Timer Interactive Engine
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

  // Weekly outflow bars
  const weeklyDays = financialAnalytics?.weeklyDays || [];
  const maxSpend = Math.max(1, ...weeklyDays.map((d) => d.spent || 0));

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

  const userInitial = (displayName[0] || 'A').toUpperCase();

  return (
    <div
      className="w-full max-w-[1440px] mx-auto min-h-[100dvh] flex flex-col justify-start font-sans antialiased selection:bg-amber-100"
      data-purpose="dashboard-stage"
    >
      {/* BEGIN: MasterGlassFrame */}
      <div
        className="w-full min-h-[100dvh] bg-[#FAF9F5] dark:bg-zinc-900/95 p-2 md:p-3 lg:p-4 rounded-none md:rounded-3xl border-0 md:border border-[#DCDAD4] dark:border-zinc-800 shadow-none md:shadow-2xl flex flex-col md:flex-row gap-2 md:gap-3 lg:gap-4 transition-colors overflow-hidden"
        data-purpose="dashboard-viewport-container"
      >
        {/* BEGIN: LeftNavigationRail */}
        <aside
          className="w-full md:w-14 shrink-0 bg-[#F5F3EC] dark:bg-zinc-800/80 border border-[#E7E5E4] dark:border-zinc-700/60 rounded-2xl flex flex-row md:flex-col items-center py-2 md:py-4 justify-between select-none px-3 md:px-0"
          data-purpose="nav-rail"
        >
          {/* Top Rail Stack */}
          <div className="flex flex-row md:flex-col items-center gap-2.5 w-auto md:w-full">
            {/* Brand Hub Button */}
            <Link
              href="/"
              aria-label="LifeOS Master Switch"
              className="w-9 h-9 rounded-full bg-textMain dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-sm hover:scale-105 transition-transform mb-0 md:mb-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div className="hidden md:block w-6 h-px bg-[#E2E0D8] dark:bg-zinc-700 my-1" />
            {/* Dock Icons */}
            <Link
              href="/dashboard"
              aria-label="Command Cockpit"
              className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-700 border border-[#E2E0D8] dark:border-zinc-600 text-textMain dark:text-zinc-100 shadow-xs flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect height="7" rx="1" width="7" x="3" y="3" />
                <rect height="7" rx="1" width="7" x="14" y="3" />
                <rect height="7" rx="1" width="7" x="14" y="14" />
                <rect height="7" rx="1" width="7" x="3" y="14" />
              </svg>
            </Link>
            <Link
              href="/finances"
              aria-label="Pocket Money & Ledger"
              className="w-9 h-9 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-700/60 border border-transparent hover:border-[#E2E0D8] dark:hover:border-zinc-600 text-textMuted dark:text-zinc-400 hover:text-textMain dark:hover:text-zinc-100 flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/assignments"
              aria-label="Submissions & Academics"
              className="w-9 h-9 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-700/60 border border-transparent hover:border-[#E2E0D8] dark:hover:border-zinc-600 text-textMuted dark:text-zinc-400 hover:text-textMain dark:hover:text-zinc-100 flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/habits"
              aria-label="Habits Tracker"
              className="w-9 h-9 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-700/60 border border-transparent hover:border-[#E2E0D8] dark:hover:border-zinc-600 text-textMuted dark:text-zinc-400 hover:text-textMain dark:hover:text-zinc-100 flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/projects"
              aria-label="Active Projects"
              className="w-9 h-9 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-700/60 border border-transparent hover:border-[#E2E0D8] dark:hover:border-zinc-600 text-textMuted dark:text-zinc-400 hover:text-textMain dark:hover:text-zinc-100 flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/notes"
              aria-label="Ideas Vault"
              className="w-9 h-9 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-700/60 border border-transparent hover:border-[#E2E0D8] dark:hover:border-zinc-600 text-textMuted dark:text-zinc-400 hover:text-textMain dark:hover:text-zinc-100 flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          {/* Bottom User Controls */}
          <div className="flex flex-row md:flex-col items-center gap-2">
            <Link
              href="/settings"
              aria-label="Settings"
              className="w-9 h-9 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-700/60 border border-transparent hover:border-[#E2E0D8] dark:hover:border-zinc-600 text-textMuted dark:text-zinc-400 hover:text-textMain dark:hover:text-zinc-100 flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/settings"
              aria-label={`${displayName} Profile`}
              className="w-8 h-8 rounded-full bg-[#E5E2D9] dark:bg-zinc-700 border-2 border-white dark:border-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-textMain dark:text-zinc-100 shadow-xs hover:scale-105 transition-transform"
            >
              {userInitial}
            </Link>
          </div>
        </aside>
        {/* END: LeftNavigationRail */}

        {/* BEGIN: Main Dashboard Canvas */}
        <main
          className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto pb-20 md:pb-24"
          data-purpose="dashboard-workspace"
        >
          {/* Top Greeting & Header Bar */}
          <header className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0 min-h-[36px]">
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-textMain dark:text-zinc-100 truncate">
                {greetingTime}, {displayName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-mono text-[#52443d] dark:text-[#f0e7e1] bg-[#f0e7e1] dark:bg-stone-800 border border-[#e2d8d2] dark:border-stone-700 shrink-0">
                {dayName}, {dateFormatted} • Week {weekNumber}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative hidden sm:block">
                <input
                  onClick={() => openQuickCapture()}
                  readOnly
                  className="w-44 lg:w-52 pl-7 pr-3 py-1 text-xs rounded-full bg-[#F5F3EC] dark:bg-zinc-800 border border-borderWarm dark:border-zinc-700 text-textMain dark:text-zinc-100 placeholder:text-textSubtle focus:ring-1 focus:ring-stone-400 focus:border-stone-400 cursor-pointer"
                  placeholder="Search "
                  type="text"
                />
                <svg className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </header>

          {/* ROW 1: Top Summary Row (Focus Mode, Daily Progress, Habit Streak, Time Focused, Pocket Ledger) */}
          <section
            className="shrink-0 bg-ivory dark:bg-zinc-950/40 border border-borderWarm dark:border-zinc-800 rounded-2xl p-3 md:p-3.5 shadow-xs transition-colors"
            data-purpose="wide-focus-ribbon"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 min-w-0">
              {/* ITEM 1: Focus Mode */}
              <div className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex items-center justify-between gap-3 min-w-0 h-full sm:col-span-2 lg:col-span-1 xl:col-span-1">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="40" stroke="#EAE7DF" strokeWidth="5" className="dark:stroke-zinc-800" />
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
                  <div className="absolute inset-2 rounded-full bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 shadow-inner flex flex-col items-center justify-center">
                    <span className="text-xs sm:text-sm font-mono font-bold text-textMain dark:text-zinc-100 tabular-nums">
                      {timerFormatted}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif text-xs sm:text-sm font-semibold text-textMain dark:text-zinc-100 truncate">Focus Mode</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse shrink-0" />
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => selectPreset(25)}
                      className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono rounded transition-colors ${
                        timerDuration === 25 * 60
                          ? 'bg-textMain dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium shadow-xs'
                          : 'bg-[#FAF9F5] dark:bg-zinc-800 border border-borderWarm dark:border-zinc-700 text-textMuted dark:text-zinc-400 hover:text-textMain'
                      }`}
                    >
                      25m
                    </button>
                    <button
                      type="button"
                      onClick={() => selectPreset(50)}
                      className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono rounded transition-colors ${
                        timerDuration === 50 * 60
                          ? 'bg-textMain dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium shadow-xs'
                          : 'bg-[#FAF9F5] dark:bg-zinc-800 border border-borderWarm dark:border-zinc-700 text-textMuted dark:text-zinc-400 hover:text-textMain'
                      }`}
                    >
                      50m
                    </button>
                    <button
                      type="button"
                      onClick={() => selectPreset(15)}
                      className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono rounded transition-colors ${
                        timerDuration === 15 * 60
                          ? 'bg-textMain dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium shadow-xs'
                          : 'bg-[#FAF9F5] dark:bg-zinc-800 border border-borderWarm dark:border-zinc-700 text-textMuted dark:text-zinc-400 hover:text-textMain'
                      }`}
                    >
                      15m
                    </button>
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      aria-label="Play/Pause Focus"
                      className="w-6 h-6 rounded-full bg-sage text-white flex items-center justify-center shadow-xs hover:scale-105 transition-transform ml-0.5 shrink-0 cursor-pointer"
                    >
                      {isTimerRunning ? (
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetTimer}
                      aria-label="Reset Timer"
                      className="w-6 h-6 rounded bg-[#FAF9F5] dark:bg-zinc-800 border border-borderWarm dark:border-zinc-700 text-textMuted hover:text-textMain dark:hover:text-zinc-100 text-[10px] font-mono flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                    >
                      ↻
                    </button>
                  </div>
                </div>
              </div>

              {/* ITEM 2: Daily Progress */}
              <div className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex flex-col justify-between min-w-0 h-full min-h-[110px]">
                <div className="flex items-center justify-between text-[11px] text-textMuted dark:text-zinc-400 font-mono">
                  <span className="uppercase truncate">Daily Progress</span>
                  <span className="font-semibold text-textMain dark:text-zinc-100 shrink-0 ml-1">{dailyProgressPercent}%</span>
                </div>
                <div className="my-auto py-1">
                  <span className="text-xl sm:text-2xl font-mono font-bold text-textMain dark:text-zinc-100 tabular-nums">
                    {completedBlocks}
                  </span>
                  <span className="text-xs font-mono text-textMuted dark:text-zinc-400"> / {totalBlocks}</span>
                </div>
                <div className="w-full bg-[#EAE7DF] dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-sage h-1 rounded-full transition-all duration-300"
                    style={{ width: `${dailyProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* ITEM 3: Habit Streak */}
              <div className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex flex-col justify-between min-w-0 h-full min-h-[110px]">
                <div className="flex items-center justify-between text-[11px] text-textMuted dark:text-zinc-400 font-mono">
                  <span className="uppercase truncate">Habit Streak</span>
                  <span className="text-textMuted dark:text-zinc-400 font-semibold shrink-0 ml-1">{streakDays > 0 ? `${streakDays}D` : '0D'}</span>
                </div>
                <div className="my-auto py-1">
                  <span className="text-xl sm:text-2xl font-mono font-bold text-textMain dark:text-zinc-100 tabular-nums">{consistencyPercent}%</span>
                </div>
                <div className="w-full bg-[#EAE7DF] dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      consistencyPercent > 0 ? 'bg-sage' : 'bg-stone-400 dark:bg-zinc-600'
                    }`}
                    style={{ width: `${consistencyPercent}%` }}
                  />
                </div>
              </div>

              {/* ITEM 4: TIME FOCUSED */}
              <div className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex flex-col justify-between min-w-0 h-full min-h-[110px]">
                <div className="flex items-center justify-between text-[11px] text-textMuted dark:text-zinc-400 font-mono">
                  <span className="uppercase truncate">TIME FOCUSED</span>
                  <span className="w-2 h-2 rounded-full bg-sage animate-pulse shrink-0 ml-1" />
                </div>
                <div className="my-auto py-1 flex items-baseline gap-1 truncate">
                  <span className="text-xl sm:text-2xl font-mono font-bold text-textMain dark:text-zinc-100 tabular-nums">3h 45m</span>
                  <span className="text-xs font-mono text-textMuted dark:text-zinc-400 shrink-0">/ 5h</span>
                </div>
                <div className="w-full bg-[#EAE7DF] dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                  <div className="bg-sage h-1 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              {/* ITEM 5: Pocket Ledger */}
              <div className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex flex-col justify-between min-w-0 h-full min-h-[110px]">
                <div className="flex items-center justify-between text-[11px] text-textMuted dark:text-zinc-400 font-mono">
                  <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100 truncate">Pocket Ledger</span>
                  <span className="text-[10px] font-mono text-textMuted dark:text-zinc-400 bg-[#FAF9F5] dark:bg-zinc-900 px-2 py-0.5 rounded border border-borderWarm dark:border-zinc-800 shrink-0 ml-1">
                    {dateFormatted.split(' ')[1] || 'Nov'}
                  </span>
                </div>
                <div className="my-auto py-1">
                  <div className="flex items-baseline gap-1 truncate">
                    <span className="text-lg sm:text-xl font-mono font-bold text-textMain dark:text-zinc-100 tabular-nums truncate">
                      ₹{remainingAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] font-mono text-textMuted dark:text-zinc-400 shrink-0">
                      / ₹{monthlyAllowance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#EAE7DF] dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amberWarm h-1.5 rounded-full transition-all duration-300" style={{ width: `${allowancePercent}%` }} />
                </div>
              </div>
            </div>
          </section>

          {/* ROW 2 & 3: Bento Matrix (Expenses, Submissions, Habits, Projects & Ideas) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0" data-purpose="2x2-bento-matrix">
            {/* CARD 1: Expense Matrix */}
            <article
              className="bg-ivory dark:bg-zinc-950/40 border border-borderWarm dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs overflow-hidden min-w-0"
              data-purpose="pocket-money-card"
            >
              <div className="flex items-center justify-between shrink-0 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">Expenses</span>
                  <span className="text-[10px] font-mono text-textMuted dark:text-zinc-400 bg-[#FAF9F5] dark:bg-zinc-900 px-2 py-0.5 rounded border border-borderWarm dark:border-zinc-800">
                    7D
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-textMain dark:text-zinc-100">
                  ₹{todaySpent.toFixed(2)}
                </span>
              </div>

              {/* 7-Day Outflow Bars */}
              <div className="relative flex-1 w-full bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 rounded-xl p-3.5 my-2 flex flex-col justify-end min-h-[148px]">
                <div className="w-full flex-1 flex items-end justify-between px-3 gap-2.5 pb-2">
                  {weeklyDays.length > 0 && maxSpend > 0 ? (
                    weeklyDays.map((d, idx) => {
                      const h = Math.max(6, Math.round((d.spent / maxSpend) * 85));
                      const isToday = d.isToday || idx === weeklyDays.length - 1;
                      return (
                        <div
                          key={idx}
                          title={`${d.dayLabel}: ₹${d.spent}`}
                          className={`flex-1 rounded-t transition-colors ${
                            isToday ? 'bg-sage' : 'bg-[#E5E2D9] dark:bg-zinc-700 hover:bg-stone-400'
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      );
                    })
                  ) : (
                    <>
                      <div className="flex-1 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '8%' }} />
                      <div className="flex-1 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '12%' }} />
                      <div className="flex-1 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '6%' }} />
                      <div className="flex-1 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '15%' }} />
                      <div className="flex-1 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '10%' }} />
                      <div className="flex-1 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '8%' }} />
                      <div className="flex-1 bg-sage rounded-t" style={{ height: '22%' }} />
                    </>
                  )}
                </div>
                <div className="w-full flex justify-between px-2 pt-2 border-t border-borderSubtle dark:border-zinc-800 text-[10px] font-mono text-textSubtle dark:text-zinc-500 shrink-0">
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Today</span>
                </div>
              </div>

              {/* Bottom Category Spend Buttons */}
              <div className="flex flex-col gap-1.5 shrink-0 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => openQuickCapture('Expense Books: ')}
                    aria-label="Configure Books category slot"
                    className="px-2 py-1.5 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 hover:bg-[#F2EFE8] dark:hover:bg-zinc-800 border border-borderWarm dark:border-zinc-800 hover:border-stone-400 flex items-center justify-between text-[11px] font-mono group transition-all text-left shadow-xs cursor-pointer min-w-0"
                  >
                    <span className="text-textMuted dark:text-zinc-400 group-hover:text-textMain dark:group-hover:text-zinc-100 flex items-center gap-1 min-w-0">
                      <span className="truncate">Books</span>
                      <svg className="w-2.5 h-2.5 text-textSubtle group-hover:text-textMain shrink-0 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="font-semibold text-textMain dark:text-zinc-100 shrink-0 ml-1">₹{booksSpend}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openQuickCapture('Expense Cafe: ')}
                    aria-label="Configure Cafe category slot"
                    className="px-2 py-1.5 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 hover:bg-[#F2EFE8] dark:hover:bg-zinc-800 border border-borderWarm dark:border-zinc-800 hover:border-stone-400 flex items-center justify-between text-[11px] font-mono group transition-all text-left shadow-xs cursor-pointer min-w-0"
                  >
                    <span className="text-textMuted dark:text-zinc-400 group-hover:text-textMain dark:group-hover:text-zinc-100 flex items-center gap-1 min-w-0">
                      <span className="truncate">Cafe</span>
                      <svg className="w-2.5 h-2.5 text-textSubtle group-hover:text-textMain shrink-0 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="font-semibold text-textMain dark:text-zinc-100 shrink-0 ml-1">₹{cafeSpend}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openQuickCapture('Expense Transit: ')}
                    aria-label="Configure Transit category slot"
                    className="px-2 py-1.5 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 hover:bg-[#F2EFE8] dark:hover:bg-zinc-800 border border-borderWarm dark:border-zinc-800 hover:border-stone-400 flex items-center justify-between text-[11px] font-mono group transition-all text-left shadow-xs cursor-pointer min-w-0"
                  >
                    <span className="text-textMuted dark:text-zinc-400 group-hover:text-textMain dark:group-hover:text-zinc-100 flex items-center gap-1 min-w-0">
                      <span className="truncate">Transit</span>
                      <svg className="w-2.5 h-2.5 text-textSubtle group-hover:text-textMain shrink-0 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="font-semibold text-textMain dark:text-zinc-100 shrink-0 ml-1">₹{transitSpend}</span>
                  </button>
                </div>
              </div>
            </article>

            {/* CARD 2: Upcoming Submissions */}
            <article
              className="bg-ivory dark:bg-zinc-950/40 border border-borderWarm dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs overflow-hidden min-w-0"
              data-purpose="submissions-card"
            >
              <div className="flex items-center justify-between shrink-0 mb-2">
                <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">
                  Upcoming Submissions
                </span>
                <span className="text-[10px] font-mono text-textMuted dark:text-zinc-400 bg-[#FAF9F5] dark:bg-zinc-900 px-2 py-0.5 rounded border border-borderWarm dark:border-zinc-800">
                  Queue
                </span>
              </div>

              {displayAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-borderWarm dark:border-zinc-800 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 my-auto">
                  <p className="text-xs font-mono font-medium text-textSubtle dark:text-zinc-400">No pending submissions</p>
                </div>
              ) : (
                <div className="space-y-2.5 my-auto py-2">
                  {displayAssignments.map((assignment) => {
                    const subjectCode = (assignment.subject || 'CS').slice(0, 2).toUpperCase();
                    const isCritical = assignment.status === 'submission_pending';
                    const isDraft = assignment.status === 'not_started';
                    return (
                      <div
                        key={assignment.id}
                        className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex items-center justify-between hover:border-stone-400 dark:hover:border-zinc-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                              isCritical
                                ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                                : isDraft
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {subjectCode}
                          </span>
                          <div>
                            <h2 className="text-xs font-semibold text-textMain dark:text-zinc-100">{assignment.title}</h2>
                            <span className="text-[10px] font-mono text-textMuted dark:text-zinc-400">
                              {assignment.due_date ? `Due ${assignment.due_date}` : 'No due date'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-medium ${
                            isCritical
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                              : isDraft
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                          }`}
                        >
                          {isCritical ? 'Critical' : isDraft ? 'Drafted' : 'In Progress'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-borderSubtle dark:border-zinc-800 text-[11px] font-mono text-textMuted dark:text-zinc-400 shrink-0">
                <Link href="/assignments" className="hover:text-textMain dark:hover:text-zinc-100 underline font-medium">
                  View LMS →
                </Link>
              </div>
            </article>

            {/* CARD 3: Habits Matrix */}
            <article
              className="bg-ivory dark:bg-zinc-950/40 border border-borderWarm dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs overflow-hidden min-w-0"
              data-purpose="habits-card"
            >
              <div className="flex items-center justify-between shrink-0 mb-2">
                <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">Habits Matrix</span>
                <Link
                  href="/habits"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF9F5] dark:bg-zinc-900 hover:bg-[#F2EFE8] dark:hover:bg-zinc-800 border border-borderWarm dark:border-zinc-800 hover:border-stone-400 text-textMain dark:text-zinc-100 text-[11px] font-mono font-medium shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <svg className="w-3 h-3 text-textMuted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Add Habit</span>
                </Link>
              </div>

              {localHabits.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-borderWarm dark:border-zinc-800 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 my-auto">
                  <p className="text-xs font-mono font-medium text-textSubtle dark:text-zinc-400">No habits recorded</p>
                </div>
              ) : (
                <div className="my-auto space-y-3 py-1">
                  {localHabits.slice(0, 2).map((habit) => (
                    <div key={habit.id} className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-textMain dark:text-zinc-100 truncate">{habit.title}</span>
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
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
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
                                  ? 'bg-sage text-white font-medium hover:opacity-90'
                                  : isSunday
                                  ? 'bg-amber-400 text-white font-bold hover:bg-amber-500'
                                  : 'bg-[#E5E2D9] dark:bg-zinc-700 text-textMuted dark:text-zinc-400 hover:bg-stone-300'
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
            </article>

            {/* CARD 4: Active Projects & Ideas Split */}
            <article
              className="bg-ivory dark:bg-zinc-950/40 border border-borderWarm dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs overflow-hidden min-w-0"
              data-purpose="projects-ideas-card"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
                {/* Active Projects */}
                <div className="flex flex-col justify-between pr-0 sm:pr-3 border-b sm:border-b-0 sm:border-r border-borderWarm dark:border-zinc-800 pb-3 sm:pb-0 h-full min-w-0">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">Projects</span>
                      <span className="text-[10px] font-mono text-textMuted dark:text-zinc-400">{activeProjects.length} active</span>
                    </div>
                    {displayProjects.length === 0 ? (
                      <div className="p-4 text-center border border-dashed border-borderWarm dark:border-zinc-800 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 my-auto">
                        <p className="text-xs font-mono font-medium text-textSubtle dark:text-zinc-400">No active projects</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {displayProjects.map((project) => (
                          <div key={project.id}>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="font-medium text-textMain dark:text-zinc-200 truncate">{project.title}</span>
                              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold shrink-0 ml-1">
                                {project.completion_percentage || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-[#EAE7DF] dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-sage h-1.5 rounded-full"
                                style={{ width: `${project.completion_percentage || 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link
                    href="/projects"
                    className="w-full py-1.5 bg-[#FAF9F5] dark:bg-zinc-900 hover:bg-[#F2EFE8] dark:hover:bg-zinc-800 border border-borderWarm dark:border-zinc-800 text-textMain dark:text-zinc-100 rounded-lg text-[11px] font-mono font-medium transition-colors mt-2 text-center block"
                  >
                    Sprint Board →
                  </Link>
                </div>

                {/* Ideas Vault */}
                <div className="flex flex-col justify-between pl-0 sm:pl-1 pt-2 sm:pt-0 h-full min-w-0">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">Ideas</span>
                      <span className={`w-2 h-2 rounded-full ${recentIdeas.length > 0 ? 'bg-amberWarm' : 'bg-stone-400 dark:bg-zinc-600'}`} />
                    </div>
                    {recentIdeas.length === 0 ? (
                      <div className="p-4 text-center border border-dashed border-borderWarm dark:border-zinc-800 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 my-auto">
                        <p className="text-xs font-mono font-medium text-textSubtle dark:text-zinc-400">No ideas recorded</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentIdeas.map((note) => (
                          <div
                            key={note.id}
                            onClick={() => openQuickCapture(`Idea: ${note.title}`)}
                            className="p-2 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 hover:border-stone-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
                          >
                            <span className="text-[9px] font-mono uppercase text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              {note.project?.title || 'Idea'}
                            </span>
                            <h3 className="text-xs font-semibold text-textMain dark:text-zinc-100 mt-1 truncate">{note.title}</h3>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openQuickCapture('Idea: ')}
                    className="w-full py-1.5 bg-textMain dark:bg-zinc-100 hover:bg-neutral-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-[11px] font-mono font-medium transition-colors mt-2 cursor-pointer"
                  >
                    + New Idea
                  </button>
                </div>
              </div>
            </article>
          </section>
        </main>
        {/* END: Main Dashboard Canvas */}
      </div>
      {/* END: MasterGlassFrame */}
    </div>
  );
}
