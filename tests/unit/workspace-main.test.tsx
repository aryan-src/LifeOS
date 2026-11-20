import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { WorkspaceMain } from '@/components/layout/workspace-main';
import { AppShell } from '@/components/layout/app-shell';
import { useUIStore } from '@/lib/store/use-ui-store';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('WorkspaceMain dynamic footer clearance', () => {
  beforeEach(() => {
    useUIStore.setState({
      isDockVisible: true,
      isModalOpen: false,
      isCreateProjectOpen: false,
      isLandingPage: false,
    });
  });

  it('renders with shared footer reservation padding when footer dock is visible', () => {
    const html = renderToString(
      <WorkspaceMain>
        <div>Dashboard Content</div>
      </WorkspaceMain>
    );

    expect(html).toContain('var(--footer-content-padding');
    expect(html).toContain('transition-[padding-bottom] duration-300 ease-out');
    expect(html).not.toContain('pb-6 md:pb-8');
    expect(html).not.toContain('pb-32');
    expect(html).not.toContain('pb-36');
  });

  it('renders with normal pb-6 md:pb-8 padding when footer dock is hidden', () => {
    useUIStore.setState({ isDockVisible: false });

    const html = renderToString(
      <WorkspaceMain>
        <div>Dashboard Content</div>
      </WorkspaceMain>
    );

    expect(html).toContain('pb-6 md:pb-8');
    expect(html).not.toContain('var(--footer-content-padding');
    expect(html).not.toContain('pb-32');
    expect(html).not.toContain('pb-36');
    expect(html).toContain('transition-[padding-bottom] duration-300 ease-out');
  });

  it('renders with pb-6 md:pb-8 when modal is open even if dock is marked visible', () => {
    useUIStore.setState({ isDockVisible: true, isModalOpen: true });

    const html = renderToString(
      <WorkspaceMain>
        <div>Dashboard Content</div>
      </WorkspaceMain>
    );

    expect(html).toContain('pb-6 md:pb-8');
    expect(html).not.toContain('var(--footer-content-padding');
    expect(html).not.toContain('pb-32');
    expect(html).not.toContain('pb-36');
  });

  it('renders AppShell with transparent footer and shared footer-content-padding CSS variable', () => {
    const html = renderToString(
      <AppShell>
        <WorkspaceMain>
          <div>Page Content</div>
        </WorkspaceMain>
      </AppShell>
    );

    // Footer container must have transparent background, no border, no shadow, and pointer-events-none
    expect(html).toContain('bg-transparent');
    expect(html).toContain('border-none');
    expect(html).toContain('shadow-none');
    expect(html).toContain('pointer-events-none');
    expect(html).not.toContain('backdrop-blur-md');

    // App shell root must define the shared CSS variables
    expect(html).toContain('--footer-nav-height:52px');
    expect(html).toContain('--footer-nav-offset:20px');
    expect(html).toContain('--footer-nav-gap:16px');
    expect(html).toContain('--footer-content-padding:calc(var(--footer-nav-height) + var(--footer-nav-offset) + var(--footer-nav-gap) + env(safe-area-inset-bottom, 0px))');

    // WorkspaceMain must consume the shared CSS variable
    expect(html).toContain('padding-bottom:var(--footer-content-padding');
  });
});
