'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme/use-theme';

export interface SidebarThemeToggleProps {
  isCollapsed?: boolean;
}

export function SidebarThemeToggle({ isCollapsed = false }: SidebarThemeToggleProps) {
  const { isDark, toggleLightDark } = useTheme();

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={toggleLightDark}
        className="size-10 rounded-xl bg-neutral-200/60 hover:bg-neutral-200 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer box-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun className="size-4 text-neutral-700 dark:text-neutral-200" />
        ) : (
          <Moon className="size-4 text-neutral-700 dark:text-neutral-200" />
        )}
      </button>
    );
  }

  return (
    <div
      onClick={toggleLightDark}
      className="flex items-center justify-between p-2 rounded-xl bg-neutral-200/40 hover:bg-neutral-200/80 dark:bg-neutral-800/40 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleLightDark();
        }
      }}
      aria-label="Toggle theme mode"
    >
      <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
        {isDark ? (
          <Moon className="size-4" />
        ) : (
          <Sun className="size-4" />
        )}
        <span className="text-xs font-medium">Dark Mode</span>
      </div>
      <div
        className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
          isDark
            ? 'bg-neutral-800 dark:bg-neutral-200 justify-end'
            : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
        }`}
      >
        <div className="w-3 h-3 rounded-full bg-white dark:bg-neutral-900 shadow-xs" />
      </div>
    </div>
  );
}
