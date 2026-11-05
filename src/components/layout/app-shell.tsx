'use client';

import React, { Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { QuickCaptureOmnibar } from '@/components/global/quick-capture';
import { FloatingDock } from '@/components/ui/floating-dock';
import { useUIStore } from '@/lib/store/use-ui-store';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDockVisible = useUIStore((state) => state.isDockVisible);
  const setDockVisible = useUIStore((state) => state.setDockVisible);

  // Synchronize persisted dock visibility from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeos_dock_visible');
      if (saved !== null) {
        setDockVisible(saved === 'true');
      }
    } catch {}
  }, [setDockVisible]);

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

  // Full-width workspace shell with bottom-center permanent floating dock
  return (
    <>
      <QuickCaptureOmnibar />
      <div className="min-h-screen w-full flex flex-col bg-[#FAF9F5] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 selection:bg-secondary-container selection:text-on-secondary-container transition-colors duration-200">
        {children}
      </div>

      {/* Permanently visible bottom-center floating footer dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-row items-center">
        <FloatingDock />
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex flex-col bg-[#FAF9F5] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100">
          {children}
        </div>
      }
    >
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
