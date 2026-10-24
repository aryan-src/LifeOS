import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { HeroLandingPage } from '@/components/landing/hero-landing-page';
import { DashboardCommandCenter } from '@/components/dashboard/dashboard-command-center';

export const dynamic = 'force-dynamic';

export default async function RootPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const params = await searchParams;
    if (params?.view === 'landing') {
      return <HeroLandingPage />;
    }

    // Authenticated users navigating to / immediately render the workspace dashboard
    if (user || params?.view === 'dashboard') {
      return <DashboardCommandCenter />;
    }

    return <HeroLandingPage />;
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'digest' in err &&
      typeof (err as { digest?: string }).digest === 'string' &&
      (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
    ) {
      throw err;
    }
    if (
      typeof err === 'object' &&
      err !== null &&
      'digest' in err &&
      typeof (err as { digest?: string }).digest === 'string' &&
      (err as { digest: string }).digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw err;
    }
    console.error('RootPage initialization error:', err);
    return <HeroLandingPage />;
  }
}
