'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'signin' | 'signup' | 'magic-link';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error')
      ? searchParams.get('error') === 'auth_callback_failed'
        ? 'Authentication failed or session expired. Please try again.'
        : 'Unable to authenticate. Please try again.'
      : null
  );
  const [message, setMessage] = useState<string | null>(null);

  const redirectTo = searchParams.get('redirectTo') || searchParams.get('next') || '/dashboard';

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const supabase = createClient();
      const origin = window.location.origin;

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const supabase = createClient();
      const origin = window.location.origin;

      if (mode === 'magic-link') {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          },
        });

        if (otpError) {
          setError(otpError.message);
        } else {
          setMessage('A magic login link has been sent to your email. Check your inbox to sign in.');
        }
      } else if (mode === 'signup') {
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          },
        });

        if (signupError) {
          setError(signupError.message);
        } else if (data.session) {
          // Immediately authenticated (email confirmation disabled or auto-confirmed)
          router.push(redirectTo);
          router.refresh();
        } else {
          setMessage('Account created! Please check your email inbox to confirm your account.');
        }
      } else {
        // Sign In
        if (!password) {
          setError('Please enter your password.');
          setLoading(false);
          return;
        }

        const { data, error: signinError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signinError) {
          setError(signinError.message);
        } else if (data.session) {
          router.push(redirectTo);
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#fff8f5] dark:bg-[#121110] text-[#1e1b18] dark:text-[#f5f5f0] transition-colors selection:bg-[#2f5c3a] selection:text-white">
      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-7 h-7 rounded-md bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center text-[13px] font-mono font-medium shadow-xs">
          <span>●</span>
        </div>
        <span className="font-semibold tracking-tight text-lg text-stone-900 dark:text-stone-100">
          LifeOS
        </span>
      </Link>

      {/* Main Notion-Style Authentication Card */}
      <div className="w-full max-w-[420px] p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#181816] shadow-sm flex flex-col">
        {/* Card Title & Description */}
        <div className="text-left mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 font-sans">
            {mode === 'signup'
              ? 'Create your account'
              : mode === 'magic-link'
              ? 'Sign in with Magic Link'
              : 'Sign in to LifeOS'}
          </h1>
          <p className="mt-1 text-[13px] text-stone-500 dark:text-stone-400">
            {mode === 'signup'
              ? 'Enter your credentials to create your personal workspace.'
              : mode === 'magic-link'
              ? "We'll send an authentication link straight to your inbox."
              : 'Enter your credentials or use Single Sign-On to continue.'}
          </p>
        </div>

        {/* Tab Navigation for Auth Modes */}
        <div role="tablist" aria-label="Authentication modes" className="grid grid-cols-3 gap-1 p-1 bg-stone-100 dark:bg-stone-900 rounded-lg text-xs font-medium mb-6">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => {
              setMode('signin');
              setError(null);
              setMessage(null);
            }}
            className={`py-1.5 px-2 rounded-md transition-all text-center ${
              mode === 'signin'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => {
              setMode('signup');
              setError(null);
              setMessage(null);
            }}
            className={`py-1.5 px-2 rounded-md transition-all text-center ${
              mode === 'signup'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'magic-link'}
            onClick={() => {
              setMode('magic-link');
              setError(null);
              setMessage(null);
            }}
            className={`py-1.5 px-2 rounded-md transition-all text-center ${
              mode === 'magic-link'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Status Notifications */}
        {error && (
          <div role="alert" className="mb-4 w-full p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs font-medium text-left flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-red-600 dark:text-red-400 shrink-0 mt-0.5">
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div role="status" className="mb-4 w-full p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium text-left flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              check_circle
            </span>
            <span>{message}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          aria-label="Continue with Google"
          className="w-full py-2.5 px-3 rounded-lg border border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/80 active:bg-stone-100 text-stone-800 dark:text-stone-200 text-sm font-medium transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs mb-4"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-stone-400 border-t-stone-800 dark:border-t-stone-200 rounded-full animate-spin shrink-0" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
          <span className="bg-white dark:bg-[#181816] px-2 text-[11px] font-mono uppercase tracking-wider text-stone-400 absolute">
            or
          </span>
        </div>

        {/* Email & Password / Magic Link Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5 mt-2">
          <div>
            <label htmlFor="auth-email-input" className="block text-[12px] font-medium text-stone-700 dark:text-stone-300 mb-1">
              Email Address
            </label>
            <input
              id="auth-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-500 focus:border-stone-500 transition-colors"
            />
          </div>

          {mode !== 'magic-link' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="auth-password-input" className="block text-[12px] font-medium text-stone-700 dark:text-stone-300">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('magic-link');
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="auth-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-500 focus:border-stone-500 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-sm font-medium transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-stone-400 border-t-white dark:border-t-stone-900 rounded-full animate-spin" />
            ) : mode === 'signup' ? (
              'Create Account'
            ) : mode === 'magic-link' ? (
              'Send Magic Link'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Minimal Footer */}
        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800/80 text-center">
          <p className="text-[11px] text-stone-400 dark:text-stone-500 leading-relaxed font-sans">
            By signing in, you agree to our quiet computing principles and local data isolation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center bg-[#fff8f5] dark:bg-[#121110]">
          <div className="w-full max-w-[420px] p-8 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#181816] flex flex-col items-center justify-center min-h-[360px] animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 mb-6" />
            <div className="w-32 h-5 bg-stone-100 dark:bg-stone-800 rounded mb-2" />
            <div className="w-48 h-4 bg-stone-100 dark:bg-stone-800 rounded mb-8" />
            <div className="w-full h-10 bg-stone-100 dark:bg-stone-800 rounded-lg" />
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
