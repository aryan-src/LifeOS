import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { DashboardCommandCenter } from '@/components/dashboard/dashboard-command-center';
import { HeroLandingPage } from '@/components/landing/hero-landing-page';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <HeroLandingPage />;
  }

  return <DashboardCommandCenter />;
}
