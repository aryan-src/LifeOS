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
  const isModalOpen = useUIStore((state) => state.isModalOpen);
  const isCreateProjectOpen = useUIStore((state) => state.isCreateProjectOpen);
  const isLandingPage = useUIStore((state) => state.isLandingPage);

  const isModalActive = isModalOpen || isCreateProjectOpen;
  const isDockHidden = isLandingPage || isModalActive || !isDockVisible;

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

  // Full-width workspace shell with full-width fixed footer dock
  return (
    <>
      <QuickCaptureOmnibar />
      <div className="min-h-screen w-full flex flex-col bg-[#FAF9F5] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 selection:bg-secondary-container selection:text-on-secondary-container transition-colors duration-200">
        {children}
      </div>

      {/* Full-width fixed edge-to-edge footer bar spanning the entire screen */}
      <motion.footer
        initial={false}
        animate={{
          y: isDockHidden ? 100 : 0,
          opacity: isDockHidden ? 0 : 1,
          pointerEvents: isDockHidden ? 'none' : 'auto',
        }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="fixed bottom-0 left-0 right-0 w-full z-50 flex items-center justify-center py-1 px-4 backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 border-t border-stone-200/60 dark:border-zinc-800/60 shadow-xs overflow-visible"
        aria-hidden={isDockHidden}
      >
        <FloatingDock />
      </motion.footer>
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
