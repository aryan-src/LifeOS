'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Plus } from 'lucide-react';
import type { HabitWithLog } from '@/lib/actions/habits';
import type { WeekStripDay } from '@/lib/actions/daily-loop';
import { formatStreakBadge } from '@/lib/daily-loop/business-logic';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { EmptyState } from '@/components/ui/empty-state';

interface DashboardHabitsCardProps {
  habits: HabitWithLog[];
  weekStrip: WeekStripDay[];
  onToggleHabitDay: (habitId: string, dateStr: string, isFuture: boolean) => void;
}

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

export function DashboardHabitsCard({
  habits,
  weekStrip,
  onToggleHabitDay,
}: DashboardHabitsCardProps) {
  return (
    <Card
      as="article"
      padding="md"
      surface="lowest"
      className="flex flex-1 flex-col justify-start min-w-0"
      data-purpose="habits-card"
    >
      <div className="mb-3 flex items-center justify-between border-b border-outline-variant/30 pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-secondary" aria-hidden="true" />
          <h2 className="font-sans text-headline-sm font-semibold tracking-tight text-on-surface">
            Habits
          </h2>
        </div>

        <Link
          href="/habits"
          className="inline-flex items-center gap-1 font-mono text-label-sm font-medium text-on-surface-variant transition-colors hover:text-secondary"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Add Habit</span>
        </Link>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          compact={true}
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="No habits tracked yet."
          description="Create daily protocols to build recurring momentum."
          action={
            <Link
              href="/habits"
              className="font-mono text-label-sm font-medium text-secondary hover:underline"
            >
              Create first habit →
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {habits.slice(0, 3).map((habit) => (
            <div
              key={habit.id}
              className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate font-sans text-body-sm font-medium text-on-surface">
                    {habit.title}
                  </span>
                  <Pill tone="tertiary">
                    {formatStreakBadge(habit.streak || 0)}
                  </Pill>
                </div>

                <span
                  className={`shrink-0 font-mono text-label-sm font-medium ${
                    habit.is_completed_today ? 'text-secondary' : 'text-on-tertiary-container'
                  }`}
                >
                  {habit.is_completed_today ? 'Done Today' : 'Pending'}
                </span>
              </div>

              {/* 7-day interactive habit strip */}
              <div className="grid grid-cols-7 gap-1">
                {weekStrip.map((day) => {
                  const isDone = day.isFuture
                    ? false
                    : day.isToday
                    ? habit.is_completed_today
                    : !!habit.weekly_history?.[day.date];

                  let btnClasses =
                    'bg-surface-container text-outline/50 border border-outline-variant/30 cursor-default';

                  if (!day.isFuture) {
                    if (isDone) {
                      btnClasses =
                        'bg-secondary text-on-secondary font-semibold hover:opacity-90 cursor-pointer';
                    } else if (day.isToday) {
                      btnClasses =
                        'border border-on-tertiary-container/50 bg-tertiary-fixed/50 text-on-tertiary-fixed font-semibold hover:bg-tertiary-fixed/80 cursor-pointer';
                    } else {
                      btnClasses =
                        'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container cursor-pointer';
                    }
                  }

                  const dayStatus = day.isFuture
                    ? 'Upcoming'
                    : isDone
                    ? 'Completed'
                    : 'Not done';

                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={day.isFuture}
                      onClick={() => onToggleHabitDay(habit.id, day.date, day.isFuture)}
                      className={`flex h-7 items-center justify-center rounded-lg font-mono text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${btnClasses}`}
                      style={LINING_NUMS_STYLE}
                      aria-label={`${habit.title} ${day.dayLabel}: ${dayStatus}`}
                      title={`${day.dayLabel}${day.date && !day.date.startsWith('fallback-') ? ` (${day.date})` : ''}: ${dayStatus}`}
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
    </Card>
  );
}
