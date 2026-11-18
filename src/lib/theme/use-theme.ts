'use client';

import { useState, useEffect, useCallback } from 'react';

export type LifeOSTheme =
  | 'spatial-glass'
  | 'risograph'
  | 'nordic'
  | 'tui'
  | 'tactile'
  | 'light'
  | 'dark'
  | 'crimson-dark'
  | 'crimson-light'
  | 'default'
  | 'system';

export const THEME_STORAGE_KEY = 'lifeos_theme';

export type StitchThemeMode = 'light' | 'dark' | 'system';

const DARK_THEME_ALIASES = new Set(['dark', 'tui', 'crimson-dark', 'crimson-cream']);

/**
 * Pure helper resolving whether a stored theme string should activate Tailwind's `dark` class.
 */
export function resolveDarkMode(theme: string | null | undefined, systemPrefersDark: boolean): boolean {
  if (!theme) return false;
  if (theme === 'system') return systemPrefersDark;
  return DARK_THEME_ALIASES.has(theme);
}

/**
 * Normalizes legacy theme preferences into the clean Light / Dark / System mode.
 */
export function normalizeThemeMode(theme: string | null | undefined): StitchThemeMode {
  if (!theme) return 'light';
  if (theme === 'system') return 'system';
  return DARK_THEME_ALIASES.has(theme) ? 'dark' : 'light';
}

export function applyThemeToDOM(theme: string) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const prefersDark =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  const shouldBeDark = resolveDarkMode(theme, prefersDark);

  if (shouldBeDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
}

export function saveTheme(theme: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  // Also clean up obsolete 'theme' key if present
  localStorage.removeItem('theme');
  applyThemeToDOM(theme);
  window.dispatchEvent(new CustomEvent('lifeos-theme-change', { detail: theme }));
}

export function getSavedTheme(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('theme');
}

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [isDark, setIsDark] = useState<boolean>(false);

  const syncThemeState = useCallback(() => {
    if (typeof window === 'undefined') return;
    const saved = getSavedTheme();
    const isDocDark = document.documentElement.classList.contains('dark');
    setIsDark(isDocDark);
    if (saved) {
      setCurrentTheme(saved);
    } else {
      setCurrentTheme(isDocDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    syncThemeState();

    const handleThemeChange = () => {
      syncThemeState();
    };

    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;
    const handleMediaChange = () => {
      const saved = getSavedTheme();
      if (saved === 'system') {
        applyThemeToDOM('system');
        syncThemeState();
      }
    };

    window.addEventListener('lifeos-theme-change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    mediaQuery?.addEventListener?.('change', handleMediaChange);

    return () => {
      window.removeEventListener('lifeos-theme-change', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
      mediaQuery?.removeEventListener?.('change', handleMediaChange);
    };
  }, [syncThemeState]);

  const setTheme = (newTheme: string) => {
    saveTheme(newTheme);
    syncThemeState();
  };

  const toggleLightDark = () => {
    const isDocDark = document.documentElement.classList.contains('dark');
    const newTheme = isDocDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return {
    theme: currentTheme,
    isDark,
    setTheme,
    toggleLightDark,
  };
}
