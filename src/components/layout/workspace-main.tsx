'use client';

import React from 'react';
import { useUIStore } from '@/lib/store/use-ui-store';

interface WorkspaceMainProps {
  children: React.ReactNode;
  className?: string;
  isDockVisible?: boolean;
}

export function WorkspaceMain({
  children,
  className = '',
  isDockVisible: isDockVisibleProp,
}: WorkspaceMainProps) {
  const storeIsDockVisible = useUIStore((state) => state.isDockVisible);
  const storeIsModalOpen = useUIStore((state) => state.isModalOpen);
  const storeIsCreateProjectOpen = useUIStore((state) => state.isCreateProjectOpen);
  const storeIsLandingPage = useUIStore((state) => state.isLandingPage);

  // In SSR / node test environments, read current store state directly to support dynamic getState()
  const ssrState = typeof window === 'undefined' ? useUIStore.getState() : null;
  const isDockVisible =
    isDockVisibleProp !== undefined
      ? isDockVisibleProp
      : (ssrState?.isDockVisible ?? storeIsDockVisible);
  const isModalOpen = ssrState?.isModalOpen ?? storeIsModalOpen;
  const isCreateProjectOpen = ssrState?.isCreateProjectOpen ?? storeIsCreateProjectOpen;
  const isLandingPage = ssrState?.isLandingPage ?? storeIsLandingPage;

  const isModalActive = isModalOpen || isCreateProjectOpen;
  const isDockHidden = isLandingPage || isModalActive || !isDockVisible;

  return (
    <main
      data-purpose="workspace-main"
      className={`w-full max-w-none flex-1 flex flex-col transition-[padding-bottom] duration-300 ease-out ${
        isDockHidden ? 'pb-6 md:pb-8' : ''
      } ${className}`}
      style={
        !isDockHidden
          ? {
              paddingBottom:
                'var(--footer-content-padding, var(--app-footer-clearance, calc(var(--app-footer-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px)))',
            }
          : undefined
      }
    >
      {children}
    </main>
  );
}
