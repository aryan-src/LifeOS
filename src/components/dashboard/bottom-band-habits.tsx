import React from 'react';
import type { HabitWithLog } from '@/lib/actions/habits';
import { HabitsSummaryTable } from '@/components/habits/habits-summary-table';

interface BottomBandHabitsProps {
  initialHabits: HabitWithLog[];
  todayStr: string;
  className?: string;
}

export function BottomBandHabits({
  initialHabits,
  todayStr,
  className = '',
}: BottomBandHabitsProps) {
  return (
    <HabitsSummaryTable
      initialHabits={initialHabits}
      todayStr={todayStr}
      className={`h-full ${className}`}
    />
  );
}
