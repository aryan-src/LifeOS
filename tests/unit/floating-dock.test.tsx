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

  it('applies vertical orientation and preserves Notion-style frosted glass aesthetic', () => {
    const html = renderToString(<FloatingDock />);
    // Vertical container styling
    expect(html).toContain('w-16');
    expect(html).toContain('flex-col');
    expect(html).toContain('items-center');
    expect(html).toContain('py-4');
    expect(html).toContain('px-3');

    // Notion frosted glass aesthetic
    expect(html).toContain('backdrop-blur-md');
    expect(html).toContain('bg-white/60');
    expect(html).toContain('border-stone-200/50');
  });

  it('renders AppShell with left-anchored vertical dock wrapper and content padding', () => {
    const html = renderToString(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    // Left-anchored vertical dock wrapper
    expect(html).toContain('fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col h-fit');

    // Content left-padding to prevent underlap
    expect(html).toMatch(/pl-(24|28)/);
  });
});
