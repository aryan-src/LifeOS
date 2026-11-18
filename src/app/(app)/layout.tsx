import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { DevBypassBanner } from '@/components/layout/dev-bypass-banner';
import { WorkspaceHeader } from '@/components/navigation/workspace-header';
import { WorkspaceMain } from '@/components/layout/workspace-main';
import { getUserProfile } from '@/lib/actions/profile';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface text-on-surface transition-colors duration-200">
      <AppShell initialTheme={profile.theme_preference}>
        <DevBypassBanner />
        <WorkspaceHeader
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url ?? null}
        />
        <WorkspaceMain>{children}</WorkspaceMain>
      </AppShell>
    </div>
  );
}
