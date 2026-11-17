import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error('No active session'),
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

import { getUserProfile, updateProfile } from '@/lib/actions/profile';

describe('Dev Bypass Profile Fallback', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('falls back to mock profile (Aryan, ₹, 15000) when NODE_ENV=development and DEV_BYPASS_AUTH=true', async () => {
    (process.env as any).NODE_ENV = 'development';
    process.env.DEV_BYPASS_AUTH = 'true';

    const profile = await getUserProfile();

    expect(profile.display_name).toBe('Aryan');
    expect(profile.currency_symbol).toBe('₹');
    expect(profile.monthly_allowance_target).toBe(15000);
    expect(profile.id).toBe('dev-local-user');
  });

  it('falls back to standard unauthenticated profile when not in dev bypass mode', async () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.DEV_BYPASS_AUTH;

    const profile = await getUserProfile();

    expect(profile.display_name).toBe('Student');
    expect(profile.id).toBe('unauthenticated');
  });

  it('updateProfile succeeds with dev profile in development when DEV_BYPASS_AUTH=true and unauthenticated', async () => {
    (process.env as any).NODE_ENV = 'development';
    process.env.DEV_BYPASS_AUTH = 'true';

    const formData = new FormData();
    formData.append('displayName', 'Aryan Test');
    formData.append('currencySymbol', '₹');
    formData.append('themePreference', 'tui');
    formData.append('monthlyAllowanceTarget', '20000');

    const res = await updateProfile(null, formData);

    expect(res.success).toBe(true);
    expect(res.data?.display_name).toBe('Aryan Test');
    expect(res.data?.theme_preference).toBe('tui');
    expect(res.data?.monthly_allowance_target).toBe(20000);
  });
});
