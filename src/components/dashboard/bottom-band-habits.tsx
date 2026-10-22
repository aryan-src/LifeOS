'use client';

import React, { useTransition, useState } from 'react';
import Link from 'next/link';
import { toggleHabitLog, type HabitWithLog } from '@/lib/actions/habits';

interface BottomBandHabitsProps {
  initialHabits: HabitWithLog[];
  todayStr: string;
}

export function BottomBandHabits({
  initialHabits,
  todayStr,
}: BottomBandHabitsProps) {
  const [habits, setHabits] = useState<HabitWithLog[]>(initialHabits);
  const [, startTransition] = useTransition();

  // Day columns M T W T F S S
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const now = new Date();
  // Monday is day 0 (0-6)
  const currentDayIndex = (now.getDay() + 6) % 7;
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate consistency
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

    // Optimistic update
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
    <div className="w-full h-full min-w-0 flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-[17px] xl:text-[18px] font-bold text-[#07343C] dark:text-zinc-100">
          Habits ({habits.length} active)
        </h3>
        <span className="text-[11px] text-[#07343C]/60 dark:text-zinc-400 font-medium font-mono">
          This week · {consistencyPercent}% consistency
        </span>
      </div>

      <div className="space-y-1.5 my-auto">
        {/* Day header row */}
        <div className="flex items-center justify-between text-[10px] text-[#07343C]/60 dark:text-zinc-400 font-mono pl-24 sm:pl-28 pr-10 sm:pr-12">
          {dayLabels.map((lbl, idx) => (
            <span
              key={idx}
              className={`w-[11px] text-center ${
                idx === currentDayIndex
                  ? 'font-bold text-[#0B5563] dark:text-emerald-400'
                  : ''
              }`}
            >
              {lbl}
            </span>
          ))}
        </div>

        {displayHabits.length === 0 ? (
          <div className="text-[12px] text-[#07343C]/60 dark:text-zinc-400 py-3 text-center">
            No habits configured yet.{' '}
            <Link href="/habits" className="text-[#0B5563] dark:text-emerald-400 underline">
              Add one
            </Link>
          </div>
        ) : (
          displayHabits.map((habit) => (
            <div key={habit.id} className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-[#07343C] dark:text-zinc-100 truncate w-24 sm:w-28 text-[12px] sm:text-[13px]">
                {habit.title}
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const isCurrentDay = idx === currentDayIndex;
                  const isDone = isCurrentDay
                    ? habit.is_completed_today
                    : idx < currentDayIndex
                    ? idx % 2 === 0
                    : false;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!isCurrentDay}
                      onClick={() => isCurrentDay && handleToggleToday(habit)}
                      className={`w-[11px] h-[11px] rounded-full transition-all ${
                        isCurrentDay ? 'cursor-pointer hover:scale-125' : 'cursor-default'
                      } ${
                        isDone
                          ? 'bg-[#10B981]'
                          : 'bg-[#F3F0EA] dark:bg-zinc-800 border border-[#07343C]/10 dark:border-zinc-700'
                      } ${
                        isCurrentDay
                          ? 'ring-2 ring-[#10B981]/30 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900'
                          : ''
                      }`}
                      aria-label={`${habit.title} on day ${idx + 1}`}
                    />
                  );
                })}
              </div>
              <span className="text-[12px] sm:text-[13px] font-bold text-[#07343C] dark:text-zinc-100 ml-2 font-mono">
                🔥 {habit.streak}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="text-[11px] text-[#07343C]/60 dark:text-zinc-400 font-mono">
        {dayNames[currentDayIndex]} · day {currentDayIndex + 1} of the week
      </div>
    </div>
  );
}
