import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BentoSettings } from '@/components/settings/bento-settings';
import type { Profile } from '@/types/database.types';

// Mock server actions and export
vi.mock('@/lib/actions/profile', () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
  updateUserProfile: vi.fn().mockResolvedValue({ success: true }),
  signOutAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/actions/export', () => ({
  getFullAccountExport: vi.fn().mockResolvedValue({
    success: true,
    data: { notes: [], transactions: [], assignments: [], tasks: [], habits: [] },
  }),
}));

const mockProfile: Profile = {
  id: 'test-user-id',
  display_name: 'Aryan',
  theme_preference: 'default',
  currency_symbol: '₹',
  monthly_allowance_target: 5000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('BentoSettings Component Tests', () => {
  it('renders all 4 sections in 12-column Bento Grid architecture', () => {
    const html = renderToString(
      <BentoSettings initialProfile={mockProfile} userEmail="test@student.edu" />
    );

    // Header & Badge
    expect(html).toContain('WORKSPACE PREFERENCES · MULTI-TENANT');
    expect(html).toContain('Settings &amp; Personalization');

    // Section 1: Student Profile (col-span-5)
    expect(html).toContain('id="sectionProfile"');
    expect(html).toContain('Student Profile');
    expect(html).toContain('AR'); // Initials for Aryan
    expect(html).toContain('Sophomore · CS Major');

    // Section 2: Financial Baseline & Liquidity Engine (col-span-7)
    expect(html).toContain('id="sectionFinance"');
    expect(html).toContain('Financial Baseline &amp; Liquidity Engine');
    expect(html).toContain('Calculated Safe Pace');
    expect(html).toContain('166.67'); // 5000 / 30

    // Section 3: Workspace Atmosphere (col-span-7)
    expect(html).toContain('id="sectionAtmosphere"');
    expect(html).toContain('Workspace Atmosphere');
    expect(html).toContain('Default');
    expect(html).toContain('Crimson Dark');
    expect(html).toContain('Crimson Light');
    expect(html).toContain('System Native');

    // Section 4: Data Ownership & Vault (col-span-5)
    expect(html).toContain('id="sectionVault"');
    expect(html).toContain('Data Ownership &amp; Vault');
    expect(html).toContain('Obsidian Vault');
    expect(html).toContain('Spreadsheet Tables');
    expect(html).toContain('Full Schema Snapshot');

    // Floating save bar
    expect(html).toContain('Reset Defaults');
    expect(html).toContain('Save Changes');
  });

  it('correctly calculates safe pace when given a different allowance target', () => {
    const customProfile: Profile = {
      ...mockProfile,
      monthly_allowance_target: 9000,
      currency_symbol: '$',
    };

    const html = renderToString(
      <BentoSettings initialProfile={customProfile} userEmail="test@student.edu" />
    );

    // 9000 / 30 = 300.00
    expect(html).toContain('300.00');
    expect(html).toContain('$');
  });
});
