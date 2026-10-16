import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { getEffectiveUserId, SEED_USER_ID } from '@/lib/auth/user';
import { HeroLandingPage } from '@/components/landing/hero-landing-page';
import { SettingsForm } from '@/components/settings/settings-form';
import type { Profile } from '@/types/database.types';

// Mock server actions
vi.mock('@/lib/actions/profile', () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
  signOutAction: vi.fn().mockResolvedValue(undefined),
}));

const mockProfile: Profile = {
  id: SEED_USER_ID,
  display_name: 'Student',
  theme_preference: 'stone',
  currency_symbol: '₹',
  monthly_allowance_target: 15000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Public Access & Auth Removal', () => {
  it('returns SEED_USER_ID synchronously from getEffectiveUserId without Supabase auth calls', async () => {
    const userId = await getEffectiveUserId();
    expect(userId).toBe(SEED_USER_ID);
    expect(userId).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  });

  it('renders HeroLandingPage with Call-to-Action routing directly to dashboard instead of /login', () => {
    const html = renderToString(<HeroLandingPage />);

    // Must NOT contain /login
    expect(html).not.toContain('href="/login"');

    // Must route to dashboard
    expect(html).toContain('href="/?view=dashboard"');
    expect(html).toContain('Launch Workspace');
    expect(html).toContain('Launch Free Vault');
  });

  it('renders SettingsForm without Sign Out button or Google OAuth text', () => {
    const html = renderToString(
      <SettingsForm initialProfile={mockProfile} userEmail="student@lifeos.local" />
    );

    expect(html).not.toContain('Sign Out');
    expect(html).not.toContain('Google OAuth');
    expect(html).not.toContain('Account &amp; Session');
  });
});
