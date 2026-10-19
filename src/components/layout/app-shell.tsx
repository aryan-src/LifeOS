'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { QuickCaptureOmnibar } from '@/components/global/quick-capture';
import { TopHeader } from '@/components/navigation/top-header';
import { FloatingDock } from '@/components/ui/floating-dock';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
      <div className="min-h-screen flex flex-col">
        <TopHeader />
        <main className="w-full pt-14 pb-28 bg-surface dark:bg-zinc-950 min-h-screen flex-1 text-on-surface dark:text-zinc-100 transition-colors duration-200">
          {children}
        </main>
      </div>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <FloatingDock />
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
