'use client';

import React from 'react';
import { CheckCircle2, Flame, ListChecks, TrendingUp } from 'lucide-react';
import type { HabitSummaryMetrics } from '@/lib/habits/derived';
import { StatCard } from '@/components/ui/stat-card';

interface HabitSummaryCardsProps {
  summary: HabitSummaryMetrics;
}

export function HabitSummaryCards({ summary }: HabitSummaryCardsProps) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      data-purpose="habits-summary-row"
    >
      <StatCard
        label="Active habits"
        value={summary.activeCount}
        unit={summary.activeCount === 1 ? 'habit' : 'habits'}
        icon={<ListChecks className="h-4 w-4" />}
        sublabel={
          summary.activeCount === 0
            ? 'Add your first daily habit'
            : 'Tracked daily'
        }
      />

      <StatCard
        label="Today"
        value={`${summary.completedTodayCount}/${summary.activeCount}`}
        badge={
          summary.activeCount > 0
            ? {
                text: `${summary.todayPercent}%`,
                tone: summary.todayPercent === 100 ? 'secondary' : 'neutral',
              }
            : undefined
        }
        progress={{
          value: summary.todayPercent,
          tone: 'secondary',
          label: "Today's habit completion",
        }}
        icon={<CheckCircle2 className="h-4 w-4 text-secondary" />}
        sublabel={
          summary.activeCount === 0
            ? 'No check-ins scheduled'
            : summary.todayPercent === 100
            ? 'All completed'
            : `${summary.activeCount - summary.completedTodayCount} remaining`
        }
      />

      <StatCard
        label="Best streak"
        value={`${summary.bestStreak}D`}
        icon={<Flame className="h-4 w-4 text-on-tertiary-container" />}
        sublabel={
          summary.bestStreakHabitTitle ? (
            <span className="block truncate">{summary.bestStreakHabitTitle}</span>
          ) : (
            'Complete habits to build a streak'
          )
        }
      />

      <StatCard
        label="Weekly pace"
        value={`${summary.weeklyAvgPercent}%`}
        icon={<TrendingUp className="h-4 w-4 text-secondary" />}
        sublabel={
          summary.totalWeeklyOpportunities > 0
            ? `${summary.totalWeeklyCompletions} of ${summary.totalWeeklyOpportunities} check-ins`
            : 'No data yet'
        }
      />
    </div>
  );
}
