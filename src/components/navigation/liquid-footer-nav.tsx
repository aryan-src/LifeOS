'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Folder,
  ClipboardList,
  CheckCircle2,
  Wallet,
  FileText,
  Settings,
} from 'lucide-react';
import { LiquidNavbar, LiquidNavbarItem } from '@/components/ui/liquid-glass-navbar';
import { useTheme } from '@/lib/theme/use-theme';

export const LIQUID_NAV_ITEMS: LiquidNavbarItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    fx: 'pop',
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: <Folder className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    fx: 'pop',
  },
  {
    label: 'Assignments',
    href: '/assignments',
    icon: <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    fx: 'pop',
  },
  {
    label: 'Habits',
    href: '/habits',
    icon: <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    fx: 'pop',
  },
  {
    label: 'Expenses',
    href: '/finances',
    icon: <Wallet className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    fx: 'pop',
  },
  {
    label: 'Notes',
    href: '/notes',
    icon: <FileText className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    fx: 'pop',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />,
    fx: 'spin',
  },
];

export function getActiveNavIndex(pathname: string | null | undefined): number {
  if (!pathname) return 0;
  if (pathname === '/' || pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return 0;
  }
  if (pathname === '/projects' || pathname.startsWith('/projects/')) {
    return 1;
  }
  if (pathname === '/assignments' || pathname.startsWith('/assignments/')) {
    return 2;
  }
  if (
    pathname === '/habits' ||
    pathname.startsWith('/habits/') ||
    pathname === '/tasks' ||
    pathname.startsWith('/tasks/')
  ) {
    return 3;
  }
  if (pathname === '/finances' || pathname.startsWith('/finances/')) {
    return 4;
  }
  if (pathname === '/notes' || pathname.startsWith('/notes/')) {
    return 5;
  }
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return 6;
  }
  return 0;
}

export interface LiquidFooterNavProps {
  className?: string;
  items?: LiquidNavbarItem[];
}

export function LiquidFooterNav({
  className,
  items = LIQUID_NAV_ITEMS,
}: LiquidFooterNavProps) {
  const pathname = usePathname();
  const { isDark } = useTheme();
  const resolvedIndex = getActiveNavIndex(pathname);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear optimistic pending state when pathname updates
  useEffect(() => {
    setPendingIndex(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [pathname]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = (index: number) => {
    setPendingIndex(index);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Safety fallback: clear pending state after ~2 seconds
    timerRef.current = setTimeout(() => {
      setPendingIndex(null);
      timerRef.current = null;
    }, 2000);
  };

  const activeIndex = pendingIndex !== null ? pendingIndex : resolvedIndex;

  return (
    <footer
      className={`fixed bottom-0 inset-x-0 z-50 flex items-center justify-center border-t border-outline-variant/30 liquid-footer-strip pointer-events-auto h-[calc(64px+env(safe-area-inset-bottom,0px))] md:h-[calc(72px+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] ${className || ''}`}
      style={{
        height: 'calc(var(--app-footer-height, 64px) + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <LiquidNavbar
        items={items}
        activeIndex={activeIndex}
        onChange={handleChange}
        tone={isDark ? 'dark' : 'light'}
        compact={true}
        variant="docked"
        sound={false}
        ambient={false}
        ariaLabel="Primary"
        linkComponent={Link}
      />
    </footer>
  );
}
