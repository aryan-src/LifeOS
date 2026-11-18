import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockExchangeCodeForSession = vi.fn();
const mockCookieSet = vi.fn();
const mockCookieGetAll = vi.fn();
const mockServerAuthGetUser = vi.fn();
const mockProfileMaybeSingle = vi.fn();
const mockProfileUpsert = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => mockCookieGetAll(),
    set: (...args: unknown[]) => mockCookieSet(...args),
  }),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(
    (
      _url: string,
      _key: string,
      options: {
        cookies: {
          setAll: (
            items: Array<{ name: string; value: string; options?: Record<string, unknown> }>
          ) => void;
        };
      }
    ) => ({
      auth: {
        exchangeCodeForSession: async (code: string) => {
          const res = await mockExchangeCodeForSession(code);
          if (!res.error) {
            options.cookies.setAll([
              {
                name: 'sb-test-auth-token',
                value: 'session-jwt-value',
                options: { path: '/', httpOnly: true, sameSite: 'lax' },
              },
            ]);
          }
          return res;
        },
      },
    })
  ),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => mockServerAuthGetUser(...args),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: (...args: unknown[]) => mockProfileMaybeSingle(...args),
        })),
      })),
      upsert: (...args: unknown[]) => mockProfileUpsert(...args),
    })),
  }),
}));

import { GET as authCallbackGet } from '@/app/auth/callback/route';
import { getUserProfile } from '@/lib/actions/profile';

describe('Google OAuth End-to-End Flow', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://eaawdzqfnwuokfjdyvpq.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-placeholder';
    mockCookieGetAll.mockReturnValue([]);
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockProfileMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockProfileUpsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('keeps localhost callback on http://localhost:3000 even when NEXT_PUBLIC_SITE_URL points to Vercel', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://lifeosstudents.vercel.app';

    const req = new NextRequest(
      'http://localhost:3000/auth/callback?code=google-auth-code'
    );
    const res = await authCallbackGet(req);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('google-auth-code');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    expect(res.cookies.get('sb-test-auth-token')?.value).toBe('session-jwt-value');
  });

  it('honors and clears lifeos_oauth_next cookie when callback URL has no query params', async () => {
    mockCookieGetAll.mockReturnValueOnce([
      { name: 'lifeos_oauth_next', value: '%2Ftasks' },
    ]);

    const req = new NextRequest('http://localhost:3000/auth/callback?code=cookie-code');
    const res = await authCallbackGet(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/tasks');
    expect(res.cookies.get('lifeos_oauth_next')?.value).toBe('');
  });

  it('redirects on Vercel active origin using x-forwarded-host and preserves validated next path', async () => {
    const req = new NextRequest(
      'https://internal.vercel.local/auth/callback?code=vercel-code&next=%2Ftasks',
      {
        headers: {
          'x-forwarded-host': 'lifeosstudents.vercel.app',
          'x-forwarded-proto': 'https',
        },
      }
    );
    const res = await authCallbackGet(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://lifeosstudents.vercel.app/tasks');
    expect(res.cookies.get('sb-test-auth-token')?.value).toBe('session-jwt-value');
  });

  it('blocks open-redirect payloads in next param and falls back to /dashboard', async () => {
    const req = new NextRequest(
      'http://localhost:3000/auth/callback?code=valid-code&next=%2F%2Fevil.example.com'
    );
    const res = await authCallbackGet(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });

  it('forwards OAuth cancellation (access_denied) cleanly to /login on active origin', async () => {
    const req = new NextRequest(
      'http://localhost:3000/auth/callback?error=access_denied&error_description=User%20cancelled'
    );
    const res = await authCallbackGet(req);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/login?error=access_denied&error_description=User+cancelled'
    );
  });

  it('logs safe error metadata on exchange failure without leaking code or keys, and appends reason only in dev', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const authErr = Object.assign(new Error('fetch failed'), {
      name: 'AuthRetryableFetchError',
      code: 'bad_oauth_state',
    });
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: authErr });

    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    const req = new NextRequest(
      'http://localhost:3000/auth/callback?code=secret-oauth-code-xyz'
    );
    const res = await authCallbackGet(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/login?error=auth_callback_failed&reason=bad_oauth_state'
    );
    expect(errorSpy).toHaveBeenCalledWith(
      '[AuthCallback] exchangeCodeForSession failed:',
      expect.objectContaining({
        code: 'bad_oauth_state',
        name: 'AuthRetryableFetchError',
        message: 'fetch failed',
        error: null,
        error_description: null,
      })
    );
    const serializedLog = JSON.stringify(errorSpy.mock.calls);
    expect(serializedLog).not.toContain('secret-oauth-code-xyz');
    expect(serializedLog).not.toContain('anon-key-placeholder');

    // Production omits reason from redirect URL
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: authErr });
    const prodRes = await authCallbackGet(
      new NextRequest('http://localhost:3000/auth/callback?code=secret-oauth-code-2')
    );
    expect(prodRes.headers.get('location')).toBe(
      'http://localhost:3000/login?error=auth_callback_failed'
    );
  });

  it('provisions a first-time Google OAuth user cleanly in getUserProfile without crashing', async () => {
    mockServerAuthGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: '11111111-1111-4111-8111-111111111111',
          email: 'aryan@example.com',
          user_metadata: {
            full_name: 'Aryan Prajapati',
            picture: 'https://lh3.googleusercontent.com/a/avatar',
          },
        },
      },
      error: null,
    });

    const profile = await getUserProfile();

    expect(profile.id).toBe('11111111-1111-4111-8111-111111111111');
    expect(profile.display_name).toBe('Aryan Prajapati');
    expect(profile.avatar_url).toBe('https://lh3.googleusercontent.com/a/avatar');
    expect(mockProfileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '11111111-1111-4111-8111-111111111111',
        display_name: 'Aryan Prajapati',
        avatar_url: 'https://lh3.googleusercontent.com/a/avatar',
      }),
      { onConflict: 'id', ignoreDuplicates: true }
    );
  });
});
