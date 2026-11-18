import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { DevBypassBanner } from '@/components/layout/dev-bypass-banner';
import { WorkspaceHeader } from '@/components/navigation/workspace-header';
import { WorkspaceMain } from '@/components/layout/workspace-main';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#FAF9F5] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 transition-colors duration-200">
      <AppShell>
        <DevBypassBanner />
        <WorkspaceHeader />
        <WorkspaceMain>{children}</WorkspaceMain>
      </AppShell>
    </div>
  );
}
