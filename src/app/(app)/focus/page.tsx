import React from 'react';
import type { Metadata } from 'next';
import { getDailyLoopDashboardData } from '@/lib/actions/daily-loop';
import { getRecentFocusSessions } from '@/lib/actions/focus-session';
import { FocusHistoryView } from '@/components/focus/focus-history/focus-history-view';

export const metadata: Metadata = {
  title: 'Focus History',
  description: 'Weekly cognitive telemetry and deep work sessions',
};

export const dynamic = 'force-dynamic';

export default async function FocusHistoryPage() {
  const [dailyLoopData, recentSessions] = await Promise.all([
    getDailyLoopDashboardData(),
    getRecentFocusSessions(30),
  ]);
  return <FocusHistoryView data={dailyLoopData} recentSessions={recentSessions} />;
}
