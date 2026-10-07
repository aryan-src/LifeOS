import { describe, it, expect } from 'vitest';
import { DEFAULT_NAV_ITEMS } from '@/components/navigation/macos-sidebar';

describe('MacOSSidebar Config & Nav Items', () => {
  it('defines the 6 required navigation items with icons and links', () => {
    expect(DEFAULT_NAV_ITEMS.length).toBe(6);
    const labels = DEFAULT_NAV_ITEMS.map((item) => item.label);
    expect(labels).toEqual([
      'Dashboard',
      'Projects',
      'Daily Tasks',
      'Finances',
      'Ideas & Notes',
      'Settings',
    ]);

    const routes = DEFAULT_NAV_ITEMS.map((item) => item.href);
    expect(routes).toEqual([
      '/',
      '/projects',
      '/tasks',
      '/finances',
      '/notes',
      '/settings',
    ]);
  });

  it('ensures all icons are defined and truthy', () => {
    DEFAULT_NAV_ITEMS.forEach((item) => {
      expect(item.icon).toBeDefined();
    });
  });
});
