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

  it('applies horizontal orientation and preserves Notion-style frosted glass aesthetic', () => {
    const html = renderToString(<FloatingDock />);
    // Horizontal container styling
    expect(html).toContain('h-16');
    expect(html).toContain('flex-row');
    expect(html).toContain('items-end');
    expect(html).toContain('gap-4');
    expect(html).toContain('px-4');
    expect(html).toContain('pb-3');

    // Notion frosted glass aesthetic
    expect(html).toContain('backdrop-blur-md');
    expect(html).toContain('bg-white/60');
    expect(html).toContain('border-stone-200/50');
  });

  it('renders AppShell with bottom-center permanent floating dock and zero left sidebar gutter', () => {
    const html = renderToString(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    // Bottom-center permanent floating dock overlay wrapper
    expect(html).toContain('fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-row items-center');

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
