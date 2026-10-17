import React from 'react';

export default function HabitsLoading() {
  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1720px] mx-auto">
      <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-stone-200 dark:bg-zinc-800 rounded" />
            <div className="h-8 w-48 bg-stone-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-4 w-72 bg-stone-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="h-9 w-28 bg-stone-200 dark:bg-zinc-800 rounded-xl" />
        </div>

        {/* Daily Progress & Streak Card Skeleton */}
        <div className="p-6 sm:p-7 rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-stone-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-64 bg-stone-200 dark:bg-zinc-800 rounded" />
            </div>
            <div className="h-8 w-20 bg-stone-200 dark:bg-zinc-800 rounded-lg" />
          </div>

          {/* Progress bar skeleton */}
          <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-zinc-800" />

          {/* Habit rows */}
          <div className="divide-y divide-stone-100 dark:divide-zinc-800/60 pt-2 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="pt-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="size-6 rounded-lg bg-stone-200 dark:bg-zinc-800 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-44 bg-stone-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-60 bg-stone-200 dark:bg-zinc-800/60 rounded" />
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <div key={d} className="size-7 rounded-lg bg-stone-100 dark:bg-zinc-800/50" />
                  ))}
                </div>
                <div className="h-6 w-16 bg-stone-200 dark:bg-zinc-800 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Stats Chart Skeleton */}
        <div className="p-6 sm:p-7 rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs space-y-4">
          <div className="h-5 w-48 bg-stone-200 dark:bg-zinc-800 rounded" />
          <div className="h-40 w-full bg-stone-100 dark:bg-zinc-800/40 rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
