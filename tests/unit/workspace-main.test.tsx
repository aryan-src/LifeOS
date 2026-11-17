import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { WorkspaceMain } from '@/components/layout/workspace-main';
import { useUIStore } from '@/lib/store/use-ui-store';

describe('WorkspaceMain dynamic footer clearance', () => {
  beforeEach(() => {
    useUIStore.setState({
      isDockVisible: true,
      isModalOpen: false,
      isCreateProjectOpen: false,
      isLandingPage: false,
    });
  });

  it('renders with pb-24 clearance when footer dock is visible', () => {
    const html = renderToString(
      <WorkspaceMain>
        <div>Dashboard Content</div>
      </WorkspaceMain>
    );

    expect(html).toContain('pb-24');
    expect(html).toContain('transition-[padding-bottom] duration-300 ease-out');
    expect(html).not.toContain('pb-6 md:pb-8');
  });

  it('renders with normal pb-6 md:pb-8 padding when footer dock is hidden', () => {
    useUIStore.setState({ isDockVisible: false });

    const html = renderToString(
      <WorkspaceMain>
        <div>Dashboard Content</div>
      </WorkspaceMain>
    );

    expect(html).toContain('pb-6 md:pb-8');
    expect(html).not.toContain('pb-24');
    expect(html).toContain('transition-[padding-bottom] duration-300 ease-out');
  });

  it('renders with pb-6 md:pb-8 when modal is open even if dock is marked visible', () => {
    useUIStore.setState({ isDockVisible: true, isModalOpen: true });

    const html = renderToString(
      <WorkspaceMain>
        <div>Dashboard Content</div>
      </WorkspaceMain>
    );

    expect(html).toContain('pb-6 md:pb-8');
    expect(html).not.toContain('pb-24');
  });
});
