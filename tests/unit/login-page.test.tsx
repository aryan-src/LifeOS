import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import LoginPage from '@/app/login/page';

// Mock next/navigation
const mockSearchParamsGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock @/lib/supabase/client
const mockSignInWithOAuth = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

describe('Notion-Style Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
  });

  it('renders the Notion-style canvas with "Continue with Google" button', () => {
    const html = renderToString(<LoginPage />);

    expect(html).toContain('LifeOS');
    expect(html).toContain('Continue with Google');
    expect(html).toContain('Secured by Supabase Row-Level Security');
    expect(html).toContain('Return to home');
  });

  it('strictly contains zero email or password input forms', () => {
    const html = renderToString(<LoginPage />);

    expect(html).not.toContain('type="password"');
    expect(html).not.toContain('name="password"');
    expect(html).not.toContain('Forgot password');
    expect(html).not.toContain('Sign up with email');
    expect(html).not.toContain('Magic link');
  });

  it('renders an error alert banner when error query parameter is provided', () => {
    mockSearchParamsGet.mockImplementation((param: string) => {
      if (param === 'error') return 'auth_callback_failed';
      return null;
    });

    const html = renderToString(<LoginPage />);
    expect(html).toContain('role="alert"');
    expect(html).toContain('Authentication session expired or failed. Please try again.');
  });

  it('appends the error code only in development builds and keeps friendly text in production', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    try {
      mockSearchParamsGet.mockImplementation((param: string) => {
        if (param === 'error') return 'auth_callback_failed';
        if (param === 'reason') return 'AuthRetryableFetchError';
        return null;
      });

      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
      const devHtml = renderToString(<LoginPage />);
      expect(devHtml).toContain(
        'Authentication session expired or failed. Please try again. [AuthRetryableFetchError]'
      );

      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      const prodHtml = renderToString(<LoginPage />);
      expect(prodHtml).toContain(
        'Authentication session expired or failed. Please try again.'
      );
      expect(prodHtml).not.toContain('AuthRetryableFetchError');
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    }
  });

  it('renders a calm success notice banner when notice=account-deleted query parameter is provided', () => {
    mockSearchParamsGet.mockImplementation((param: string) => {
      if (param === 'notice') return 'account-deleted';
      return null;
    });

    const html = renderToString(<LoginPage />);
    expect(html).toContain('role="status"');
    expect(html).toContain('Your account and data were deleted.');
    expect(html).not.toContain('role="alert"');
  });
});
