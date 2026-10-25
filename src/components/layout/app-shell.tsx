'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { QuickCaptureOmnibar } from '@/components/global/quick-capture';
import { FloatingDock } from '@/components/ui/floating-dock';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/auth');

  if (isAuthPage) {
    return (
      <>
        <QuickCaptureOmnibar />
        <main className="min-h-screen w-full bg-[#FAF9F5] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 selection:bg-secondary-container selection:text-on-secondary-container transition-colors duration-200">
          {children}
        </main>
      </>
    );
  }

  // Unified global workspace shell with warm paper canvas
  return (
    <>
      <QuickCaptureOmnibar />
      <div className="min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 selection:bg-secondary-container selection:text-on-secondary-container transition-colors duration-200">
        {children}
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
        <main className="min-h-screen w-full bg-[#FAF9F5] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100">
          {children}
        </main>
      }
    >
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
