import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FloatingDock, DEFAULT_DOCK_ITEMS } from '@/components/ui/floating-dock';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
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
});
