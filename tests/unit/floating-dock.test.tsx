import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  FloatingDock,
  DEFAULT_DOCK_ITEMS,
  isDockRouteActive,
} from '@/components/ui/floating-dock';
import { AppShell } from '@/components/layout/app-shell';

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

describe('FloatingDock Navigation System', () => {
  it('defines the 7 Stitch core modules with correct routes', () => {
    expect(DEFAULT_DOCK_ITEMS.length).toBe(7);
    const titles = DEFAULT_DOCK_ITEMS.map((item) => item.title);
    expect(titles).toEqual([
      'Dashboard',
      'Projects',
      'Assignments',
      'Habits',
      'Expenses',
      'Notes',
      'Settings',
    ]);

    const routes = DEFAULT_DOCK_ITEMS.map((item) => item.href);
    expect(routes).toEqual([
      '/dashboard',
      '/projects',
      '/assignments',
      '/habits',
      '/finances',
      '/notes',
      '/settings',
    ]);
  });

  it('derives active state accurately from current route', () => {
    expect(isDockRouteActive('/dashboard', '/dashboard')).toBe(true);
    expect(isDockRouteActive('/', '/dashboard')).toBe(true);
    expect(isDockRouteActive('/projects/abc', '/projects')).toBe(true);
    expect(isDockRouteActive('/finances', '/habits')).toBe(false);
  });

  it('renders accessible pill navigation with aria-current on active route', () => {
    const html = renderToString(<FloatingDock />);
    expect(html).toContain('data-purpose="floating-dock-pill"');
    expect(html).toContain('aria-label="Primary workspace navigation"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('bg-primary text-on-primary');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Projects');
    expect(html).toContain('Assignments');
    expect(html).toContain('Habits');
    expect(html).toContain('Expenses');
    expect(html).toContain('Notes');
    expect(html).toContain('Settings');
  });

  it('renders AppShell with floating pill dock container and full-width workspace', () => {
    const html = renderToString(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    expect(html).toContain('data-purpose="floating-dock-shell"');
    expect(html).toContain('fixed bottom-5 inset-x-0 z-50 flex justify-center');
    expect(html).toContain('bg-surface text-on-surface');
    expect(html).not.toMatch(/pl-(24|28|56|64)/);
  });
});
