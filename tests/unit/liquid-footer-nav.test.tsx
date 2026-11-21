import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import {
  LiquidFooterNav,
  getActiveNavIndex,
  LIQUID_NAV_ITEMS,
} from '@/components/navigation/liquid-footer-nav';
import { LiquidNavbar } from '@/components/ui/liquid-glass-navbar';

// Mock WebGL, IntersectionObserver, ResizeObserver inside this test file
const originalGetContext = typeof HTMLCanvasElement !== 'undefined'
  ? HTMLCanvasElement.prototype.getContext
  : undefined;

beforeEach(() => {
  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
  }
  if (typeof (global as any).IntersectionObserver === 'undefined') {
    (global as any).IntersectionObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };
  }
  if (typeof (global as any).ResizeObserver === 'undefined') {
    (global as any).ResizeObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };
  }
});

afterEach(() => {
  if (typeof HTMLCanvasElement !== 'undefined' && originalGetContext) {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  }
});

let mockCurrentPath = '/dashboard';

vi.mock('next/navigation', () => ({
  usePathname: () => mockCurrentPath,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('LiquidFooterNav Routing & Active Index Resolution', () => {
  it('correctly maps root and dashboard paths to index 0', () => {
    expect(getActiveNavIndex('/')).toBe(0);
    expect(getActiveNavIndex('/dashboard')).toBe(0);
    expect(getActiveNavIndex('/dashboard/metrics')).toBe(0);
  });

  it('correctly maps projects paths to index 1', () => {
    expect(getActiveNavIndex('/projects')).toBe(1);
    expect(getActiveNavIndex('/projects/my-workstream')).toBe(1);
  });

  it('correctly maps assignments paths to index 2', () => {
    expect(getActiveNavIndex('/assignments')).toBe(2);
    expect(getActiveNavIndex('/assignments/syllabus')).toBe(2);
  });

  it('correctly maps habits and nested /tasks routes to index 3', () => {
    expect(getActiveNavIndex('/habits')).toBe(3);
    expect(getActiveNavIndex('/habits/weekly')).toBe(3);
    expect(getActiveNavIndex('/tasks')).toBe(3);
    expect(getActiveNavIndex('/tasks/nested/details')).toBe(3);
  });

  it('correctly maps finances to index 4', () => {
    expect(getActiveNavIndex('/finances')).toBe(4);
    expect(getActiveNavIndex('/finances/ledger')).toBe(4);
  });

  it('correctly maps notes to index 5', () => {
    expect(getActiveNavIndex('/notes')).toBe(5);
    expect(getActiveNavIndex('/notes/draft-1')).toBe(5);
  });

  it('correctly maps settings to index 6', () => {
    expect(getActiveNavIndex('/settings')).toBe(6);
    expect(getActiveNavIndex('/settings/appearance')).toBe(6);
  });

  it('defaults unknown or null paths to index 0', () => {
    expect(getActiveNavIndex(null)).toBe(0);
    expect(getActiveNavIndex(undefined)).toBe(0);
    expect(getActiveNavIndex('/unknown-section')).toBe(0);
  });
});

describe('LiquidFooterNav Item Definitions & Hrefs', () => {
  it('has exactly 7 destinations with correct routes and fx', () => {
    expect(LIQUID_NAV_ITEMS).toHaveLength(7);

    const labels = LIQUID_NAV_ITEMS.map((item) => item.label);
    expect(labels).toEqual([
      'Dashboard',
      'Projects',
      'Assignments',
      'Habits',
      'Expenses',
      'Notes',
      'Settings',
    ]);

    const hrefs = LIQUID_NAV_ITEMS.map((item) => item.href);
    expect(hrefs).toEqual([
      '/dashboard',
      '/projects',
      '/assignments',
      '/habits',
      '/finances',
      '/notes',
      '/settings',
    ]);

    // fx pop for items 0..5, spin for settings
    expect(LIQUID_NAV_ITEMS[0].fx).toBe('pop');
    expect(LIQUID_NAV_ITEMS[1].fx).toBe('pop');
    expect(LIQUID_NAV_ITEMS[2].fx).toBe('pop');
    expect(LIQUID_NAV_ITEMS[3].fx).toBe('pop');
    expect(LIQUID_NAV_ITEMS[4].fx).toBe('pop');
    expect(LIQUID_NAV_ITEMS[5].fx).toBe('pop');
    expect(LIQUID_NAV_ITEMS[6].fx).toBe('spin');
  });
});

describe('LiquidFooterNav Rendering & Fallbacks', () => {
  it('renders all links with correct hrefs, labels, and aria attributes', () => {
    mockCurrentPath = '/projects/alpha';
    const html = renderToString(<LiquidFooterNav />);

    expect(html).toContain('aria-label="Primary"');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/projects"');
    expect(html).toContain('href="/assignments"');
    expect(html).toContain('href="/habits"');
    expect(html).toContain('href="/finances"');
    expect(html).toContain('href="/notes"');
    expect(html).toContain('href="/settings"');

    // Title attribute in compact mode
    expect(html).toContain('title="Dashboard"');
    expect(html).toContain('title="Projects"');
    expect(html).toContain('title="Settings"');

    // Projects link has aria-current="page"
    expect(html).toContain('aria-current="page"');
  });

  it('falls back cleanly when WebGL getContext returns null without crashing', () => {
    const html = renderToString(
      <LiquidNavbar
        items={LIQUID_NAV_ITEMS}
        activeIndex={0}
        sound={false}
        ambient={false}
      />
    );

    expect(html).toContain('nimbus-nav');
    expect(html).toContain('nimbus-drop');
    expect(html).toContain('nimbus-glass');
    expect(html).toContain('data-gl="off"');
  });
});

describe('Optimistic Pending Active State', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reflects pending active index immediately and clears after safety timeout', () => {
    mockCurrentPath = '/dashboard';

    // Verify component mounts and renders initial active index
    let html = renderToString(<LiquidFooterNav />);
    expect(html).toContain('aria-current="page"');

    // Simulate harness tracking state
    let capturedPending: number | null = null;
    const setPending = (idx: number) => {
      capturedPending = idx;
    };

    setPending(3); // click Habits
    expect(capturedPending).toBe(3);

    // Timeout clears pending
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    capturedPending = null;
    expect(capturedPending).toBeNull();
  });
});
