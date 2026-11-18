import React from 'react';
import type { Metadata } from 'next';
import { getDailyLoopDashboardData } from '@/lib/actions/daily-loop';
import { FocusHistoryView } from '@/components/focus/focus-history/focus-history-view';

export const metadata: Metadata = {
  title: 'Focus History',
  description: 'Weekly focus telemetry, daily goal rhythm, and 14-day peak-hour calibration.',
};

export const dynamic = 'force-dynamic';

export default async function FocusHistoryPage() {
  const dailyLoopData = await getDailyLoopDashboardData();
  return <FocusHistoryView data={dailyLoopData} />;
}
