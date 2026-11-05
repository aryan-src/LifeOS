import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  WorkspaceAtmosphereSelector,
  WORKSPACE_THEMES,
} from '@/components/settings/workspace-atmosphere-selector';
import type { Profile } from '@/types/database.types';

vi.mock('@/lib/actions/profile', () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
}));

const mockProfile: Profile = {
  id: 'test-user-id',
  display_name: 'Aryan',
  theme_preference: 'spatial-glass',
  currency_symbol: '₹',
  monthly_allowance_target: 5000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('WorkspaceAtmosphereSelector Component Tests', () => {
  it('renders all 5 premium hook-driven workspace theme options', () => {
    const html = renderToString(
      <WorkspaceAtmosphereSelector initialTheme="spatial-glass" profile={mockProfile} />
    );

    // 1. Spatial Glassmorphism
    expect(html).toContain('Spatial Glassmorphism');
    expect(html).toContain('Ambient Mesh &amp; Frosted Specular Layers');
    expect(html).toContain('Spatial UI');

    // 2. Risograph Editorial
    expect(html).toContain('Risograph Editorial');
    expect(html).toContain('Warm Raw Linen &amp; Duotone Inks');
    expect(html).toContain('Editorial Press');

    // 3. Nordic Ceramic & Linen
    expect(html).toContain('Nordic Ceramic &amp; Linen');
    expect(html).toContain('Soft Oat Canvas &amp; Desaturated Sage');
    expect(html).toContain('Stoneware Calm');

    // 4. TUI / Command-Line Terminal
    expect(html).toContain('TUI / Terminal');
    expect(html).toContain('Deep Matte Slate &amp; Emerald Phosphor');
    expect(html).toContain('CLI Matrix');

    // 5. Tactile Functionalism
    expect(html).toContain('Tactile Functionalism');
    expect(html).toContain('Appliance-White &amp; Recessed Hardware');
    expect(html).toContain('Braun / Dieter');
  });

  it('renders a 5-card responsive grid architecture', () => {
    const html = renderToString(
      <WorkspaceAtmosphereSelector initialTheme="nordic" profile={mockProfile} />
    );

    expect(html).toContain('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5');
    expect(WORKSPACE_THEMES).toHaveLength(5);
  });

  it('renders specific mini preview elements for each theme', () => {
    const html = renderToString(
      <WorkspaceAtmosphereSelector initialTheme="tui" profile={mockProfile} />
    );

    // Spatial glass preview elements
    expect(html).toContain('glass.mesh');
    expect(html).toContain('blur-xl');

    // Risograph preview elements
    expect(html).toContain('Vol. 04');
    expect(html).toContain('RISO INK');

    // Nordic ceramic preview elements
    expect(html).toContain('Ceramic Ivory');
    expect(html).toContain('rounded-3xl');

    // TUI CLI preview elements
    expect(html).toContain('&gt; lifeos --tui');
    expect(html).toContain('1px GRID');

    // Tactile hardware preview elements
    expect(html).toContain('TOGGLE 01');
  });

  it('correctly marks the initialTheme as selected in radiogroup', () => {
    const html = renderToString(
      <WorkspaceAtmosphereSelector initialTheme="tactile" profile={mockProfile} />
    );

    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('5 Atmosphere Presets Active');
  });
});
