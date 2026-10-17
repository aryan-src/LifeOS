import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HeroLandingPage } from '@/components/landing/hero-landing-page';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged-in users navigating to / automatically redirect to /dashboard
  if (user) {
    redirect('/dashboard');
  }

  return <HeroLandingPage />;
}
