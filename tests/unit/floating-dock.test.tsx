import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FloatingDock, DEFAULT_DOCK_ITEMS } from '@/components/ui/floating-dock';
import { AppShell } from '@/components/layout/app-shell';

// Mock next/navigation
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
  it('defines the 7 core modules with correct routes', () => {
    expect(DEFAULT_DOCK_ITEMS.length).toBe(7);
    const titles = DEFAULT_DOCK_ITEMS.map((item) => item.title);
    expect(titles).toEqual([
      'Dashboard',
      'Projects',
      'Daily Tasks',
      'Habits',
      'Finances',
      'Notes',
      'Settings',
    ]);

    const routes = DEFAULT_DOCK_ITEMS.map((item) => item.href);
    expect(routes).toEqual([
      '/',
      '/projects',
      '/tasks',
      '/habits',
      '/finances',
      '/notes',
      '/settings',
    ]);
  });

  it('ensures all icons are defined and truthy', () => {
    DEFAULT_DOCK_ITEMS.forEach((item) => {
      expect(item.icon).toBeDefined();
    });
  });

  it('renders without hydration or server-rendering errors', () => {
    const html = renderToString(<FloatingDock />);
    expect(html).toContain('Dashboard');
    expect(html).toContain('Projects');
    expect(html).toContain('Daily Tasks');
    expect(html).toContain('Habits');
    expect(html).toContain('Finances');
    expect(html).toContain('Notes');
    expect(html).toContain('Settings');
  });

  it('applies horizontal orientation and scale clearance height', () => {
    const html = renderToString(<FloatingDock />);
    // Horizontal container styling with scale clearance
    expect(html).toContain('h-20');
    expect(html).toContain('flex-row');
    expect(html).toContain('items-center');
    expect(html).toContain('justify-center');
    expect(html).toContain('gap-4');
    expect(html).toContain('px-4');
  });

  it('renders AppShell with full-width fixed footer bar and zero left sidebar gutter', () => {
    const html = renderToString(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    // Full-width fixed edge-to-edge footer bar container
    expect(html).toContain(
      'fixed bottom-0 left-0 right-0 w-full z-50 flex items-center justify-center py-3 px-6 backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 border-t border-stone-200/60 dark:border-zinc-800/60 shadow-xs'
    );

    // Canvas expands to full width without any reserved sidebar layout gutter
    expect(html).toContain('w-full');
    expect(html).not.toMatch(/pl-(24|28|56|64)/);
  });

  it('does not render an edge detection zone or auto-hide triggers', () => {
    const html = renderToString(<FloatingDock />);
    expect(html).not.toContain('data-purpose="edge-detection-zone"');
    expect(html).not.toContain('h-screen w-4');
  });

  it('renders desktop dock permanently visible without off-screen translation', () => {
    const html = renderToString(<FloatingDock />);
    expect(html).toContain('data-purpose="floating-dock-desktop"');
    expect(html).not.toContain('-130%');
    expect(html).not.toContain('-140%');
  });
});
