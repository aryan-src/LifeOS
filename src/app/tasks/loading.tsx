import React from 'react';

export default function TasksLoading() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="w-full px-space-lg lg:px-margin pt-space-lg pb-space-md">
        <div className="flex justify-between items-center mb-space-sm">
          <div className="h-4 w-40 bg-surface-container-high rounded" />
          <div className="h-4 w-32 bg-surface-container-high rounded" />
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 bg-surface-container-high rounded-lg" />
            <div className="h-4 w-72 bg-surface-container-high rounded" />
          </div>
          <div className="h-12 w-64 bg-surface-container-low rounded-lg" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="w-full px-space-lg lg:px-margin pb-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* Main Tasks Column (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            {/* Input bar skeleton */}
            <div className="h-28 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-space-md" />
            {/* Filter tabs skeleton */}
            <div className="h-10 w-64 bg-surface-container-low rounded-lg" />
            {/* Task rows skeleton */}
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-space-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-surface-container-high" />
                    <div className="h-4 w-48 bg-surface-container-high rounded" />
                  </div>
                  <div className="h-5 w-20 bg-surface-container-high rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Metrics (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="h-64 bg-surface-container-lowest rounded-xl border border-outline-variant/30" />
            <div className="h-48 bg-surface-container-lowest rounded-xl border border-outline-variant/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
