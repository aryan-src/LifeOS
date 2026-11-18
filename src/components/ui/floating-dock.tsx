'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Folder,
  ClipboardList,
  CheckCircle2,
  Wallet,
  FileText,
  Settings,
} from 'lucide-react';

export interface DockItem {
  title: string;
  icon: React.ReactNode;
  href: string;
}

export const DEFAULT_DOCK_ITEMS: DockItem[] = [
  {
    title: 'Dashboard',
    icon: <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    href: '/dashboard',
  },
  {
    title: 'Projects',
    icon: <Folder className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    href: '/projects',
  },
  {
    title: 'Assignments',
    icon: <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    href: '/assignments',
  },
  {
    title: 'Habits',
    icon: <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    href: '/habits',
  },
  {
    title: 'Expenses',
    icon: <Wallet className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    href: '/finances',
  },
  {
    title: 'Notes',
    icon: <FileText className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    href: '/notes',
  },
  {
    title: 'Settings',
    icon: <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    href: '/settings',
  },
];

export function isDockRouteActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  if (href === '/' || href === '/dashboard') {
    return pathname === '/' || pathname === '/dashboard';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface FloatingDockProps {
  items?: DockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
  className?: string;
}

/**
 * Shared Stitch 7-icon floating pill navigation dock.
 * Responsive across desktop and mobile without horizontal page overflow.
 */
export function FloatingDock({
  items = DEFAULT_DOCK_ITEMS,
  desktopClassName,
  className,
}: FloatingDockProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary workspace navigation"
      data-purpose="floating-dock-pill"
      className={cn(
        'pointer-events-auto inline-flex max-w-[calc(100vw-1.5rem)] items-center gap-1 sm:gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest/95 px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-md overflow-x-auto no-scrollbar',
        desktopClassName || className
      )}
    >
      {items.map((item) => {
        const targetHref = item.href === '/' ? '/dashboard' : item.href;
        const isActive = isDockRouteActive(pathname, item.href);

        return (
          <Link
            key={item.title}
            href={targetHref}
            prefetch={true}
            aria-label={item.title}
            aria-current={isActive ? 'page' : undefined}
            title={item.title}
            className={cn(
              'group relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50',
              isActive
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            )}
          >
            {item.icon}
            <span
              className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-outline-variant/40 bg-surface-container-lowest px-2 py-0.5 font-mono text-[11px] font-medium text-on-surface opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block"
              aria-hidden="true"
            >
              {item.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
