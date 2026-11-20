'use client';

import React, { Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { QuickCaptureOmnibar } from '@/components/global/quick-capture';
import { LiquidFooterNav } from '@/components/navigation/liquid-footer-nav';
import { GlobalFocusController } from '@/components/focus/global-focus-controller';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { useUIStore } from '@/lib/store/use-ui-store';

function AppShellContent({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: string | null;
}) {
  const pathname = usePathname();
  const isDockVisible = useUIStore((state) => state.isDockVisible);
  const setDockVisible = useUIStore((state) => state.setDockVisible);
  const isModalOpen = useUIStore((state) => state.isModalOpen);
  const isCreateProjectOpen = useUIStore((state) => state.isCreateProjectOpen);
  const isLandingPage = useUIStore((state) => state.isLandingPage);

  const isModalActive = isModalOpen || isCreateProjectOpen;
  const isDockHidden = isLandingPage || isModalActive || !isDockVisible;

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifeos_dock_visible');
      if (saved !== null) {
        setDockVisible(saved === 'true');
      }
    } catch {
      // ignore storage errors
    }
  }, [setDockVisible]);

  const isAuthPage =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/auth');

  const isPublicOrExcludedPage =
    pathname === '/' ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/privacy') ||
    pathname?.startsWith('/license');

  if (isAuthPage) {
    return (
      <ThemeProvider initialTheme={initialTheme}>
        <QuickCaptureOmnibar />
        <main className="min-h-screen w-full bg-surface text-on-surface selection:bg-secondary/20 selection:text-on-surface transition-colors duration-200">
          {children}
        </main>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <QuickCaptureOmnibar />
      <GlobalFocusController />
      <div className="min-h-screen w-full flex flex-col bg-surface text-on-surface selection:bg-secondary/20 selection:text-on-surface transition-colors duration-200 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
        {children}
      </div>

      {/* Liquid Navbar bottom dock in signed-in app shell */}
      {!isPublicOrExcludedPage && (
        <motion.footer
          initial={false}
          animate={{
            y: isDockHidden ? 96 : 0,
            opacity: isDockHidden ? 0 : 1,
          }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="fixed bottom-5 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
          aria-hidden={isDockHidden}
          data-purpose="floating-dock-shell"
        >
          <div className={isDockHidden ? 'pointer-events-none' : 'pointer-events-auto'}>
            <LiquidFooterNav />
          </div>
        </motion.footer>
      )}
    </ThemeProvider>
  );
}

export function AppShell({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: string | null;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex flex-col bg-surface text-on-surface">
          {children}
        </div>
      }
    >
      <AppShellContent initialTheme={initialTheme}>{children}</AppShellContent>
    </Suspense>
  );
}
