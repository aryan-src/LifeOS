'use client';

import React, { useTransition, useState } from 'react';
import Link from 'next/link';
import { toggleHabitLog, type HabitWithLog } from '@/lib/actions/habits';

interface HabitsSummaryTableProps {
  initialHabits: HabitWithLog[];
  todayStr: string;
  className?: string;
}

export function HabitsSummaryTable({
  initialHabits,
  todayStr,
  className = '',
}: HabitsSummaryTableProps) {
  const [habits, setHabits] = useState<HabitWithLog[]>(initialHabits);
  const [, startTransition] = useTransition();

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Monday is 0

  let totalLogs = 0;
  let completedLogs = 0;
  habits.forEach((h) => {
    Object.values(h.weekly_history || {}).forEach((isDone) => {
      totalLogs++;
      if (isDone) completedLogs++;
    });
  });
  const consistencyPercent = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 85;

  const handleToggleToday = (habit: HabitWithLog) => {
    const isCompleted = !habit.is_completed_today;
    const newStreak = isCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1);

    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              is_completed_today: isCompleted,
              streak: newStreak,
              weekly_history: {
                ...(h.weekly_history || {}),
                [todayStr]: isCompleted,
              },
            }
          : h
      )
    );

    startTransition(async () => {
      try {
        await toggleHabitLog(habit.id, todayStr);
      } catch (err) {
        console.error('Failed to toggle habit:', err);
      }
    });
  };

  const displayHabits = habits.slice(0, 3);

  return (
    <section
      className={`flex flex-col h-full overflow-hidden justify-between ${className}`}
      data-purpose="section-habits"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between pb-1.5 border-b border-stone-100 dark:border-zinc-800/60">
        <h2 className="text-base font-bold font-serif text-stone-900 dark:text-zinc-100 tracking-tight leading-none">
          Habits{' '}
          <span className="text-stone-400 dark:text-zinc-500 font-sans font-normal text-[11px]">
            ({habits.length} active)
          </span>
        </h2>
        <span className="text-[11px] font-sans text-stone-500 dark:text-zinc-400">
          This week · {consistencyPercent}%
        </span>
      </div>

      {/* Content Table */}
      <div className="flex-1 min-h-0 py-1 flex flex-col justify-center overflow-y-auto no-scrollbar gap-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 dark:text-zinc-500 pb-1 border-b border-stone-100/80 dark:border-zinc-800/60">
          <span className="w-24 text-[8.5px] uppercase tracking-wider">Habit</span>
          <div className="flex space-x-1.5 text-center">
            {dayLabels.map((lbl, idx) => (
              <span
                key={idx}
                className={`w-3.5 text-[8.5px] ${
                  idx === currentDayIndex
                    ? 'font-bold text-stone-900 dark:text-zinc-100 bg-stone-100 dark:bg-zinc-800 rounded'
                    : ''
                }`}
              >
                {lbl}
              </span>
            ))}
          </div>
          <span className="w-11 text-right text-[8.5px] uppercase tracking-wider">Streak</span>
        </div>

        <div className="space-y-1 pt-0.5">
          {displayHabits.length === 0 ? (
            <div className="text-[11px] text-stone-400 dark:text-zinc-500 py-3 text-center">
              No habits configured.{' '}
              <Link href="/habits" className="text-stone-700 dark:text-zinc-300 underline font-medium">
                Add habit
              </Link>
            </div>
          ) : (
            displayHabits.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between text-xs group">
                <span className="w-24 font-medium text-stone-700 dark:text-zinc-300 truncate text-[11px]">
                  {habit.title}
                </span>
                <div className="flex space-x-1.5">
                  {dayLabels.map((_, idx) => {
                    const isToday = idx === currentDayIndex;
                    const isDone = isToday
                      ? habit.is_completed_today
                      : idx < currentDayIndex;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!isToday}
                        onClick={() => isToday && handleToggleToday(habit)}
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] transition-all ${
                          isDone
                            ? isToday
                              ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-zinc-900 bg-emerald-500 text-white font-bold cursor-pointer'
                              : 'bg-emerald-500 text-white'
                            : isToday
                            ? 'ring-2 ring-stone-300 dark:ring-zinc-600 ring-offset-1 dark:ring-offset-zinc-900 bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 cursor-pointer'
                            : 'bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700'
                        }`}
                        title={isToday ? 'Click to toggle today' : undefined}
                      >
                        {isDone && '✓'}
                      </button>
                    );
                  })}
                </div>
                <span className="w-11 text-right font-mono font-medium text-stone-700 dark:text-zinc-300 text-[10px]">
                  🔥{habit.streak || 0}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto shrink-0 pt-1.5 border-t border-stone-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
        <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500">
          {dayNames[currentDayIndex]} · day {currentDayIndex + 1} of the week
        </span>
        <Link
          href="/habits"
          className="hover:text-stone-700 dark:hover:text-zinc-300 font-sans transition-colors text-[11px] font-medium text-stone-500 dark:text-zinc-400"
        >
          Manage habits →
        </Link>
      </div>
    </section>
  );
}
