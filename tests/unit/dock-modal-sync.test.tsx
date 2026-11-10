import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useUIStore } from '@/lib/store/use-ui-store';
import { AppShell } from '@/components/layout/app-shell';
import { CreateProjectModal } from '@/components/projects/create-project-modal';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/projects',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('Modal State Synchronization & Footer Dock Auto-Hide Mechanics', () => {
  beforeEach(() => {
    useUIStore.setState({
      isDockVisible: true,
      isModalOpen: false,
      isCreateProjectOpen: false,
    });
  });

  it('manages modal visibility state in useUIStore correctly', () => {
    expect(useUIStore.getState().isModalOpen).toBe(false);
    expect(useUIStore.getState().isCreateProjectOpen).toBe(false);

    useUIStore.getState().setModalOpen(true);
    expect(useUIStore.getState().isModalOpen).toBe(true);

    useUIStore.getState().setModalOpen(false);
    expect(useUIStore.getState().isModalOpen).toBe(false);

    useUIStore.getState().openCreateProject();
    expect(useUIStore.getState().isCreateProjectOpen).toBe(true);
    expect(useUIStore.getState().isModalOpen).toBe(true);

    useUIStore.getState().closeCreateProject();
    expect(useUIStore.getState().isCreateProjectOpen).toBe(false);
    expect(useUIStore.getState().isModalOpen).toBe(false);
  });

  it('renders AppShell footer dock at z-50 with exact full-width fixed styling', () => {
    const html = renderToString(
      <AppShell>
        <div>Page Content</div>
      </AppShell>
    );

    expect(html).toContain('z-50');
    expect(html).toContain(
      'fixed bottom-0 left-0 right-0 w-full z-50 flex items-center justify-center py-1 px-4 backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 border-t border-stone-200/60 dark:border-zinc-800/60 shadow-xs overflow-visible'
    );
  });

  it('sets aria-hidden on footer dock when modal is active', () => {
    useUIStore.setState({ isModalOpen: true });
    const htmlModalOpen = renderToString(
      <AppShell>
        <div>Page Content</div>
      </AppShell>
    );
    expect(htmlModalOpen).toContain('aria-hidden="true"');

    useUIStore.setState({ isModalOpen: false, isCreateProjectOpen: true });
    const htmlCreateOpen = renderToString(
      <AppShell>
        <div>Page Content</div>
      </AppShell>
    );
    expect(htmlCreateOpen).toContain('aria-hidden="true"');

    useUIStore.setState({ isModalOpen: false, isCreateProjectOpen: false });
    const htmlModalClosed = renderToString(
      <AppShell>
        <div>Page Content</div>
      </AppShell>
    );
    expect(htmlModalClosed).toContain('aria-hidden="false"');
  });

  it('enforces z-[100] on modal container overlay to ensure it layers above dock (z-50)', () => {
    const html = renderToString(
      <CreateProjectModal isOpen={true} onClose={vi.fn()} />
    );

    // Modal scrim uses z-[100] and full viewport
    expect(html).toContain('fixed inset-0');
    expect(html).toContain('z-[100]');
    expect(html).toContain('w-screen h-screen');
    expect(html).toContain('backdrop-blur-md');
  });
});
