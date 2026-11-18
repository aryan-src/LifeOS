import React from 'react';
import { Timer, Clock, Activity } from 'lucide-react';
import type { FocusHistorySummary } from '@/lib/daily-loop/focus-history-derived';
import { StatCard } from '@/components/ui/stat-card';

interface FocusHistoryStatsProps {
  summary: FocusHistorySummary;
}

export function FocusHistoryStats({ summary }: FocusHistoryStatsProps) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      data-purpose="focus-history-stats"
    >
      <StatCard
        label="Focused Today"
        value={summary.todayFormatted}
        badge={{
          text: `${summary.todayPercent}%`,
          tone: summary.todayPercent >= 100 ? 'secondary' : 'neutral',
        }}
        progress={{
          value: summary.todayPercent,
          tone: 'secondary',
          label: 'Daily focus goal',
        }}
        icon={<Timer className="h-4 w-4 text-secondary" />}
        sublabel={`Daily target: ${summary.todayGoalFormatted}`}
      />

      <StatCard
        label="Total Logged"
        value={summary.totalFormatted}
        badge={{
          text: `${summary.totalSessions} ${summary.totalSessions === 1 ? 'session' : 'sessions'}`,
          tone: 'neutral',
        }}
        icon={<Clock className="h-4 w-4 text-on-tertiary-container" />}
        sublabel={`${summary.qualifiedDaysThisWeek} of 7 qualified days this week`}
      />

      <StatCard
        label="Average Session"
        value={summary.averageSessionMinutes > 0 ? `${summary.averageSessionMinutes}` : '0'}
        unit="min"
        icon={<Activity className="h-4 w-4 text-on-surface-variant" />}
        sublabel={
          summary.totalSessions > 0
            ? 'Mean duration across logged focus blocks'
            : 'Complete a focus block to compute average'
        }
      />
    </div>
  );
}
