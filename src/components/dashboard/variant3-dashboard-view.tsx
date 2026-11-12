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

  const circumference = 264;
  const progress = timerDuration > 0 ? (timerDuration - timerLeft) / timerDuration : 0;
  const strokeDashoffset = Math.max(0, Math.min(264, circumference * (1 - progress)));

  // Angle in radians for indicator pulse circle: starts at top (-90 deg), rotates clockwise
  const angle = progress * 2 * Math.PI;
  const dotX = 50 + 42 * Math.cos(angle);
  const dotY = 50 + 42 * Math.sin(angle);

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
      className="w-full xl:w-[calc(100vw-3rem)] max-w-[1400px] xl:relative xl:left-1/2 xl:-translate-x-1/2 min-h-0 my-auto py-2 flex items-center justify-center font-sans antialiased selection:bg-amber-100"
      data-purpose="dashboard-stage"
    >
      {/* BEGIN: MasterGlassFrame */}
      <div
        className="w-full max-w-[1400px] min-h-[850px] lg:h-[920px] bg-[#FAF9F5] dark:bg-zinc-900/95 p-3.5 rounded-3xl border border-[#DCDAD4] dark:border-zinc-800 shadow-2xl flex flex-col md:flex-row gap-3.5 overflow-hidden transition-colors"
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
          className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto lg:overflow-hidden pr-0 lg:pr-1"
          data-purpose="dashboard-workspace"
        >
          {/* Top Greeting & Header Bar */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 px-1 py-0.5 gap-2">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-textMain dark:text-zinc-100">
                {greetingTime}, {displayName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-[#52443d] dark:text-[#f0e7e1] bg-[#f0e7e1] dark:bg-stone-800 border border-[#e2d8d2] dark:border-stone-700">
                {dayName}, {dateFormatted} • Week {weekNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-theme-switcher'))}
                aria-label="Customize Dashboard Widgets"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F3EC] dark:bg-zinc-800 hover:bg-[#FAF9F5] dark:hover:bg-zinc-700 border border-borderWarm dark:border-zinc-700 hover:border-stone-400 text-xs font-mono text-textMuted hover:text-textMain dark:hover:text-zinc-100 transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-textMuted" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
                <span>Customize</span>
              </button>

              <div className="relative hidden sm:block">
                <input
                  onClick={() => openQuickCapture()}
                  readOnly
                  className="w-52 pl-7 pr-3 py-1 text-xs rounded-full bg-[#F5F3EC] dark:bg-zinc-800 border-borderWarm dark:border-zinc-700 text-textMain dark:text-zinc-100 placeholder:text-textSubtle focus:ring-1 focus:ring-stone-400 focus:border-stone-400 cursor-pointer"
                  placeholder="Search commands (⌘K)..."
                  type="text"
                />
                <svg className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F1EB] dark:bg-zinc-800/80 border border-borderWarm dark:border-zinc-700 text-xs font-mono text-emerald-800 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
                Synced
              </span>
            </div>
          </header>

          {/* ROW 1: Wide Horizontal Focus Strip (Command Ribbon) */}
          <section
            className="min-h-[188px] shrink-0 bg-ivory dark:bg-zinc-950/40 border border-borderWarm dark:border-zinc-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-5 shadow-xs overflow-hidden"
            data-purpose="wide-focus-ribbon"
          >
            {/* Left: Zen Focus Engine with Dial */}
            <div className="flex items-center gap-4 shrink-0 pr-0 lg:pr-4 border-b lg:border-b-0 lg:border-r border-borderWarm dark:border-zinc-800 w-full lg:w-auto pb-3 lg:pb-0 justify-between lg:justify-start">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="none" r="42" stroke="#EAE7DF" strokeWidth="4.5" className="dark:stroke-zinc-800" />
                  <circle
                    cx="50"
                    cy="50"
                    fill="none"
                    r="42"
                    stroke="#10B981"
                    strokeDasharray="264"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    strokeWidth="4.5"
                    className="transition-all duration-500 ease-linear"
                  />
                  <circle className="animate-pulse" cx={dotX} cy={dotY} fill="#1F2937" r="3.5" />
                </svg>
                <div className="absolute inset-2.5 rounded-full bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 shadow-inner flex flex-col items-center justify-center">
                  <span className="text-sm font-mono font-bold text-textMain dark:text-zinc-100 tabular-nums">
                    {timerFormatted}
                  </span>
                  <span className="text-[8px] font-mono text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-tight">
                    {isTimerRunning ? 'Running' : 'Focus'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">
                    Zen Focus Timer
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isTimerRunning ? 'bg-sage animate-ping' : 'bg-sage'}`} />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => selectPreset(25)}
                    className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
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
                    className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
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
                    className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
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
                    className="w-6 h-6 rounded-full bg-sage text-white flex items-center justify-center shadow-xs hover:scale-105 transition-transform ml-1 cursor-pointer"
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
                    className="w-6 h-6 rounded bg-[#FAF9F5] dark:bg-zinc-800 border border-borderWarm dark:border-zinc-700 text-textMuted hover:text-textMain dark:hover:text-zinc-100 text-[11px] font-mono flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ↻
                  </button>
                </div>
              </div>
            </div>

            {/* Center: Live Telemetry Chips */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {/* Metric 1: Sprint Progress */}
              <div className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-textMuted dark:text-zinc-400 font-mono">
                  <span className="uppercase">Daily Progress</span>
                  <span className={`font-semibold ${dailyProgressPercent > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-textMuted'}`}>
                    {dailyProgressPercent}%
                  </span>
                </div>
                <div className="my-1">
                  <span className="text-xl font-mono font-bold text-textMain dark:text-zinc-100 tabular-nums">
                    {completedBlocks} / {totalBlocks}
                  </span>
                  <span className="text-[11px] text-textMuted dark:text-zinc-400 ml-1">blocks</span>
                </div>
                <div className="w-full bg-[#EAE7DF] dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                  <div className="bg-sage h-1 rounded-full transition-all duration-300" style={{ width: `${dailyProgressPercent}%` }} />
                </div>
              </div>

              {/* Metric 2: Academic Streak */}
              <div className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-textMuted dark:text-zinc-400 font-mono">
                  <span className="uppercase">Habit Streak</span>
                  <span className={streakDays > 0 ? 'text-amberWarm font-semibold' : 'text-textMuted'}>
                    {streakDays > 0 ? `🔥 ${streakDays}D` : '0D'}
                  </span>
                </div>
                <div className="my-1">
                  <span className="text-xl font-mono font-bold text-textMain dark:text-zinc-100 tabular-nums">
                    {consistencyPercent}%
                  </span>
                  <span className="text-[11px] text-textMuted dark:text-zinc-400 ml-1">consistency</span>
                </div>
              </div>

              {/* Metric 3: Shield State */}
              <div className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-textMuted dark:text-zinc-400 font-mono">
                  <span className="uppercase">Shield State</span>
                  <span className="w-2 h-2 rounded-full bg-sage" />
                </div>
                <div className="my-1 flex items-baseline gap-1">
                  <span className="text-base font-serif font-semibold text-textMain dark:text-zinc-100">Deep Work</span>
                </div>
              </div>
            </div>

            {/* Right: Pocket Money Quick Balance */}
            <div className="w-full lg:w-64 shrink-0 pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-borderWarm dark:border-zinc-800 flex flex-col justify-between h-full py-1 lg:py-0.5">
              <div className="flex items-center justify-between">
                <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">Pocket Money</span>
                <span className="text-[10px] font-mono text-textMuted dark:text-zinc-400 bg-[#FAF9F5] dark:bg-zinc-900 px-2 py-0.5 rounded border border-borderWarm dark:border-zinc-800">
                  Nov 2026
                </span>
              </div>
              <div className="my-auto py-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-mono font-bold text-textMain dark:text-zinc-100 tabular-nums">
                    ₹{remainingAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] font-mono text-textMuted dark:text-zinc-400">
                    / ₹{monthlyAllowance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <div className="w-full bg-[#EAE7DF] dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amberWarm h-1.5 rounded-full transition-all duration-300" style={{ width: `${allowancePercent}%` }} />
              </div>
            </div>
          </section>

          {/* ROW 2: Balanced 2x2 Bento Matrix */}
          <section
            className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-none md:grid-rows-2 gap-3 min-h-0"
            data-purpose="2x2-bento-matrix"
          >
            {/* CARD 1: Pocket Money 7-Day Expense Details & Category Spend */}
            <article
              className="bg-ivory dark:bg-zinc-950/40 border border-borderWarm dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs overflow-hidden"
              data-purpose="pocket-money-card"
            >
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">Expense</span>
                  <span className="text-[10px] font-mono text-textMuted dark:text-zinc-400 bg-[#FAF9F5] dark:bg-zinc-900 px-2 py-0.5 rounded border border-borderWarm dark:border-zinc-800">
                    Last 7 Days
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-textMuted dark:text-zinc-400">Spent today:</span>
                  <span className="font-bold text-textMain dark:text-zinc-100">₹{todaySpent.toFixed(2)}</span>
                </div>
              </div>

              {/* 7-Day Outflow Bars */}
              <div className="relative my-auto h-28 w-full bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 rounded-xl p-2.5 flex flex-col justify-end">
                <div className="w-full h-16 flex items-end justify-between px-3 gap-2">
                  {weeklyDays.length > 0 ? (
                    weeklyDays.map((d, idx) => {
                      const h = maxSpend > 0 ? Math.round((d.spent / maxSpend) * 85) : 0;
                      const isToday = d.isToday || idx === weeklyDays.length - 1;
                      return (
                        <div
                          key={idx}
                          title={`${d.dayLabel}: ₹${d.spent}`}
                          className={`w-8 rounded-t transition-colors ${
                            isToday
                              ? 'bg-emerald-300 dark:bg-emerald-500/50 hover:bg-emerald-400'
                              : d.spent > 300
                              ? 'bg-amberWarm/80 hover:bg-amberWarm'
                              : d.spent > 150
                              ? 'bg-sage hover:bg-emerald-600'
                              : 'bg-[#E5E2D9] dark:bg-zinc-700 hover:bg-stone-400'
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      );
                    })
                  ) : (
                    <>
                      <div className="w-8 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '0%' }} />
                      <div className="w-8 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '0%' }} />
                      <div className="w-8 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '0%' }} />
                      <div className="w-8 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '0%' }} />
                      <div className="w-8 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '0%' }} />
                      <div className="w-8 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '0%' }} />
                      <div className="w-8 bg-[#E5E2D9] dark:bg-zinc-700 rounded-t hover:bg-stone-400 transition-colors" style={{ height: '0%' }} />
                    </>
                  )}
                </div>
                <div className="w-full flex justify-between px-3 pt-1 border-t border-borderSubtle dark:border-zinc-800 text-[10px] font-mono text-textSubtle dark:text-zinc-500">
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Today</span>
                </div>
              </div>

              {/* Bottom Category Spend Pills */}
              <div className="grid grid-cols-3 gap-2 shrink-0">
                <div className="px-2.5 py-1 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-textMuted dark:text-zinc-400">Books</span>
                  <span className={`font-semibold ${booksSpend > 0 ? 'text-textMain dark:text-zinc-100' : 'text-textSubtle'}`}>
                    ₹{booksSpend}
                  </span>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-textMuted dark:text-zinc-400">Cafe</span>
                  <span className={`font-semibold ${cafeSpend > 0 ? 'text-textMain dark:text-zinc-100' : 'text-textSubtle'}`}>
                    ₹{cafeSpend}
                  </span>
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-textMuted dark:text-zinc-400">Transit</span>
                  <span className={`font-semibold ${transitSpend > 0 ? 'text-textMain dark:text-zinc-100' : 'text-textSubtle'}`}>
                    ₹{transitSpend}
                  </span>
                </div>
              </div>
            </article>

            {/* CARD 2: Upcoming Submissions Assignment Queue */}
            <article
              className="bg-ivory dark:bg-zinc-950/40 border border-borderWarm dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs overflow-hidden"
              data-purpose="submissions-card"
            >
              <div className="flex items-center justify-between shrink-0">
                <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">Upcoming Submissions</span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    pendingAssignments.length > 0
                      ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                      : 'text-textMuted bg-[#FAF9F5] dark:bg-zinc-900 border-borderWarm dark:border-zinc-800'
                  }`}
                >
                  {pendingAssignments.length} Pending
                </span>
              </div>

              {displayAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-borderWarm dark:border-zinc-800 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 my-auto">
                  <p className="text-xs font-semibold text-textMain dark:text-zinc-100">No pending submissions</p>
                  <p className="text-[11px] font-mono text-textSubtle dark:text-zinc-400 mt-1">All caught up!</p>
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

            {/* CARD 3: Habits 7-Day Tracker with Streak Counts */}
            <article
              className="bg-ivory dark:bg-zinc-950/40 border border-borderWarm dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs overflow-hidden"
              data-purpose="habits-card"
            >
              <div className="flex items-center justify-between shrink-0">
                <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">Habits Matrix</span>
              </div>

              {localHabits.length === 0 ? (
                <div className="space-y-3 my-auto">
                  <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-borderWarm dark:border-zinc-800 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900">
                    <p className="text-xs font-semibold text-textMain dark:text-zinc-100">No habits tracked yet</p>
                    <p className="text-[11px] font-mono text-textSubtle dark:text-zinc-400 mt-1">Click &apos;+ Add Habit&apos; to begin</p>
                  </div>
                </div>
              ) : (
                <div className="my-auto space-y-3 py-1">
                  {localHabits.slice(0, 2).map((habit) => (
                    <div key={habit.id} className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 border border-borderWarm dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-textMain dark:text-zinc-100">{habit.title}</span>
                        <span
                          className={`text-[11px] font-mono font-semibold ${
                            habit.is_completed_today
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {habit.is_completed_today ? 'Done Today ✓' : 'In Progress'}
                        </span>
                      </div>
                      {/* 7-day checkboxes */}
                      <div className="flex items-center justify-between gap-1.5">
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

              <div className="flex items-center justify-between pt-2 border-t border-borderSubtle dark:border-zinc-800 text-[11px] font-mono text-textMuted dark:text-zinc-400 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-theme-switcher'))}
                    aria-label="Customize Habits View"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#FAF9F5] dark:bg-zinc-900 hover:bg-[#F2EFE8] dark:hover:bg-zinc-800 border border-borderWarm dark:border-zinc-800 hover:border-stone-400 text-textMuted hover:text-textMain dark:hover:text-zinc-100 text-[11px] font-mono font-medium shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-3 h-3 text-textMuted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                    <span>Customize</span>
                  </button>
                  <Link
                    href="/habits"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF9F5] dark:bg-zinc-900 hover:bg-[#F2EFE8] dark:hover:bg-zinc-800 border border-borderWarm dark:border-zinc-800 hover:border-stone-400 text-textMain dark:text-zinc-100 text-[11px] font-mono font-medium shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-3 h-3 text-textMuted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Add Habit</span>
                  </Link>
                </div>
              </div>
            </article>

            {/* CARD 4: Active Projects & Recent Ideas Split Card */}
            <article
              className="bg-ivory dark:bg-zinc-950/40 border border-borderWarm dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs overflow-hidden"
              data-purpose="projects-ideas-card"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
                {/* Left Half: Active Projects */}
                <div className="flex flex-col justify-between pr-0 sm:pr-2 border-b sm:border-b-0 sm:border-r border-borderWarm dark:border-zinc-800 pb-3 sm:pb-0">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">Active Projects</span>
                        <span className="text-[10px] font-mono text-textMuted dark:text-zinc-400">{activeProjects.length} live</span>
                      </div>
                      {displayProjects.length === 0 ? (
                        <div className="p-4 text-center border border-dashed border-borderWarm dark:border-zinc-800 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 my-auto">
                          <p className="text-xs font-medium text-textSubtle dark:text-zinc-400">No active projects</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {displayProjects.map((project) => (
                            <div key={project.id}>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="font-medium text-textMain dark:text-zinc-200">{project.title}</span>
                                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
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
                      className="w-full py-1.5 bg-[#FAF9F5] dark:bg-zinc-900 hover:bg-[#F2EFE8] dark:hover:bg-zinc-800 border border-borderWarm dark:border-zinc-800 text-textMain dark:text-zinc-100 rounded-lg text-[11px] font-medium transition-colors mt-2 text-center block"
                    >
                      Sprint Board →
                    </Link>
                  </div>
                </div>

                {/* Right Half: Recent Ideas */}
                <div className="flex flex-col justify-between pl-0 sm:pl-1">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-serif text-sm font-semibold text-textMain dark:text-zinc-100">Recent Ideas</span>
                        <span className={`w-2 h-2 rounded-full ${recentIdeas.length > 0 ? 'bg-amberWarm' : 'bg-stone-400'}`} />
                      </div>
                      {recentIdeas.length === 0 ? (
                        <div className="p-4 text-center border border-dashed border-borderWarm dark:border-zinc-800 rounded-xl bg-[#FAF9F5] dark:bg-zinc-900 my-auto">
                          <p className="text-xs font-medium text-textSubtle dark:text-zinc-400">No ideas captured yet</p>
                          <p className="text-[10px] font-mono text-textSubtle dark:text-zinc-400 mt-1">Click &apos;+ New Idea&apos; to begin</p>
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
                      className="w-full py-1.5 bg-textMain dark:bg-zinc-100 hover:bg-neutral-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-[11px] font-medium transition-colors mt-2 cursor-pointer"
                    >
                      + New Idea
                    </button>
                  </div>
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
