import React, { Suspense } from 'react';
import {
  DashboardMetrics,
  DashboardMetricsSkeleton,
} from '@/components/dashboard/dashboard-metrics';
import {
  DashboardCarouselSection,
  DashboardCarouselSkeleton,
} from '@/components/dashboard/dashboard-carousel-section';
import { getUserProfile } from '@/lib/actions/profile';
import { formatDateIST } from '@/lib/utils/date';
import Link from 'next/link';

export async function DashboardCommandCenter() {
  const profile = await getUserProfile();

  return (
    <div className="flex flex-col w-full">
      <div className="px-4 sm:px-6 md:px-10 py-8 flex flex-col gap-8 max-w-[1360px] mx-auto w-full">
        {/* Header Section: Understated Notion Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 text-outline flex-wrap">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
                compass_calibration
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                LifeOS Command Engine
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span>
                <span>Telemetry Sync Active</span>
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-medium">
              Welcome, {profile?.display_name || 'Student'}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
              Real-time telemetry across academics, daily tasks, finances, and ideas. Balanced for calm focus.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0 flex-wrap">
            <div className="hidden sm:flex flex-col items-end mr-1 text-right">
              <span className="font-label-sm text-label-sm text-outline">
                {formatDateIST(new Date(), { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">IST Active</span>
            </div>
            <Link
              href="/projects"
              prefetch={true}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-outline">tune</span>
              <span>Workspaces</span>
            </Link>
            <Link
              href="/tasks"
              prefetch={true}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 font-label-md text-label-md transition-opacity shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-on-primary">add</span>
              <span>Quick Add</span>
            </Link>
          </div>
        </header>

        {/* Top Overview Metric Row (4 Notion-style breathing stat cards streamed) */}
        <Suspense fallback={<DashboardMetricsSkeleton />}>
          <DashboardMetrics />
        </Suspense>

        {/* Main Workspace Interactive Carousel: 4 Animated Modules */}
        <section className="w-full">
          <Suspense fallback={<DashboardCarouselSkeleton />}>
            <DashboardCarouselSection />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
