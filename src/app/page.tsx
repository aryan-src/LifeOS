import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { DashboardCommandCenter } from '@/components/dashboard/dashboard-command-center';
import { HeroLandingPage } from '@/components/landing/hero-landing-page';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return <HeroLandingPage />;
    }

    return <DashboardCommandCenter />;
  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE' || error?.message?.includes('Dynamic server usage')) {
      throw error;
    }
    console.error('RootPage initialization error:', error);
    return <HeroLandingPage />;
  }
}
