import React from 'react';

export default function AssignmentsLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto flex flex-col gap-8 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-20 bg-stone-200 dark:bg-stone-800 rounded-md" />
          <div className="h-7 w-56 bg-stone-200 dark:bg-stone-800 rounded-lg" />
          <div className="h-4 w-96 bg-stone-100 dark:bg-stone-800/60 rounded" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-28 bg-stone-200 dark:bg-stone-800 rounded-xl" />
          <div className="h-8 w-32 bg-stone-200 dark:bg-stone-800 rounded-xl" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/40 p-4 flex flex-col justify-between"
          >
            <div className="h-3 w-24 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-6 w-16 bg-stone-300 dark:bg-stone-700 rounded" />
          </div>
        ))}
      </div>

      {/* Filter and Search Bar Skeleton */}
      <div className="h-12 bg-stone-100/60 dark:bg-stone-900/40 rounded-2xl border border-stone-200/70 dark:border-stone-800" />

      {/* Kanban Columns Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((col) => (
          <div
            key={col}
            className="rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/30 p-3 sm:p-3.5 min-h-[360px] flex flex-col gap-3"
          >
            <div className="flex justify-between items-center pb-3 border-b border-stone-200/60 dark:border-stone-800">
              <div className="h-4 w-24 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-4 w-6 bg-stone-200 dark:bg-stone-800 rounded-md" />
            </div>
            <div className="h-28 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800" />
            <div className="h-28 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
