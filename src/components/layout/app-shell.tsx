'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { QuickCaptureOmnibar } from '@/components/global/quick-capture';
import { MacOSSidebar } from '@/components/navigation/macos-sidebar';
import { TopHeader } from '@/components/navigation/top-header';
import { useUIStore } from '@/lib/store/use-ui-store';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);

  // Standalone public pages (landing, auth, legal/static pages)
  const isStandalonePage =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/changelog' ||
    pathname === '/license';

  if (isStandalonePage) {
    return (
      <main className="min-h-screen w-full bg-surface dark:bg-zinc-950 text-on-surface dark:text-zinc-100 selection:bg-secondary-container selection:text-on-secondary-container transition-colors duration-200">
        {children}
      </main>
    );
  }

  // Authenticated workspace shell
  return (
    <>
      <QuickCaptureOmnibar />
      <MacOSSidebar />
      <div
        className={`min-h-screen transition-[padding] duration-300 ease-out flex flex-col ${
          isSidebarCollapsed ? 'pl-0 lg:pl-20' : 'pl-0 lg:pl-[260px]'
        }`}
      >
        <TopHeader />
        <main className="w-full pt-14 bg-surface dark:bg-zinc-950 min-h-screen flex-1 text-on-surface dark:text-zinc-100 transition-colors duration-200">
          {children}
        </main>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen w-full bg-surface dark:bg-zinc-950 text-on-surface dark:text-zinc-100">
          {children}
        </main>
      }
    >
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
