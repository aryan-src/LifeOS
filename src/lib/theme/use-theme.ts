'use client';

import { useState, useEffect, useCallback } from 'react';

export type LifeOSTheme = 'light' | 'dark' | 'crimson-dark' | 'crimson-light' | 'default' | 'system';

export const THEME_STORAGE_KEY = 'lifeos_theme';

export function applyThemeToDOM(theme: string) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (theme === 'crimson-dark' || theme === 'crimson-cream') {
    root.setAttribute('data-theme', 'crimson-dark');
    root.classList.add('dark');
  } else if (theme === 'crimson-light') {
    root.setAttribute('data-theme', 'crimson-light');
    root.classList.remove('dark');
  } else if (theme === 'system') {
    root.setAttribute('data-theme', 'system');
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } else if (theme === 'dark') {
    root.removeAttribute('data-theme');
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.removeAttribute('data-theme');
    root.classList.remove('dark');
  } else {
    // Default / Notion warm paper
    root.setAttribute('data-theme', 'default');
    root.classList.remove('dark');
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
