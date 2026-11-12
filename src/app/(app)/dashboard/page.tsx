import React from 'react';
import type { Metadata } from 'next';
import { DashboardCommandCenter } from '@/components/dashboard/dashboard-command-center';

export const metadata: Metadata = {
  title: 'Command Center',
  description: 'Unified overview of your active tasks, projects, pocket money, and notes.',
};

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <DashboardCommandCenter />;
}
