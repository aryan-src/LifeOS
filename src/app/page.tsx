import React from 'react';
import { cookies } from 'next/headers';
import { DashboardCommandCenter } from '@/components/dashboard/dashboard-command-center';
import { HeroLandingPage } from '@/components/landing/hero-landing-page';

export const dynamic = 'force-dynamic';

export default async function RootPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  try {
    const params = await searchParams;
    const cookieStore = await cookies();
    const viewCookie = cookieStore.get('lifeos_view')?.value;

    if (params?.view === 'landing') {
      return <HeroLandingPage />;
    }

    if (params?.view === 'dashboard' || viewCookie === 'dashboard') {
      return <DashboardCommandCenter />;
    }

    return <HeroLandingPage />;
  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE' || error?.message?.includes('Dynamic server usage')) {
      throw error;
    }
    console.error('RootPage initialization error:', error);
    return <HeroLandingPage />;
  }
}
