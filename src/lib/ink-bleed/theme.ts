import type { Theme } from './gl/params';

export type { Theme };

export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  const root = document.documentElement;
  return root.classList.contains('dark') || root.dataset.theme === 'crimson-dark' || root.dataset.theme === 'dark'
    ? 'dark'
    : 'light';
}

export function otherTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

/** Instantly applies a theme to the live DOM and keeps the toggle's ARIA state in sync. */
export function applyTheme(theme: Theme, toggle?: HTMLButtonElement | null): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.dataset.theme = 'crimson-dark';
  } else {
    root.classList.remove('dark');
    root.dataset.theme = 'nordic';
  }
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }
}
