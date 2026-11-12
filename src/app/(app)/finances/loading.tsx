import React from 'react';

export default function FinancesLoading() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      <div className="w-full max-w-7xl mx-auto px-space-md sm:px-space-lg lg:px-margin py-space-xl flex flex-col gap-space-xl">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2 max-w-xl">
          <div className="h-4 w-48 bg-surface-container-high rounded" />
          <div className="h-8 w-64 bg-surface-container-high rounded-lg" />
          <div className="h-4 w-96 max-w-full bg-surface-container-high rounded" />
        </div>

        {/* Hero Card Skeleton */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/30 flex flex-col gap-space-lg">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <div className="h-3 w-36 bg-surface-container-high rounded" />
              <div className="h-10 w-48 bg-surface-container-high rounded-lg" />
            </div>
            <div className="h-8 w-36 bg-surface-container-high rounded-full" />
          </div>
          <div className="h-3 w-full bg-surface-container-high rounded-full" />
        </div>

        {/* 3 Metrics Tiles Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-space-md h-28 border border-outline-variant/30 flex flex-col justify-between">
              <div className="h-3 w-28 bg-surface-container-high rounded" />
              <div className="h-7 w-32 bg-surface-container-high rounded" />
            </div>
          ))}
        </div>

        {/* Ledger Table Skeleton */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-space-md min-h-[300px] flex flex-col gap-3">
          <div className="h-10 bg-surface-container-low rounded-lg" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-surface-container-low/40 rounded-lg flex items-center justify-between px-4">
              <div className="h-4 w-24 bg-surface-container-high rounded" />
              <div className="h-4 w-48 bg-surface-container-high rounded" />
              <div className="h-4 w-20 bg-surface-container-high rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
