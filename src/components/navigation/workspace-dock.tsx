'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function WorkspaceDock({ className = '' }: { className?: string }) {
  const currentPath = usePathname() || '';

  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      isActive: currentPath === '/' || currentPath === '/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect height="7" rx="1.5" strokeWidth="2" width="7" x="3" y="3" />
          <rect height="7" rx="1.5" strokeWidth="2" width="7" x="14" y="3" />
          <rect height="7" rx="1.5" strokeWidth="2" width="7" x="14" y="14" />
          <rect height="7" rx="1.5" strokeWidth="2" width="7" x="3" y="14" />
        </svg>
      ),
    },
    {
      title: 'Projects',
      href: '/projects',
      isActive: currentPath.startsWith('/projects'),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      title: 'Tasks',
      href: '/tasks',
      isActive: currentPath.startsWith('/tasks'),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      title: 'Habits',
      href: '/habits',
      isActive: currentPath.startsWith('/habits'),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
          <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      ),
    },
  ];

  const secondaryNavItems = [
    {
      title: 'Finances',
      href: '/finances',
      isActive: currentPath.startsWith('/finances'),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect height="14" rx="2" strokeWidth="1.8" width="20" x="2" y="5" />
          <line strokeWidth="1.8" x1="2" x2="22" y1="10" y2="10" />
        </svg>
      ),
    },
    {
      title: 'Notes',
      href: '/notes',
      isActive: currentPath.startsWith('/notes'),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      title: 'Settings',
      href: '/settings',
      isActive: currentPath.startsWith('/settings'),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto ${className}`}
      data-purpose="bottom-dock-strip"
    >
      <nav className="flex items-center justify-center gap-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-5 py-2 rounded-full border border-stone-200/80 dark:border-zinc-800 shadow-md transition-colors">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`p-1.5 rounded-full transition-colors relative group ${
              item.isActive
                ? 'text-stone-900 dark:text-zinc-100 bg-stone-100 dark:bg-zinc-800'
                : 'text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
            }`}
            title={item.title}
          >
            {item.icon}
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-900 dark:bg-zinc-100 text-stone-100 dark:text-stone-900 text-[9px] font-mono py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {item.title}
            </span>
          </Link>
        ))}

        <div className="h-3.5 w-px bg-stone-200 dark:bg-zinc-800 mx-1" />

        {secondaryNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`p-1.5 rounded-full transition-colors relative group ${
              item.isActive
                ? 'text-stone-900 dark:text-zinc-100 bg-stone-100 dark:bg-zinc-800'
                : 'text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
            }`}
            title={item.title}
          >
            {item.icon}
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-900 dark:bg-zinc-100 text-stone-100 dark:text-stone-900 text-[9px] font-mono py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {item.title}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
