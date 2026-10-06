import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/actions/profile';
import { SettingsForm } from '@/components/settings/settings-form';
import { Sparkles, Sliders } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data: { user } }, profile] = await Promise.all([
    supabase.auth.getUser(),
    getUserProfile(),
  ]);

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-7xl mx-auto px-space-md sm:px-space-lg lg:px-margin py-space-xl flex flex-col gap-space-xl">
        {/* Header */}
        <div className="flex flex-col gap-space-xs max-w-2xl">
          <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm uppercase tracking-wider">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary"></span>
            <span>Workspace Preferences</span>
            <span>·</span>
            <span>Multi-Tenant</span>
          </div>
          <h1 className="font-display text-display text-on-surface font-semibold tracking-tight">
            Settings & Personalization
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Customize your student workspace identity, default currency symbol, and monthly allowance target.
          </p>
        </div>

        {/* Settings Form Container */}
        <SettingsForm initialProfile={profile} userEmail={user?.email} />
      </div>
    </div>
  );
}
