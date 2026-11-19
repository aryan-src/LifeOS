'use client';

import React, { useState, useEffect, useOptimistic, useTransition, useMemo } from 'react';
import type { HabitWithLog, WeeklyHabitStat } from '@/lib/actions/habits';
import {
  toggleHabitLog,
  createHabit,
  deleteHabit,
} from '@/lib/actions/habits';
import { WeeklyHabitChart } from './weekly-habit-chart';
import { HabitSummaryCards } from './habit-summary-cards';
import { ConsistencyMapCard } from './consistency-map-card';
import { StreakRecordsCard } from './streak-records-card';
import { computeHabitSummary } from '@/lib/habits/derived';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { ProgressBar } from '@/components/ui/progress-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import {
  Check,
  Plus,
  Trash2,
  Flame,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2,
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

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function HabitTrackerClient({
  initialHabits,
  initialWeeklyStats,
  initialError,
  isSchemaMissing = false,
}: HabitTrackerClientProps) {
  const todayStr = useMemo(() => getTodayDate(), []);
  const trailingDays = useMemo(() => getTrailingDays(7), []);

  const [habitsState, setHabitsState] = useState<HabitWithLog[]>(initialHabits);

  useEffect(() => {
    setHabitsState(initialHabits);
  }, [initialHabits]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);

  const [, startTransition] = useTransition();

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

  const derivedWeeklyStats: WeeklyHabitStat[] = useMemo(() => {
    const totalHabits = optimisticHabits.length;
    if (totalHabits === 0 && initialWeeklyStats.length > 0) {
      return initialWeeklyStats;
    }
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
  }, [optimisticHabits, trailingDays, initialWeeklyStats]);

  const summary = useMemo(
    () => computeHabitSummary(optimisticHabits, derivedWeeklyStats),
    [optimisticHabits, derivedWeeklyStats]
  );

  const handleToggleHabit = (habitId: string, date: string = todayStr) => {
    startTransition(async () => {
      dispatchOptimistic({ type: 'toggle', habitId, date });

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

      const res = await toggleHabitLog(habitId, date);
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    });
  };

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
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 pb-12">
      {/* Schema Missing Alert Banner */}
      {isSchemaMissing && (
        <div className="flex items-start gap-3 rounded-2xl border border-on-tertiary-container/30 bg-tertiary-fixed/50 p-4 font-mono text-label-sm text-on-tertiary-fixed">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-on-tertiary-container" aria-hidden="true" />
          <div className="flex-1">
            <span className="font-semibold">Demo / Local Schema Mode: </span>
            The habit tracker is running with starter routines. To persist your routines to Supabase cloud, apply the migration in{' '}
            <code className="rounded bg-surface-container-lowest/70 px-1.5 py-0.5 text-[11px]">
              supabase/migrations/20261015000000_habits_and_logs.sql
            </code>.
          </div>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-error/30 bg-error-container px-4 py-3 font-mono text-label-sm text-on-error-container">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-3 font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Habits Page Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-outline-variant/40 pb-5 sm:flex-row sm:items-end">
        <h1 className="font-serif text-page-title font-normal tracking-tight text-on-surface">
          Habits
        </h1>

        <button
          type="button"
          onClick={() => setIsAddingOpen(true)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary px-4 font-sans text-body-sm font-medium text-on-secondary shadow-xs transition-opacity hover:opacity-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add habit</span>
        </button>
      </header>

      {/* 4-Card Summary Row */}
      <HabitSummaryCards summary={summary} />

      {/* Main Two-Column Layout (8 cols execution stream + 4 cols analytics & consistency) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Wide Habit Cards Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <h2 className="font-serif text-headline-sm font-semibold tracking-tight text-on-surface">
              Today
            </h2>
            <div className="flex items-center gap-2">
              {summary.todayPercent === 100 && summary.activeCount > 0 && (
                <Pill tone="secondary">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    All done
                  </span>
                </Pill>
              )}
              <span
                className="font-mono text-label-sm font-medium text-on-surface-variant"
                style={LINING_NUMS_STYLE}
              >
                {summary.completedTodayCount}/{summary.activeCount}
              </span>
            </div>
          </div>

          {optimisticHabits.length === 0 ? (
            <Card padding="lg" surface="lowest">
              <EmptyState
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="No habits configured yet."
                description="Build calm daily consistency for study blocks, reading, movement, or problem sets."
                action={
                  <button
                    type="button"
                    onClick={() => setIsAddingOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 font-sans text-body-sm font-medium text-on-secondary transition-opacity hover:opacity-95 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>Add your first habit</span>
                  </button>
                }
              />
            </Card>
          ) : (
            optimisticHabits.map((habit) => {
              const isDoneToday = habit.is_completed_today;

              return (
                <div
                  key={habit.id}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-xs transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5"
                  data-purpose="habit-execution-card"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleHabit(habit.id, todayStr)}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
                        isDoneToday
                          ? 'bg-secondary/15 text-secondary border border-secondary/30'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                      aria-label={`Toggle habit: ${habit.title}`}
                      aria-pressed={isDoneToday}
                      title={isDoneToday ? 'Mark as incomplete' : 'Mark as completed'}
                    >
                      {isDoneToday ? (
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Check className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>

                    <div className="flex min-w-0 flex-col space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`truncate font-sans text-body-md font-medium tracking-tight transition-colors ${
                            isDoneToday
                              ? 'text-outline line-through'
                              : 'text-on-surface'
                          }`}
                        >
                          {habit.title}
                        </span>
                        {habit.streak > 0 && (
                          <Pill tone="tertiary">
                            <span
                              className="inline-flex items-center gap-1 font-semibold"
                              style={LINING_NUMS_STYLE}
                            >
                              <Flame className="h-3 w-3 text-on-tertiary-container" aria-hidden="true" />
                              <span>{`${habit.streak}d streak`}</span>
                            </span>
                          </Pill>
                        )}
                      </div>
                      {habit.description && (
                        <p className="truncate font-sans text-body-sm text-on-surface-variant">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-5 pt-2 md:pt-0 border-t border-outline-variant/20 md:border-t-0 md:pt-0">
                    {/* M-S Day Dot Strip */}
                    <div className="flex items-center gap-1.5" aria-label="7-day completion history">
                      {trailingDays.map((d) => {
                        const completed = habit.weekly_history?.[d.date] || false;
                        return (
                          <div key={d.date} className="flex flex-col items-center gap-1">
                            <span
                              className={`font-mono text-[10px] ${
                                d.isToday
                                  ? 'font-semibold text-on-surface'
                                  : 'text-on-surface-variant'
                              }`}
                            >
                              {d.dayLabel.slice(0, 1)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleHabit(habit.id, d.date)}
                              aria-label={`${habit.title} ${d.dayLabel} (${d.date}): ${
                                completed ? 'Completed' : 'Missed'
                              }`}
                              className={`flex h-6 w-6 items-center justify-center rounded-md font-mono text-[10px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
                                completed
                                  ? 'bg-secondary text-on-secondary shadow-xs'
                                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
                              } ${d.isToday ? 'ring-2 ring-secondary/35' : ''}`}
                              title={`${d.dayLabel} (${d.date}): ${completed ? 'Completed' : 'Missed'} • Click to toggle`}
                            >
                              {completed ? (
                                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                              ) : (
                                '·'
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleHabit(habit.id, todayStr)}
                        className={`px-3.5 py-1.5 rounded-lg font-mono text-label-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                          isDoneToday
                            ? 'bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/20'
                            : 'bg-secondary text-on-secondary shadow-xs hover:opacity-90 active:scale-95'
                        }`}
                      >
                        {isDoneToday ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Done today</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Log</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="rounded-lg p-1.5 text-outline transition-colors hover:bg-error-container/60 hover:text-error cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
                        title="Delete habit"
                        aria-label={`Delete habit: ${habit.title}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Analytics & Consistency (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <ConsistencyMapCard habits={optimisticHabits} todayStr={todayStr} />
          <StreakRecordsCard habits={optimisticHabits} />
        </div>
      </div>

      {/* Add Habit Modal (with focus trap & Escape close) */}
      <Modal
        open={isAddingOpen}
        onClose={() => setIsAddingOpen(false)}
        title="Add New Habit"
        description="Add a daily habit you can check off in one tap."
      >
        <form onSubmit={handleCreateHabit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="habit-title-input"
              className="block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Habit title
            </label>
            <input
              id="habit-title-input"
              type="text"
              required
              placeholder="e.g. Read 20 Pages, Morning Walk"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3.5 py-2.5 font-sans text-body-sm text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="habit-desc-input"
              className="block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Trigger or note (optional)
            </label>
            <input
              id="habit-desc-input"
              type="text"
              placeholder="e.g. Right after morning coffee"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/60 bg-surface-container-low px-3.5 py-2.5 font-sans text-body-sm text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingOpen(false)}
              className="rounded-xl border border-outline-variant/60 px-4 py-2 font-sans text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newTitle.trim()}
              className="rounded-xl bg-secondary px-4 py-2 font-sans text-body-sm font-medium text-on-secondary shadow-xs transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Add Habit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
