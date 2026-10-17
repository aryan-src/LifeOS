'use client';

import React, { useState, useOptimistic, useTransition, useMemo } from 'react';
import type { HabitWithLog, WeeklyHabitStat } from '@/lib/actions/habits';
import {
  toggleHabitLog,
  createHabit,
  deleteHabit,
} from '@/lib/actions/habits';
import { WeeklyHabitChart } from './weekly-habit-chart';
import {
  Check,
  Plus,
  Trash2,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { getTodayDate, formatCalendarDate, getTrailingDays } from '@/lib/utils/date';

export interface HabitTrackerClientProps {
  initialHabits: HabitWithLog[];
  initialWeeklyStats: WeeklyHabitStat[];
  initialError?: string | null;
  isSchemaMissing?: boolean;
}

type OptimisticAction =
  | { type: 'toggle'; habitId: string; date: string }
  | { type: 'create'; habit: HabitWithLog }
  | { type: 'delete'; habitId: string };

export function HabitTrackerClient({
  initialHabits,
  initialWeeklyStats,
  initialError,
  isSchemaMissing = false,
}: HabitTrackerClientProps) {
  const todayStr = useMemo(() => getTodayDate(), []);
  const trailingDays = useMemo(() => getTrailingDays(7), []);

  const [habitsState, setHabitsState] = useState<HabitWithLog[]>(initialHabits);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);

  const [, startTransition] = useTransition();

  // Optimistic habits reducer for 0ms latency UI updates
  const [optimisticHabits, dispatchOptimistic] = useOptimistic(
    habitsState,
    (state: HabitWithLog[], action: OptimisticAction) => {
      switch (action.type) {
        case 'toggle':
          return state.map((habit) => {
            if (habit.id !== action.habitId) return habit;

            const currentVal = habit.weekly_history[action.date] ?? false;
            const nextVal = !currentVal;

            const nextHistory = {
              ...habit.weekly_history,
              [action.date]: nextVal,
            };

            const isToday = action.date === todayStr;
            const nextCompletedToday = isToday ? nextVal : habit.is_completed_today;

            // Recalculate streak optimistically
            let newStreak = habit.streak;
            if (isToday) {
              newStreak = nextVal ? habit.streak + 1 : Math.max(0, habit.streak - 1);
            }

            return {
              ...habit,
              is_completed_today: nextCompletedToday,
              streak: newStreak,
              weekly_history: nextHistory,
            };
          });

        case 'create':
          return [...state, action.habit];

        case 'delete':
          return state.filter((h) => h.id !== action.habitId);

        default:
          return state;
      }
    }
  );

  // Derive weekly statistics directly from optimistic habits for instant chart reaction
  const derivedWeeklyStats: WeeklyHabitStat[] = useMemo(() => {
    const totalHabits = optimisticHabits.length;
    return trailingDays.map((day) => {
      let completedCount = 0;
      if (totalHabits > 0) {
        for (const habit of optimisticHabits) {
          if (habit.weekly_history?.[day.date]) {
            completedCount++;
          }
        }
      }
      const completionRate =
        totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

      return {
        date: day.date,
        dayOfWeek: day.dayLabel,
        completedCount,
        totalHabits,
        completionRate,
        isToday: day.isToday,
      };
    });
  }, [optimisticHabits, trailingDays]);

  // Today's summary metrics
  const completedTodayCount = optimisticHabits.filter((h) => h.is_completed_today).length;
  const totalHabitsCount = optimisticHabits.length;
  const todayProgressPercent =
    totalHabitsCount > 0
      ? Math.round((completedTodayCount / totalHabitsCount) * 100)
      : 0;

  // 7-day average calculation
  const weeklyAvgPercent = useMemo(() => {
    if (derivedWeeklyStats.length === 0) return 0;
    const sum = derivedWeeklyStats.reduce((acc, curr) => acc + curr.completionRate, 0);
    return Math.round(sum / derivedWeeklyStats.length);
  }, [derivedWeeklyStats]);

  // Handle instant toggle habit
  const handleToggleHabit = (habitId: string, date: string = todayStr) => {
    startTransition(async () => {
      // 0ms instant UI update
      dispatchOptimistic({ type: 'toggle', habitId, date });

      // Update local base state
      setHabitsState((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          const currentVal = h.weekly_history[date] ?? false;
          const nextVal = !currentVal;
          const nextHistory = { ...h.weekly_history, [date]: nextVal };
          const isToday = date === todayStr;
          return {
            ...h,
            is_completed_today: isToday ? nextVal : h.is_completed_today,
            streak: isToday
              ? nextVal
                ? h.streak + 1
                : Math.max(0, h.streak - 1)
              : h.streak,
            weekly_history: nextHistory,
          };
        })
      );

      // Background server mutation
      const res = await toggleHabitLog(habitId, date);
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    });
  };

  // Handle create new habit
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const tempId = `temp-${Date.now()}`;
    const newHabit: HabitWithLog = {
      id: tempId,
      user_id: '',
      title,
      description: newDescription.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_completed_today: false,
      streak: 0,
      weekly_history: {},
    };

    startTransition(async () => {
      dispatchOptimistic({ type: 'create', habit: newHabit });
      setHabitsState((prev) => [...prev, newHabit]);

      const formData = new FormData();
      formData.set('title', title);
      if (newDescription.trim()) {
        formData.set('description', newDescription.trim());
      }

      const res = await createHabit(null, formData);
      setIsSubmitting(false);

      if (res.success && res.data) {
        const saved = res.data;
        setHabitsState((prev) =>
          prev.map((h) => (h.id === tempId ? { ...h, id: saved.id } : h))
        );
        setNewTitle('');
        setNewDescription('');
        setIsAddingOpen(false);
      } else if (!res.success) {
        setErrorMessage(res.error || 'Failed to create habit');
      }
    });
  };

  // Handle delete habit
  const handleDeleteHabit = (habitId: string) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return;

    startTransition(async () => {
      dispatchOptimistic({ type: 'delete', habitId });
      setHabitsState((prev) => prev.filter((h) => h.id !== habitId));

      const res = await deleteHabit(habitId);
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Schema Missing Alert Banner */}
      {isSchemaMissing && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs font-mono">
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <span className="font-semibold">Demo / Local Schema Mode: </span>
            The habit tracker is running with starter routines. To persist your routines to Supabase cloud, apply the migration in{' '}
            <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-[11px]">
              supabase/migrations/20261015000000_habits_and_logs.sql
            </code>.
          </div>
        </div>
      )}

      {/* Error message toast banner if server mutation fails */}
      {errorMessage && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-mono">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400 font-semibold cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-stone-500 dark:text-zinc-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Calendar className="size-3.5" />
            <span>{formatCalendarDate(todayStr, 'header')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-zinc-100">
            Habit Tracker
          </h1>
          <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
            Zero-latency daily routines and weekly consistency tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingOpen(!isAddingOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="size-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Inline Create Habit Drawer / Form */}
      {isAddingOpen && (
        <form
          onSubmit={handleCreateHabit}
          className="p-5 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-stone-600 dark:text-zinc-400 uppercase tracking-wider">
              Add New Habit Routine
            </span>
            <button
              type="button"
              onClick={() => setIsAddingOpen(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 text-xs font-mono cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Habit title (e.g. Read 20 Pages, Morning Walk)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Description or trigger (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting || !newTitle.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Habit'}
            </button>
          </div>
        </form>
      )}

      {/* TOP SECTION: Today's Progress Card */}
      <div className="rounded-3xl border border-stone-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Progress Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                Today&apos;s Progress
              </span>
              {todayProgressPercent === 100 && totalHabitsCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <Sparkles className="size-3" />
                  All Done!
                </span>
              )}
            </div>
            <p className="text-stone-500 dark:text-zinc-400 text-xs sm:text-sm mt-1">
              {totalHabitsCount === 0
                ? 'No habits created yet. Click "New Habit" to start your daily streaks.'
                : todayProgressPercent === 100
                ? 'Outstanding work! You completed all daily habits today.'
                : `${completedTodayCount} of ${totalHabitsCount} habits completed (${todayProgressPercent}%).`}
            </p>
          </div>

          <div className="flex items-baseline gap-1 font-mono shrink-0">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
              {todayProgressPercent}%
            </span>
            <span className="text-xs text-stone-400 dark:text-zinc-500">
              ({completedTodayCount}/{totalHabitsCount})
            </span>
          </div>
        </div>

        {/* Smooth Notion Cream Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#10B981] dark:bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${todayProgressPercent}%` }}
          />
        </div>

        {/* Interactive Habit Checklist */}
        <div className="divide-y divide-stone-100 dark:divide-zinc-800/60 pt-2">
          {optimisticHabits.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-stone-700 dark:text-zinc-300">No habits configured yet.</p>
              <p className="text-xs text-stone-500 max-w-sm">Build daily streaks for focus blocks, reading, workouts, or problem sets.</p>
              <button
                type="button"
                onClick={() => setIsAddingOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                + Add your first habit
              </button>
            </div>
          ) : (
            optimisticHabits.map((habit) => {
              const isDoneToday = habit.is_completed_today;

              return (
                <div
                  key={habit.id}
                  className="py-3.5 sm:py-4 flex items-center justify-between gap-3 group transition-colors"
                >
                  {/* Left: Tactile 0ms Toggle & Habit Metadata */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleHabit(habit.id, todayStr)}
                      className={`size-7 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0 ${
                        isDoneToday
                          ? 'bg-[#10B981] border-[#10B981] text-white shadow-xs'
                          : 'border-stone-300 dark:border-zinc-700 hover:border-[#10B981] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-transparent'
                      }`}
                      aria-label={`Toggle habit: ${habit.title}`}
                      title={isDoneToday ? 'Mark as incomplete' : 'Mark as completed'}
                    >
                      <Check className={`size-4 stroke-[3] transition-transform ${isDoneToday ? 'scale-100' : 'scale-50'}`} />
                    </button>

                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-sm sm:text-base font-medium tracking-tight truncate transition-colors ${
                          isDoneToday
                            ? 'line-through text-stone-400 dark:text-zinc-500'
                            : 'text-stone-900 dark:text-zinc-100'
                        }`}
                      >
                        {habit.title}
                      </span>
                      {habit.description && (
                        <span className="text-xs text-stone-500 dark:text-zinc-400 truncate">
                          {habit.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Streak & Trailing 7-Day Dot Matrix */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    {/* Streak Badge */}
                    {habit.streak > 0 && (
                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 font-mono text-xs font-semibold select-none"
                        title={`Current streak: ${habit.streak} consecutive days`}
                      >
                        <Flame className="size-3.5 text-amber-600 dark:text-amber-400 fill-amber-500" />
                        <span>{`${habit.streak}d`}</span>
                      </div>
                    )}

                    {/* Mini 7-Day Consistency Dot Matrix */}
                    <div className="hidden sm:flex items-center gap-1.5" title="7-Day completion history">
                      {trailingDays.map((d) => {
                        const completed = habit.weekly_history?.[d.date] || false;
                        return (
                          <button
                            key={d.date}
                            type="button"
                            onClick={() => handleToggleHabit(habit.id, d.date)}
                            className={`size-3.5 rounded-full transition-all cursor-pointer ${
                              completed
                                ? 'bg-[#10B981] dark:bg-emerald-400'
                                : 'bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700'
                            } ${d.isToday ? 'ring-2 ring-emerald-500/30' : ''}`}
                            title={`${d.dayLabel} (${d.date}): ${completed ? 'Completed' : 'Missed'} • Click to toggle`}
                          />
                        );
                      })}
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Delete habit"
                      aria-label="Delete habit"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Weekly Consistency (Recharts) */}
      <div className="rounded-3xl border border-stone-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
              Weekly Consistency
            </span>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-stone-900 dark:text-zinc-100 mt-0.5">
              7-Day Habit Completion Pattern
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 mt-1">
              Visualizing consistency across all active routines.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 font-mono text-xs shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-800">
              <span className="text-stone-400 dark:text-zinc-500 mr-1.5">7D Avg:</span>
              <span className="font-bold text-stone-900 dark:text-zinc-100">
                {weeklyAvgPercent}%
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 font-semibold">
              <span className="mr-1">Today:</span>
              <span>{completedTodayCount}/{totalHabitsCount}</span>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart Container (Explicit h-64 Tailwind height) */}
        <WeeklyHabitChart data={derivedWeeklyStats} />
      </div>
    </div>
  );
}
