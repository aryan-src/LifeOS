import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { WorkspaceHeader } from '@/components/navigation/workspace-header';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#FAF9F5] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 transition-colors duration-200">
      <AppShell>
        <WorkspaceHeader />
        <main className="w-full max-w-none px-0 md:px-2 lg:px-3 pb-20 sm:pb-24 flex-1 flex flex-col">
          {children}
        </main>
      </AppShell>
    </div>
  );
}
