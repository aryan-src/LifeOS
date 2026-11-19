'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Search, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { useTheme } from '@/lib/theme/use-theme';
import { useRadialThemeTransition } from '@/hooks/use-radial-theme-transition';

export interface WorkspaceHeaderProps {
  displayName?: string | null;
  avatarUrl?: string | null;
  className?: string;
  isDockVisible?: boolean;
  onToggleDock?: () => void;
}

const ROUTE_LABELS: Array<{ prefix: string; label: string }> = [
  { prefix: '/tasks', label: 'Tasks' },
  { prefix: '/finances', label: 'Expenses' },
  { prefix: '/notes', label: 'Notes' },
  { prefix: '/habits', label: 'Habits' },
  { prefix: '/projects', label: 'Projects' },
  { prefix: '/assignments', label: 'Assignments' },
  { prefix: '/focus', label: 'Focus History' },
  { prefix: '/settings', label: 'Settings' },
  { prefix: '/changelog', label: 'Changelog' },
];

export function WorkspaceHeader({
  displayName,
  avatarUrl,
  className = '',
  isDockVisible: isDockVisibleProp,
  onToggleDock: onToggleDockProp,
}: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>(displayName?.trim() || '');
  const storeIsDockVisible = useUIStore((state) => state.isDockVisible);
  const storeToggleDock = useUIStore((state) => state.toggleDock);

  const isDockVisible = isDockVisibleProp !== undefined ? isDockVisibleProp : storeIsDockVisible;
  const toggleDock = onToggleDockProp || storeToggleDock;

  const { isDark, setTheme } = useTheme();
  const { triggerThemeTransition } = useRadialThemeTransition();

  useEffect(() => {
    if (displayName && displayName.trim()) {
      setUserName(displayName.trim());
      return;
    }
    try {
      const stored = localStorage.getItem('lifeos_display_name');
      if (stored && stored.trim()) setUserName(stored.trim());
    } catch {
      // ignore storage errors
    }
  }, [displayName]);

  // Keyboard shortcut: Cmd/Ctrl + B to toggle dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        toggleDock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDock]);

  const isLandingPage = useUIStore((state) => state.isLandingPage);

  if (isLandingPage || pathname?.startsWith('/login') || pathname?.startsWith('/auth')) {
    return null;
  }

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-quick-capture'));
  };

  const currentRouteLabel =
    pathname && pathname !== '/' && pathname !== '/dashboard'
      ? ROUTE_LABELS.find((entry) => pathname.startsWith(entry.prefix))?.label ?? null
      : null;

  const resolvedLabel = userName || 'Account';
  const initial = (userName[0] || 'U').toUpperCase();

  return (
    <header
      className={`sticky top-0 z-40 h-12 w-full shrink-0 border-b border-outline-variant/40 bg-surface/85 backdrop-blur-md transition-colors ${className}`}
      data-purpose="global-workspace-header"
    >
      <div className="flex h-full w-full items-center justify-between gap-3 px-4">
        {/* Left: Dock toggle, LifeOS brand mark, subtle route crumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={toggleDock}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
            aria-label={isDockVisible ? 'Hide dock navigation' : 'Show dock navigation'}
            title={isDockVisible ? 'Hide Dock (⌘B)' : 'Show Dock (⌘B)'}
          >
            <div className="flex h-3.5 w-4 flex-col items-center justify-between py-0.5" aria-hidden="true">
              <span
                className={`h-0.5 w-4 rounded-full bg-current transition-all duration-200 ${
                  !isDockVisible ? 'w-2.5 -translate-x-0.5 opacity-60' : ''
                }`}
              />
              <span className="h-0.5 w-4 rounded-full bg-current transition-all duration-200" />
              <span
                className={`h-0.5 w-4 rounded-full bg-current transition-all duration-200 ${
                  !isDockVisible ? 'w-3 -translate-x-0.5 opacity-80' : ''
                }`}
              />
            </div>
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
          >
            <span className="font-sans text-headline-md font-semibold tracking-tight text-on-surface">
              LifeOS
            </span>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-secondary"
              aria-hidden="true"
            />
          </Link>

          {currentRouteLabel && (
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="font-mono text-label-sm text-outline">/</span>
              <span className="truncate font-mono text-label-sm text-on-surface-variant">
                {currentRouteLabel}
              </span>
            </div>
          )}
        </div>

        {/* Center: Global Search Omnibar Trigger */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={handleOpenSearch}
            className="flex w-full items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-left text-body-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" aria-hidden="true" />
              <span className="truncate text-body-sm">Search workspace or commands...</span>
            </span>
            <kbd className="ml-2 shrink-0 rounded-md border border-outline-variant/40 bg-surface-container px-1.5 py-0.5 font-mono text-label-sm text-on-surface-variant">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Utility Navigation, Theme Switcher & Account */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenSearch}
            aria-label="Open command search"
            title="Search (⌘K)"
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>

          <Link
            href="/focus"
            aria-label="Focus History"
            title="Focus History"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
              pathname?.startsWith('/focus')
                ? 'bg-surface-container-high text-on-surface'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Link
            href="/tasks"
            aria-label="Schedule & Tasks"
            title="Schedule & Tasks"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
              pathname?.startsWith('/tasks')
                ? 'bg-surface-container-high text-on-surface'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={(e) => {
              const nextTheme = isDark ? 'light' : 'dark';
              triggerThemeTransition(e, nextTheme, setTheme);
            }}
            className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/40 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            suppressHydrationWarning
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, scale: 0.7, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <Sun className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <div className="mx-0.5 hidden h-4 w-px bg-outline-variant/50 sm:block" aria-hidden="true" />

          <Link
            href="/settings"
            className="group flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-1.5 transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
            title="Settings & Account"
            aria-label={`Account settings for ${resolvedLabel}`}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full object-cover border border-outline-variant/40"
              />
            ) : (
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-label-sm font-medium transition-colors ${
                  pathname?.startsWith('/settings')
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-primary text-on-primary'
                }`}
              >
                {initial}
              </div>
            )}
            {userName && (
              <span className="hidden md:inline-block max-w-[120px] truncate font-sans text-label-md font-medium text-on-surface">
                {userName.split(' ')[0]}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
