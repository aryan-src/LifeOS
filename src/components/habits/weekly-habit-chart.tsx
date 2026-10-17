'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import type { WeeklyHabitStat } from '@/lib/actions/habits';

export interface WeeklyHabitChartProps {
  data: WeeklyHabitStat[];
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WeeklyHabitStat }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item: WeeklyHabitStat = payload[0].payload;
    return (
      <div className="rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-3 shadow-lg font-mono text-xs text-stone-800 dark:text-zinc-200 min-w-[160px]">
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-zinc-800 pb-1.5 mb-1.5">
          <span className="font-semibold text-stone-900 dark:text-zinc-100">
            {item.dayOfWeek} {item.isToday ? '(Today)' : ''}
          </span>
          <span className="text-[11px] text-stone-500 dark:text-zinc-400">
            {item.date}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-stone-500 dark:text-zinc-400">Completed:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {item.completedCount} / {item.totalHabits}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-stone-500 dark:text-zinc-400">Rate:</span>
          <span className="font-semibold text-stone-900 dark:text-zinc-100">
            {item.completionRate}%
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function WeeklyHabitChart({ data, className = '' }: WeeklyHabitChartProps) {
  const [mounted, setMounted] = useState<boolean>(false);

  // Prevent SSR hydration layout mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const maxHabits = Math.max(1, ...data.map((d) => d.totalHabits));

  if (!mounted) {
    return (
      <div
        className={`w-full h-64 flex items-end gap-3 justify-between px-6 pb-6 pt-10 rounded-2xl bg-stone-100/50 dark:bg-zinc-900/30 animate-pulse ${className}`}
      >
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full max-w-[40px] rounded-t-md bg-stone-200/80 dark:bg-zinc-800/80"
              style={{
                height: `${Math.max(15, (d.completedCount / maxHabits) * 160)}px`,
              }}
            />
            <span className="font-mono text-[11px] text-stone-400 dark:text-zinc-500">
              {d.dayOfWeek}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 12, left: -24, bottom: 4 }}
          barCategoryGap="24%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-stone-200/60 dark:stroke-zinc-800/60"
          />
          <XAxis
            dataKey="dayOfWeek"
            tickLine={false}
            axisLine={{ stroke: 'currentColor', className: 'text-stone-200 dark:text-zinc-800' }}
            tick={{
              fontSize: 12,
              fill: 'currentColor',
              fontFamily: 'monospace',
            }}
            className="text-stone-500 dark:text-zinc-400"
          />
          <YAxis
            allowDecimals={false}
            domain={[0, maxHabits]}
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 11,
              fill: 'currentColor',
              fontFamily: 'monospace',
            }}
            className="text-stone-400 dark:text-zinc-500"
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'currentColor', className: 'text-stone-200/30 dark:text-zinc-800/30' }}
          />
          <Bar
            dataKey="completedCount"
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.date}`}
                // Soft sage green accent (#10B981) with subtle emphasis for today
                fill={
                  entry.isToday
                    ? '#10B981'
                    : entry.completedCount > 0
                    ? '#059669'
                    : '#D1D5DB'
                }
                className={
                  entry.isToday
                    ? 'fill-[#10B981] dark:fill-emerald-400'
                    : entry.completedCount > 0
                    ? 'fill-[#059669] dark:fill-emerald-500/80'
                    : 'fill-stone-200 dark:fill-zinc-800'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
