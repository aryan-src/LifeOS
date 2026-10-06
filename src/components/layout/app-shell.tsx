'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { QuickCaptureOmnibar } from '@/components/global/quick-capture';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopHeader } from '@/components/navigation/top-header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login');

  if (isAuthPage) {
    return (
      <main className="min-h-screen w-full bg-[#faf8f5] flex items-center justify-center p-4 selection:bg-secondary-container selection:text-on-secondary-container">
        {children}
      </main>
    );
  }

  return (
    <>
      <QuickCaptureOmnibar />
      <Sidebar />
      <div className="pl-0 lg:pl-64 min-h-screen transition-[padding] duration-200 flex flex-col">
        <TopHeader />
        <main className="w-full pt-14 bg-surface min-h-screen flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
