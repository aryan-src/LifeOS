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
      <div className="min-w-[160px] rounded-xl border border-outline-variant/50 bg-surface-container-lowest/95 p-3 font-mono text-label-sm text-on-surface shadow-ambient backdrop-blur-md">
        <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-outline-variant/30 pb-1.5">
          <span className="font-semibold text-on-surface">
            {item.dayOfWeek} {item.isToday ? '(Today)' : ''}
          </span>
          <span className="text-[11px] text-on-surface-variant">{item.date}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-on-surface-variant">Completed:</span>
          <span className="font-semibold text-secondary">
            {item.completedCount} / {item.totalHabits}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-on-surface-variant">Rate:</span>
          <span className="font-semibold text-on-surface">{item.completionRate}%</span>
        </div>
      </div>
    );
  }
  return null;
}

export function WeeklyHabitChart({ data, className = '' }: WeeklyHabitChartProps) {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const maxHabits = Math.max(1, ...data.map((d) => d.totalHabits));

  if (!mounted) {
    return (
      <div
        className={`flex h-64 w-full items-end justify-between gap-3 rounded-2xl bg-surface-container-low/70 px-6 pb-6 pt-10 ${className}`}
      >
        {data.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`w-full max-w-[40px] rounded-t-md ${
                d.isToday
                  ? 'bg-secondary'
                  : d.completedCount > 0
                  ? 'bg-secondary/75'
                  : 'bg-surface-container-highest'
              }`}
              style={{
                height: `${Math.max(12, (d.completedCount / maxHabits) * 160)}px`,
              }}
            />
            <span className="font-mono text-[11px] text-on-surface-variant">
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
            stroke="rgb(var(--color-outline-variant) / 0.4)"
          />
          <XAxis
            dataKey="dayOfWeek"
            tickLine={false}
            axisLine={{ stroke: 'rgb(var(--color-outline-variant) / 0.5)' }}
            tick={{
              fontSize: 12,
              fill: 'rgb(var(--color-on-surface-variant))',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, maxHabits]}
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 11,
              fill: 'rgb(var(--color-outline))',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgb(var(--color-surface-container) / 0.5)' }}
          />
          <Bar dataKey="completedCount" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.date}`}
                fill={
                  entry.isToday
                    ? 'rgb(var(--color-secondary))'
                    : entry.completedCount > 0
                    ? 'rgb(var(--color-secondary) / 0.72)'
                    : 'rgb(var(--color-surface-container-highest))'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
