'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface WorkspaceHeaderProps {
  displayName?: string;
  className?: string;
}

export function WorkspaceHeader({
  displayName = 'Aryan',
  className = '',
}: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState(displayName);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lifeos_display_name');
      if (stored) setUserName(stored);
    } catch {}
  }, []);

  // Suppress on standalone auth/login routes
  if (pathname?.startsWith('/login') || pathname?.startsWith('/auth')) {
    return null;
  }

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-quick-capture'));
  };

  // Dynamic route label for clean editorial breadcrumb
  const getRouteLabel = (path: string) => {
    if (!path || path === '/' || path === '/dashboard') return null;
    if (path.startsWith('/tasks')) return 'Tasks';
    if (path.startsWith('/finances')) return 'Finances';
    if (path.startsWith('/notes')) return 'Notes';
    if (path.startsWith('/habits')) return 'Habits';
    if (path.startsWith('/projects')) return 'Projects';
    if (path.startsWith('/assignments')) return 'Assignments';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/changelog')) return 'Changelog';
    return null;
  };

  const currentRouteLabel = getRouteLabel(pathname || '');
  const initial = (userName[0] || displayName[0] || 'A').toUpperCase();

  return (
    <header
      className={`sticky top-0 z-30 w-full bg-[#FAF9F5]/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-stone-200/60 dark:border-zinc-800/60 shrink-0 h-[48px] transition-colors ${className}`}
      data-purpose="global-workspace-header"
    >
      <div className="max-w-[1400px] h-full mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand Logo & Dynamic Route Breadcrumb */}
        <div className="flex items-center space-x-2.5">
          <Link
            href="/"
            className="flex items-center text-stone-900 dark:text-zinc-100 font-medium tracking-tight whitespace-nowrap hover:opacity-85 transition-opacity"
          >
            <span className="text-xl font-bold font-serif tracking-tight text-stone-950 dark:text-zinc-50 whitespace-nowrap inline-flex items-center">
              Life<span className="text-stone-400 dark:text-zinc-500 font-light italic">OS</span>
            </span>
          </Link>
          {currentRouteLabel && (
            <>
              <span className="text-stone-300 dark:text-zinc-700 font-mono text-xs">/</span>
              <span className="text-xs font-mono font-medium text-stone-600 dark:text-zinc-400">
                {currentRouteLabel}
              </span>
            </>
          )}
        </div>

        {/* Center: Quick Search Command Bar (Global Omnibar Trigger) */}
        <div className="w-80 hidden md:block">
          <button
            type="button"
            onClick={handleOpenSearch}
            className="w-full text-left bg-stone-100/70 dark:bg-zinc-900/60 hover:bg-stone-100 dark:hover:bg-zinc-900 border border-stone-200/60 dark:border-zinc-800/60 px-3 py-1 rounded-lg flex items-center justify-between text-xs text-stone-400 dark:text-zinc-500 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span className="text-[11px]">Search workspace or commands...</span>
            </span>
            <kbd className="font-mono text-[10px] bg-stone-50 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60 rounded px-1.5 py-0.2 text-stone-500 dark:text-zinc-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Utility Icons, Schedule & Profile */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 text-stone-500 dark:text-zinc-400">
          <Link
            href="/tasks"
            className={`p-1.5 rounded-md transition-colors ${
              pathname?.startsWith('/tasks')
                ? 'bg-stone-200/70 dark:bg-zinc-800 text-stone-900 dark:text-zinc-100'
                : 'hover:bg-stone-100 dark:hover:bg-zinc-800/60 text-stone-600 dark:text-zinc-400'
            }`}
            title="Schedule & Tasks"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect height="18" rx="2" strokeWidth="1.8" width="18" x="3" y="4" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </Link>
          <button
            type="button"
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800/60 rounded-md transition-colors text-stone-600 dark:text-zinc-400 relative"
            title="Notifications"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 absolute top-1 right-1" />
          </button>
          <div className="h-4 w-px bg-stone-200/60 dark:border-zinc-800/60 mx-1" />
          <Link
            href="/settings"
            className="flex items-center space-x-2 pl-1 cursor-pointer group whitespace-nowrap"
            title="Workspace Settings"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-medium text-xs tracking-wider transition-colors ${
                pathname?.startsWith('/settings')
                  ? 'bg-emerald-700 text-white dark:bg-emerald-600'
                  : 'bg-stone-900 dark:bg-zinc-100 text-stone-50 dark:text-zinc-900 group-hover:bg-stone-800'
              }`}
            >
              {initial}
            </div>
            <span className="text-xs font-medium text-stone-700 dark:text-zinc-300 group-hover:text-stone-900 dark:group-hover:text-zinc-100 transition-colors hidden sm:inline">
              {userName}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
