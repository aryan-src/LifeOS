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

  it('falls back to clean mock profile (Aryan, ₹, 0) when NODE_ENV=development and DEV_BYPASS_AUTH=true', async () => {
    (process.env as any).NODE_ENV = 'development';
    process.env.DEV_BYPASS_AUTH = 'true';

    const profile = await getUserProfile();

    expect(profile.display_name).toBe('Aryan');
    expect(profile.currency_symbol).toBe('₹');
    expect(profile.monthly_allowance_target).toBe(0);
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

    const formDataGarden = new FormData();
    formDataGarden.append('displayName', 'Student Garden');
    formDataGarden.append('currencySymbol', '₹');
    formDataGarden.append('themePreference', 'monsoon-garden');
    formDataGarden.append('monthlyAllowanceTarget', '15000');
    const resGarden = await updateProfile(null, formDataGarden);
    expect(resGarden.success).toBe(true);
    expect(resGarden.data?.theme_preference).toBe('monsoon-garden');

    const formDataNight = new FormData();
    formDataNight.append('displayName', 'Student Night');
    formDataNight.append('currencySymbol', '₹');
    formDataNight.append('themePreference', 'monsoon-night');
    formDataNight.append('monthlyAllowanceTarget', '15000');
    const resNight = await updateProfile(null, formDataNight);
    expect(resNight.success).toBe(true);
    expect(resNight.data?.theme_preference).toBe('monsoon-night');

    // Empty allowance target defaults to 0 without error
    const formDataEmptyAllowance = new FormData();
    formDataEmptyAllowance.append('displayName', 'Student Empty');
    formDataEmptyAllowance.append('currencySymbol', '₹');
    formDataEmptyAllowance.append('themePreference', 'monsoon-garden');
    formDataEmptyAllowance.append('monthlyAllowanceTarget', '');
    const resEmptyAllowance = await updateProfile(null, formDataEmptyAllowance);
    expect(resEmptyAllowance.success).toBe(true);
    expect(resEmptyAllowance.data?.monthly_allowance_target).toBe(0);

    // Omitted allowance target defaults to 0 without error
    const formDataOmittedAllowance = new FormData();
    formDataOmittedAllowance.append('displayName', 'Student Omitted');
    formDataOmittedAllowance.append('currencySymbol', '₹');
    formDataOmittedAllowance.append('themePreference', 'monsoon-garden');
    const resOmittedAllowance = await updateProfile(null, formDataOmittedAllowance);
    expect(resOmittedAllowance.success).toBe(true);
    expect(resOmittedAllowance.data?.monthly_allowance_target).toBe(0);
  });
});
