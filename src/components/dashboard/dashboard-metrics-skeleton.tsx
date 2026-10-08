import React from 'react';

export function DashboardMetricsSkeleton() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs h-36 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <div className="h-3 w-24 bg-surface-container-high rounded" />
            <div className="h-4 w-12 bg-surface-container-high rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-32 bg-surface-container-high rounded" />
            <div className="h-3 w-40 bg-surface-container-low rounded" />
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full" />
        </div>
      ))}
    </section>
  );
}
