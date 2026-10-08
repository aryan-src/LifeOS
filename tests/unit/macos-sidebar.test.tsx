import { describe, it, expect } from 'vitest';
import {
  DEFAULT_NAV_ITEMS,
  calculateDockScale,
} from '@/components/navigation/macos-sidebar';

describe('MacOSSidebar Config & Nav Items', () => {
  it('defines the 7 required navigation items with icons and links', () => {
    expect(DEFAULT_NAV_ITEMS.length).toBe(7);
    const labels = DEFAULT_NAV_ITEMS.map((item) => item.label);
    expect(labels).toEqual([
      'Dashboard',
      'Projects',
      'Daily Tasks',
      'Assignments',
      'Finances',
      'Ideas & Notes',
      'Settings',
    ]);

    const routes = DEFAULT_NAV_ITEMS.map((item) => item.href);
    expect(routes).toEqual([
      '/',
      '/projects',
      '/tasks',
      '/assignments',
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

  describe('Dock Zoom Magnification Physics', () => {
    it('applies constrained maximum scale (<= 1.08) at direct center distance', () => {
      const expandedScale = calculateDockScale(0, false);
      const collapsedScale = calculateDockScale(0, true);

      expect(expandedScale).toBe(1.06);
      expect(collapsedScale).toBe(1.08);
      expect(expandedScale).toBeLessThanOrEqual(1.08);
      expect(collapsedScale).toBeLessThanOrEqual(1.08);
    });

    it('scales immediate vertical neighbors subtly (~1.02)', () => {
      const neighborScale = calculateDockScale(42, false);
      expect(neighborScale).toBeCloseTo(1.022, 3);

      const negNeighborScale = calculateDockScale(-42, false);
      expect(negNeighborScale).toBeCloseTo(1.022, 3);
    });

    it('returns 1.0 for distances outside the magnification radius or when mouse leaves', () => {
      expect(calculateDockScale(85, false)).toBe(1);
      expect(calculateDockScale(120, false)).toBe(1);
      expect(calculateDockScale(-100, false)).toBe(1);
      expect(calculateDockScale(Infinity, false)).toBe(1);
      expect(calculateDockScale(-Infinity, false)).toBe(1);
    });
  });
});
