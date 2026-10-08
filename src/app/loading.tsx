import React from 'react';
import { DashboardCarouselSkeleton } from '@/components/dashboard/dashboard-carousel-skeleton';

export default function RootLoading() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      <div className="px-4 sm:px-6 md:px-10 py-8 flex flex-col gap-8 max-w-[1360px] mx-auto w-full">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-48 bg-surface-container-high rounded" />
            <div className="h-8 w-64 bg-surface-container-high rounded-lg" />
            <div className="h-4 w-96 max-w-full bg-surface-container-high rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 bg-surface-container-high rounded-lg" />
            <div className="h-9 w-28 bg-surface-container-high rounded-lg" />
          </div>
        </div>

        {/* 4 Stat Cards Skeleton (Section root parity) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 md:p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest h-36 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-24 bg-surface-container-high rounded" />
                <div className="h-5 w-16 bg-surface-container-high rounded-full" />
              </div>
              <div className="h-7 w-32 bg-surface-container-high rounded" />
              <div className="h-2 w-full bg-surface-container-high rounded-full" />
            </div>
          ))}
        </section>

        {/* Main Workspace Interactive Carousel Skeleton (Section root parity) */}
        <section className="w-full">
          <DashboardCarouselSkeleton />
        </section>
      </div>
    </div>
  );
}
