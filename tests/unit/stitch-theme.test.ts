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
    expect(resolveDarkMode('monsoon-garden', true)).toBe(false);
    expect(resolveDarkMode('monsoon', true)).toBe(false);
    expect(resolveDarkMode('monsoon-night', false)).toBe(true);
    expect(resolveDarkMode(null, true)).toBe(false);
  });

  it('normalizes legacy theme values into light, dark, system, or monsoon-garden', () => {
    expect(normalizeThemeMode('light')).toBe('light');
    expect(normalizeThemeMode('nordic')).toBe('light');
    expect(normalizeThemeMode('stone')).toBe('light');
    expect(normalizeThemeMode('dark')).toBe('dark');
    expect(normalizeThemeMode('tui')).toBe('dark');
    expect(normalizeThemeMode('crimson-dark')).toBe('dark');
    expect(normalizeThemeMode('system')).toBe('system');
    expect(normalizeThemeMode('monsoon-garden')).toBe('monsoon-garden');
    expect(normalizeThemeMode('monsoon-night')).toBe('monsoon-night');
    expect(normalizeThemeMode('monsoon')).toBe('monsoon-garden');
    expect(normalizeThemeMode(undefined)).toBe('monsoon-garden');
    expect(normalizeThemeMode(null)).toBe('monsoon-garden');
  });
});
