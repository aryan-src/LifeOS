'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle2, Calendar } from 'lucide-react';

interface Timeblock {
  id: string;
  title: string;
  timeRange: string;
  statusText: string;
  state: 'completed' | 'in_progress' | 'scheduled';
  durationMinutes: number;
}

const DEFAULT_TIMEBLOCKS: Timeblock[] = [
  {
    id: 'tb-1',
    title: 'Architecture Review',
    timeRange: '09:00 - 10:30 AM',
    statusText: 'Completed · 90m deep focus',
    state: 'completed',
    durationMinutes: 90,
  },
  {
    id: 'tb-2',
    title: 'Deep Work: System Design',
    timeRange: '11:00 AM - 1:00 PM',
    statusText: 'Current active block · In Progress',
    state: 'in_progress',
    durationMinutes: 120,
  },
  {
    id: 'tb-3',
    title: 'Team Sync & Daily Drill',
    timeRange: '02:30 - 03:30 PM',
    statusText: 'Scheduled · Google Meet',
    state: 'scheduled',
    durationMinutes: 60,
  },
];

export function HourlyTimeblocks() {
  const [blocks, setBlocks] = useState<Timeblock[]>(DEFAULT_TIMEBLOCKS);

  const toggleBlockState = (id: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== id) return block;
        if (block.state === 'completed') {
          return {
            ...block,
            state: 'in_progress',
            statusText: 'Current active block · In Progress',
          };
        }
        if (block.state === 'in_progress') {
          return {
            ...block,
            state: 'scheduled',
            statusText: 'Scheduled focus window',
          };
        }
        return {
          ...block,
          state: 'completed',
          statusText: `Completed · ${block.durationMinutes}m focus`,
        };
      })
    );
  };

  const totalHours = (
    blocks.reduce((acc, b) => acc + b.durationMinutes, 0) / 60
  ).toFixed(1);

  return (
    <div className="bg-white dark:bg-zinc-900/70 rounded-2xl p-4 border border-stone-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-stone-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5 font-semibold text-stone-800 dark:text-stone-200">
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Hourly Timeblocks
        </span>
        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
          {totalHours}h Scheduled
        </span>
      </div>

      {/* Block List */}
      <div className="flex flex-col gap-2">
        {blocks.map((block) => {
          if (block.state === 'in_progress') {
            return (
              <div
                key={block.id}
                onClick={() => toggleBlockState(block.id)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-900 text-white dark:bg-zinc-800 dark:text-zinc-100 shadow-xs cursor-pointer select-none transition-all hover:opacity-95"
              >
                <div className="w-1.5 h-8 rounded-full bg-emerald-400 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">
                      {block.title}
                    </span>
                    <span className="font-mono text-[10px] text-stone-300 dark:text-zinc-400">
                      {block.timeRange}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-300 dark:text-zinc-400 truncate">
                    {block.statusText}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
            );
          }

          if (block.state === 'completed') {
            return (
              <div
                key={block.id}
                onClick={() => toggleBlockState(block.id)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50/80 dark:bg-zinc-800/40 border border-stone-200/40 dark:border-zinc-800/60 hover:bg-stone-100/70 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer select-none"
              >
                <div className="w-1.5 h-8 rounded-full bg-emerald-500/80 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-900 dark:text-zinc-100 font-semibold truncate">
                      {block.title}
                    </span>
                    <span className="font-mono text-[10px] text-stone-400 dark:text-zinc-500">
                      {block.timeRange}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                    {block.statusText}
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
            );
          }

          // Scheduled
          return (
            <div
              key={block.id}
              onClick={() => toggleBlockState(block.id)}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50/80 dark:bg-zinc-800/40 border border-stone-200/40 dark:border-zinc-800/60 hover:bg-stone-100/70 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer select-none"
            >
              <div className="w-1.5 h-8 rounded-full bg-sky-500/70 shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-900 dark:text-zinc-100 font-semibold truncate">
                    {block.title}
                  </span>
                  <span className="font-mono text-[10px] text-stone-400 dark:text-zinc-500">
                    {block.timeRange}
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                  {block.statusText}
                </span>
              </div>
              <Calendar className="w-4 h-4 text-stone-400 dark:text-zinc-500 shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
