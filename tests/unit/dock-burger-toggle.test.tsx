import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { WorkspaceHeader } from '@/components/navigation/workspace-header';
import { useUIStore } from '@/lib/store/use-ui-store';

describe('Burger Button Dock Toggle Tests', () => {
  beforeEach(() => {
    useUIStore.setState({ isDockVisible: true });
  });

  it('renders the burger button in WorkspaceHeader with accessible labels', () => {
    const html = renderToString(<WorkspaceHeader />);

    expect(html).toContain('aria-label="Hide dock navigation"');
    expect(html).toContain('title="Hide Dock (⌘B)"');
    expect(html).toContain('h-0.5 w-4 rounded-full bg-current');
  });

  it('renders with "Show Dock" title and label when dock is hidden', () => {
    const html = renderToString(<WorkspaceHeader isDockVisible={false} />);

    expect(html).toContain('aria-label="Show dock navigation"');
    expect(html).toContain('title="Show Dock (⌘B)"');
  });

  it('toggles isDockVisible state in useUIStore correctly', () => {
    expect(useUIStore.getState().isDockVisible).toBe(true);

    useUIStore.getState().toggleDock();
    expect(useUIStore.getState().isDockVisible).toBe(false);

    useUIStore.getState().toggleDock();
    expect(useUIStore.getState().isDockVisible).toBe(true);
  });
});
