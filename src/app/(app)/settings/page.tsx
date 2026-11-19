import React from 'react';
import type { Metadata } from 'next';
import { getUserProfile } from '@/lib/actions/profile';
import { BentoSettings } from '@/components/settings/bento-settings';

export const metadata: Metadata = {
  title: 'Settings — LifeOS',
  description:
    'Account preferences, monthly allowance, Light and Dark appearance, and account data exports.',
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const profile = await getUserProfile();

  return (
    <div className="flex flex-col w-full">
      <BentoSettings initialProfile={profile} />
    </div>
  );
}
