import React from 'react';

export function DashboardMetricsSkeleton() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-5 md:p-6 rounded-2xl border border-stone-200/90 dark:border-stone-800/80 bg-white dark:bg-stone-900/50 shadow-2xs h-36 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <div className="h-3 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-4 w-10 bg-stone-200 dark:bg-stone-800 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-32 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-3 w-40 bg-stone-200/70 dark:bg-stone-800/60 rounded" />
          </div>
          <div className="h-1.5 w-full bg-stone-200/70 dark:bg-stone-800/60 rounded-full" />
        </div>
      ))}
    </section>
  );
}
