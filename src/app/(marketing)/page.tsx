import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HeroLandingPage } from '@/components/landing/hero-landing-page';

export const metadata: Metadata = {
  title: 'LifeOS: budget, tasks, habits and projects in one dashboard',
  description:
    'Track pocket money, daily tasks, habits, projects and ideas on one calm dashboard. Free to start.',
};

export const dynamic = 'force-dynamic';

/**
 * RootPage — Public Editorial Landing Page
 * Routes authenticated users to the workspace dashboard (/dashboard),
 * or serves the isolated calm editorial landing page with no app header or sidebar.
 */
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

    // Authenticated users navigating to / immediately redirect to the workspace command center
    if (user || params?.view === 'dashboard') {
      redirect('/dashboard');
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
