import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { TopHeader } from '@/components/navigation/top-header';

// Mock useUIStore
vi.mock('@/lib/store/use-ui-store', () => ({
  useUIStore: () => ({
    toggleMobileMenu: vi.fn(),
    isSidebarCollapsed: false,
  }),
}));

describe('Burger Button Theme Switcher in TopHeader', () => {
  it('renders the burger button for switching themes', () => {
    const html = renderToString(<TopHeader />);
    expect(html).toContain('aria-label="Burger button to switch between dark and light theme"');
    expect(html).toContain('title="Burger button to switch between dark and light theme"');
  });

  it('contains the 3-line burger button bars', () => {
    const html = renderToString(<TopHeader />);
    expect(html).toContain('rounded-full bg-current');
  });

  it('renders direct mode toggle button in top navigation bar', () => {
    const html = renderToString(<TopHeader />);
    expect(html).toMatch(/aria-label="Switch to (dark|light) mode"/);
    expect(html).toMatch(/title="Switch to (dark|light) mode"/);
  });
});
