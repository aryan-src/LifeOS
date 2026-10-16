'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { QuickCaptureOmnibar } from '@/components/global/quick-capture';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopHeader } from '@/components/navigation/top-header';
import { useUIStore } from '@/lib/store/use-ui-store';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasLaunched, setHasLaunched] = useState(false);
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lifeos_view');
      const hasCookie = document.cookie.includes('lifeos_view=dashboard');
      if (stored === 'dashboard' || hasCookie) {
        setHasLaunched(true);
      }
    }
  }, []);

  const isDashboardQuery = searchParams?.get('view') === 'dashboard';
  const isLandingQuery = searchParams?.get('view') === 'landing';
  const isLandingPage = pathname === '/' && !isDashboardQuery && (!hasLaunched || isLandingQuery);

  if (isLandingPage) {
    return (
      <main className="min-h-screen w-full bg-surface dark:bg-zinc-950 text-on-surface dark:text-zinc-100 selection:bg-secondary-container selection:text-on-secondary-container transition-colors duration-200">
        {children}
      </main>
    );
  }

  return (
    <>
      <QuickCaptureOmnibar />
      <Sidebar />
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

export function AppShell({ children }: { children: React.ReactNode; isAuthenticated?: boolean }) {
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
