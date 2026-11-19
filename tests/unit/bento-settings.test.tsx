import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BentoSettings } from '@/components/settings/bento-settings';
import type { Profile } from '@/types/database.types';

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
  display_name: 'Maya Patel',
  theme_preference: 'dark',
  currency_symbol: '₹',
  monthly_allowance_target: 5000,
  daily_focus_goal_minutes: 240,
  timezone: 'Asia/Kolkata',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Stitch Settings Screen (BentoSettings)', () => {
  it('renders Playfair title, Light/Dark/System theme toggle, profile, budget baseline, and real exports with zero mockup artifacts', () => {
    const html = renderToString(
      <BentoSettings initialProfile={mockProfile} userEmail="maya@university.edu" />
    ).replace(/<!--.*?-->/g, '');

    expect(html).toContain('font-serif text-page-title');
    expect(html).toContain('Settings');
    expect(html).toContain('id="sectionProfile"');
    expect(html).toContain('MP');
    expect(html).toContain('maya@university.edu');
    expect(html).toContain('Asia/Kolkata');

    expect(html).toContain('id="sectionFinance"');
    expect(html).toContain('Calculated Safe Pace');
    expect(html).toContain('166.67');
    expect(html).toContain('Daily focus goal');
    expect(html).toContain('4h / day');

    expect(html).toContain('id="sectionAppearance"');
    expect(html).toContain('data-purpose="theme-mode-selector"');
    expect(html).toContain('Light');
    expect(html).toContain('Dark');
    expect(html).toContain('System');

    expect(html).toContain('id="sectionData"');
    expect(html).toContain('Notes Markdown Archive');
    expect(html).toContain('Spreadsheet Tables');
    expect(html).toContain('Full Account Snapshot');
    expect(html).toContain('Save Changes');

    // Mockup-only items must be strictly absent
    expect(html).not.toContain('v2.4.0');
    expect(html).not.toContain('Cloud Node #4');
    expect(html).not.toContain('Kyoto Rain');
    expect(html).not.toContain('Delete account');
    expect(html).not.toContain('Sophomore · CS Major');
    expect(html).not.toContain('italic');
  });

  it('recomputes safe daily pace when allowance target and currency change', () => {
    const customProfile: Profile = {
      ...mockProfile,
      monthly_allowance_target: 9000,
      currency_symbol: '$',
    };

    const html = renderToString(
      <BentoSettings initialProfile={customProfile} userEmail="maya@university.edu" />
    ).replace(/<!--.*?-->/g, '');

    expect(html).toContain('$300.00 / day');
  });
});
