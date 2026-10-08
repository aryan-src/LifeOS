'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { DashboardMetricsSkeleton } from './dashboard-metrics-skeleton';
import type { DashboardMetricsViewProps } from './dashboard-metrics-view';

const DynamicDashboardMetricsView = dynamic(
  () => import('./dashboard-metrics-view').then((mod) => mod.DashboardMetricsView),
  {
    ssr: false,
    loading: () => <DashboardMetricsSkeleton />,
  }
);

export function DashboardMetricsClient(props: DashboardMetricsViewProps) {
  return <DynamicDashboardMetricsView {...props} />;
}
