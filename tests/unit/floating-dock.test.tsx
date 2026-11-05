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

  it('applies compact horizontal orientation with items-end and bottom-anchored origin', () => {
    const html = renderToString(<FloatingDock />);
    // Compact horizontal container styling aligned to bottom baseline
    expect(html).toContain('h-12');
    expect(html).toContain('flex-row');
    expect(html).toContain('items-end');
    expect(html).toContain('justify-center');
    expect(html).toContain('gap-3');
    expect(html).toContain('px-3');
    expect(html).toContain('overflow-visible');

    // Bottom-anchored transform origin for native macOS dock upward scaling physics
    expect(html).toContain('origin-bottom');
  });

  it('renders AppShell with compact full-width fixed footer bar and zero left sidebar gutter', () => {
    const html = renderToString(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    // Full-width fixed edge-to-edge compact footer bar container with overflow-visible
    expect(html).toContain(
      'fixed bottom-0 left-0 right-0 w-full z-50 flex items-center justify-center py-1 px-4 backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 border-t border-stone-200/60 dark:border-zinc-800/60 shadow-xs overflow-visible'
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
