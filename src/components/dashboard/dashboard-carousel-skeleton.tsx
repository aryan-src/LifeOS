import React from 'react';

export function DashboardCarouselSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 sm:gap-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-36 sm:h-40 rounded-2xl sm:rounded-3xl bg-stone-100 dark:bg-stone-900/40 border border-stone-200/50 dark:border-stone-800/50 p-4 sm:p-5 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-200/70 dark:bg-stone-800/70" />
              <div className="w-16 h-5 rounded-full bg-stone-200/70 dark:bg-stone-800/70" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-36 h-4.5 rounded bg-stone-200/70 dark:bg-stone-800/70" />
              <div className="w-48 h-3.5 rounded bg-stone-200/70 dark:bg-stone-800/70" />
              <div className="w-24 h-3 rounded bg-stone-200/50 dark:bg-stone-800/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
