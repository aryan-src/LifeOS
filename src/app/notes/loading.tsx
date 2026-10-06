import React from 'react';
import { Shell } from '@/components/layout/shell';

export default function NotesLoading() {
  return (
    <Shell>
      <div className="w-full max-w-7xl mx-auto px-space-md sm:px-space-lg lg:px-margin py-space-xl flex flex-col gap-space-xl animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 bg-surface-container-high rounded" />
            <div className="h-8 w-56 bg-surface-container-high rounded-lg" />
            <div className="h-4 w-80 bg-surface-container-high rounded" />
          </div>
          <div className="h-10 w-44 bg-surface-container-high rounded-lg" />
        </div>

        {/* Scratchpad & Input Skeleton */}
        <div className="h-32 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-space-md" />

        {/* Notes Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-2xl p-space-md h-48 border border-outline-variant/30 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-surface-container-high rounded" />
                <div className="w-4 h-4 bg-surface-container-high rounded-full" />
              </div>
              <div className="h-16 bg-surface-container-low/40 rounded-lg" />
              <div className="flex justify-between items-center">
                <div className="h-4 w-16 bg-surface-container-high rounded" />
                <div className="h-4 w-20 bg-surface-container-high rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
