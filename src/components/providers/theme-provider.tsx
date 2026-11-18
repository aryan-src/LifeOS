'use client';

import React, { useEffect } from 'react';
import {
  applyThemeToDOM,
  getSavedTheme,
  normalizeThemeMode,
  saveTheme,
} from '@/lib/theme/use-theme';

export interface ThemeProviderProps {
  /** Theme preference loaded from the user's profile on the server (e.g. 'light' | 'dark' | 'system') */
  initialTheme?: string | null;
  children: React.ReactNode;
}

/**
 * Synchronizes Light / Dark / System theme state across localStorage, OS prefers-color-scheme,
 * and Tailwind's `.dark` class on `<html>` without flash on load.
 */
export function ThemeProvider({ initialTheme, children }: ThemeProviderProps) {
  useEffect(() => {
    const saved = getSavedTheme();
    if (saved) {
      applyThemeToDOM(saved);
    } else if (initialTheme) {
      saveTheme(normalizeThemeMode(initialTheme));
    } else {
      applyThemeToDOM('light');
    }
  }, [initialTheme]);

  return <>{children}</>;
}
