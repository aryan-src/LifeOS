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

export function applyThemeToDOM(theme: string) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (theme === 'spatial-glass') {
    root.setAttribute('data-theme', 'spatial-glass');
  } else if (theme === 'risograph') {
    root.setAttribute('data-theme', 'risograph');
  } else if (theme === 'nordic' || theme === 'default' || theme === 'stone') {
    root.setAttribute('data-theme', 'nordic');
    root.classList.remove('dark');
  } else if (theme === 'tui') {
    root.setAttribute('data-theme', 'tui');
    root.classList.add('dark');
  } else if (theme === 'tactile') {
    root.setAttribute('data-theme', 'tactile');
    root.classList.remove('dark');
  } else if (theme === 'crimson-dark' || theme === 'crimson-cream') {
    root.setAttribute('data-theme', 'risograph');
    root.classList.add('dark');
  } else if (theme === 'crimson-light') {
    root.setAttribute('data-theme', 'risograph');
    root.classList.remove('dark');
  } else if (theme === 'system') {
    root.setAttribute('data-theme', 'nordic');
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } else if (theme === 'dark') {
    root.setAttribute('data-theme', 'tui');
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'nordic');
    root.classList.remove('dark');
  } else {
    root.setAttribute('data-theme', theme);
  }
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

    window.addEventListener('lifeos-theme-change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    return () => {
      window.removeEventListener('lifeos-theme-change', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
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
