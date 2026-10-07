'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { QuickCaptureOmnibar } from '@/components/global/quick-capture';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopHeader } from '@/components/navigation/top-header';
import { useUIStore } from '@/lib/store/use-ui-store';

export function AppShell({
  children,
  isAuthenticated = false,
}: {
  children: React.ReactNode;
  isAuthenticated?: boolean;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login');
  const isLandingPage = pathname === '/' && !isAuthenticated;
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);

  if (isAuthPage || isLandingPage) {
    return (
      <main className="min-h-screen w-full selection:bg-secondary-container selection:text-on-secondary-container">
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
        <main className="w-full pt-14 bg-surface min-h-screen flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
