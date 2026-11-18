import { describe, it, expect } from 'vitest';
import {
  normalizeThemeMode,
  resolveDarkMode,
} from '@/lib/theme/use-theme';

describe('Stitch Theme Resolution & Normalization', () => {
  it('resolves dark mode strictly for dark aliases and system preference', () => {
    expect(resolveDarkMode('light', true)).toBe(false);
    expect(resolveDarkMode('nordic', true)).toBe(false);
    expect(resolveDarkMode('stone', true)).toBe(false);
    expect(resolveDarkMode('dark', false)).toBe(true);
    expect(resolveDarkMode('tui', false)).toBe(true);
    expect(resolveDarkMode('crimson-dark', false)).toBe(true);
    expect(resolveDarkMode('system', true)).toBe(true);
    expect(resolveDarkMode('system', false)).toBe(false);
    expect(resolveDarkMode(null, true)).toBe(false);
  });

  it('normalizes legacy theme values into light, dark, or system', () => {
    expect(normalizeThemeMode('light')).toBe('light');
    expect(normalizeThemeMode('nordic')).toBe('light');
    expect(normalizeThemeMode('stone')).toBe('light');
    expect(normalizeThemeMode('dark')).toBe('dark');
    expect(normalizeThemeMode('tui')).toBe('dark');
    expect(normalizeThemeMode('crimson-dark')).toBe('dark');
    expect(normalizeThemeMode('system')).toBe('system');
    expect(normalizeThemeMode(undefined)).toBe('light');
  });
});
