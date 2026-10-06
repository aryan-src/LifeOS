import React from 'react';
import { Shell } from '@/components/layout/shell';

export default function ProjectsLoading() {
  return (
    <Shell>
      <div className="w-full animate-pulse flex flex-col gap-6">
        {/* Header & Tabs Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-space-lg pt-space-lg">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-56 bg-surface-container-high rounded-lg" />
            <div className="h-4 w-72 bg-surface-container-high rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-48 bg-surface-container-low rounded-lg" />
            <div className="h-9 w-28 bg-surface-container-high rounded-lg" />
          </div>
        </div>

        {/* 4 Metric Strips Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-container-high px-space-lg py-px">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container-lowest p-space-md h-24 flex flex-col justify-between">
              <div className="h-3 w-24 bg-surface-container-high rounded" />
              <div className="h-6 w-16 bg-surface-container-high rounded" />
            </div>
          ))}
        </div>

        {/* 4 Kanban Columns Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md px-space-lg pb-space-xl">
          {[1, 2, 3, 4].map((col) => (
            <div
              key={col}
              className="bg-surface-container-low/50 rounded-2xl p-space-md min-h-[480px] flex flex-col gap-3 border border-outline-variant/20"
            >
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <div className="h-4 w-24 bg-surface-container-high rounded" />
                <div className="h-5 w-8 bg-surface-container-high rounded-full" />
              </div>
              {[1, 2].map((card) => (
                <div
                  key={card}
                  className="bg-surface-container-lowest rounded-xl p-space-md h-36 border border-outline-variant/30 flex flex-col justify-between"
                >
                  <div className="h-4 w-32 bg-surface-container-high rounded" />
                  <div className="h-3 w-full bg-surface-container-high rounded" />
                  <div className="h-2 w-full bg-surface-container-high rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
