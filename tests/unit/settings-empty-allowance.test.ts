import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { User } from '@supabase/supabase-js';

const mockUpsert = vi.fn();
const mockGetUser = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: () => unknown) => fn),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    from: vi.fn().mockReturnValue({
      upsert: (...args: unknown[]) => mockUpsert(...args),
    }),
  }),
}));

import { updateProfile } from '@/lib/actions/profile';

describe('Settings Form Empty Allowance Target Handling', () => {
  const originalEnv = { ...process.env };
  const mockUser = { id: 'usr-empty-allowance', email: 'student@lifeos.dev' } as User;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('saves monthly_allowance_target as 0 without error when allowance input is empty string in authenticated mode', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.DEV_BYPASS_AUTH;

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockUpsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: mockUser.id,
            display_name: 'Student',
            currency_symbol: '₹',
            theme_preference: 'monsoon-garden',
            monthly_allowance_target: 0,
            daily_focus_goal_minutes: 240,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    });

    const formData = new FormData();
    formData.append('displayName', 'Student');
    formData.append('currencySymbol', '₹');
    formData.append('themePreference', 'monsoon-garden');
    formData.append('monthlyAllowanceTarget', '');

    const res = await updateProfile(null, formData);

    expect(res.success).toBe(true);
    expect(res.data?.monthly_allowance_target).toBe(0);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUser.id,
        monthly_allowance_target: 0,
      })
    );
  });

  it('saves monthly_allowance_target as 0 without error when allowance input is omitted entirely', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.DEV_BYPASS_AUTH;

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockUpsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: mockUser.id,
            display_name: 'Student',
            currency_symbol: '₹',
            theme_preference: 'monsoon-garden',
            monthly_allowance_target: 0,
            daily_focus_goal_minutes: 240,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    });

    const formData = new FormData();
    formData.append('displayName', 'Student');
    formData.append('currencySymbol', '₹');
    formData.append('themePreference', 'monsoon-garden');
    // monthlyAllowanceTarget deliberately omitted

    const res = await updateProfile(null, formData);

    expect(res.success).toBe(true);
    expect(res.data?.monthly_allowance_target).toBe(0);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUser.id,
        monthly_allowance_target: 0,
      })
    );
  });

  it('saves monthly_allowance_target as 0 without error in dev bypass mode when input is empty string', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    process.env.DEV_BYPASS_AUTH = 'true';

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const formData = new FormData();
    formData.append('displayName', 'Student');
    formData.append('currencySymbol', '₹');
    formData.append('themePreference', 'monsoon-night');
    formData.append('monthlyAllowanceTarget', '');

    const res = await updateProfile(null, formData);

    expect(res.success).toBe(true);
    expect(res.data?.monthly_allowance_target).toBe(0);
    expect(res.data?.theme_preference).toBe('monsoon-night');
  });
});
