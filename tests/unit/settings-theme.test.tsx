import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SettingsForm } from '@/components/settings/settings-form';
import type { Profile } from '@/types/database.types';

// Mock server actions
vi.mock('@/lib/actions/profile', () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
  signOutAction: vi.fn().mockResolvedValue(undefined),
}));

const mockProfile: Profile = {
  id: 'test-user-id',
  display_name: 'Test Student',
  theme_preference: 'stone',
  currency_symbol: '₹',
  monthly_allowance_target: 15000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('SettingsForm Theme Selector & Crimson Integration', () => {
  it('renders all three theme choices including Crimson Dark and Crimson Light during SSR', () => {
    const html = renderToString(
      <SettingsForm initialProfile={mockProfile} userEmail="test@student.edu" />
    );

    expect(html).toContain('Default');
    expect(html).toContain('Notion-inspired warm paper aesthetic');
    expect(html).toContain('Crimson Dark');
    expect(html).toContain('Deep obsidian black, crimson red &amp; bright cream');
    expect(html).toContain('Crimson Light');
    expect(html).toContain('Bright cream canvas with crimson red &amp; obsidian text');
  });

  it('renders Crimson Dark as selected when profile preference is crimson-dark', () => {
    const crimsonDarkProfile: Profile = {
      ...mockProfile,
      theme_preference: 'crimson-dark',
    };

    const html = renderToString(
      <SettingsForm initialProfile={crimsonDarkProfile} userEmail="test@student.edu" />
    );

    expect(html).toContain('Crimson Dark');
    // Active selection ring & indicator dot
    expect(html).toContain('ring-primary/30');
  });

  it('renders Crimson Light as selected when profile preference is crimson-light', () => {
    const crimsonLightProfile: Profile = {
      ...mockProfile,
      theme_preference: 'crimson-light',
    };

    const html = renderToString(
      <SettingsForm initialProfile={crimsonLightProfile} userEmail="test@student.edu" />
    );

    expect(html).toContain('Crimson Light');
    // Active selection ring & indicator dot
    expect(html).toContain('ring-primary/30');
  });

  it('renders responsive 3-column grid for theme options preserving layout aesthetic', () => {
    const html = renderToString(
      <SettingsForm initialProfile={mockProfile} userEmail="test@student.edu" />
    );

    expect(html).toContain('grid-cols-1 sm:grid-cols-3 gap-3');
  });
});
