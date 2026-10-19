'use client';

import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Kanban,
  CheckSquare,
  CheckCircle2,
  GraduationCap,
  Wallet,
  FileText,
  Settings,
  Plus,
  PanelLeft,
} from 'lucide-react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { useIsMac } from '@/hooks/use-is-mac';
import {
  type NavItemConfig,
  calculateDockScale,
  DockNavLane,
} from './sidebar-nav-item';
import { SidebarThemeToggle } from './sidebar-theme-toggle';
import { SidebarUserFooter } from './sidebar-user-footer';

export { calculateDockScale };
export type { NavItemConfig };

export const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: Kanban },
  { label: 'Daily Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Habits', href: '/habits', icon: CheckCircle2 },
  { label: 'Assignments', href: '/assignments', icon: GraduationCap },
  { label: 'Finances', href: '/finances', icon: Wallet },
  { label: 'Ideas & Notes', href: '/notes', icon: FileText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export interface MacOSSidebarProps {
  items?: (NavItemConfig | string)[];
  initialSelectedIndex?: number;
  initialCollapsed?: boolean;
  onSelect?: (index: number) => void;
  className?: string;
  children?: ReactNode;
}

export function MacOSSidebar({
  items = DEFAULT_NAV_ITEMS,
  initialSelectedIndex = 0,
  initialCollapsed,
  onSelect,
  className = '',
  children,
}: MacOSSidebarProps) {
  const pathname = usePathname();
  const isMac = useIsMac();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    openQuickCapture,
    isMobileMenuOpen,
    closeMobileMenu,
  } = useUIStore();

  const [isOpen, setIsOpen] = useState(!isSidebarCollapsed);

  useEffect(() => {
    setIsOpen(!isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (isSidebarCollapsed === next) {
      toggleSidebar();
    }
  };

  // Resolve strings to NavItemConfig objects
  const resolvedItems: NavItemConfig[] = useMemo(() => {
    return items.map((item) => {
      if (typeof item === 'string') {
        const found = DEFAULT_NAV_ITEMS.find(
          (d) => d.label.toLowerCase() === item.toLowerCase()
        );
        if (found) return found;
        return {
          label: item,
          href: item === 'Dashboard' ? '/dashboard' : `/${item.toLowerCase().replace(/\s+/g, '-')}`,
          icon: LayoutDashboard,
        };
      }
      return item;
    });
  }, [items]);

  // Sync selectedIndex with current pathname
  const activeRouteIndex = useMemo(() => {
    const index = resolvedItems.findIndex((item) => {
      if (item.href === '/dashboard' || item.href === '/') {
        return pathname === '/dashboard' || pathname === '/';
      }
      return pathname === item.href || pathname.startsWith(item.href + '/');
    });
    return index >= 0 ? index : initialSelectedIndex;
  }, [pathname, resolvedItems, initialSelectedIndex]);

  const [selectedIndex, setSelectedIndex] = useState<number>(activeRouteIndex);

  useEffect(() => {
    setSelectedIndex(activeRouteIndex);
  }, [activeRouteIndex]);

  const renderSidebarContent = (isMobile = false) => {
    const effectivelyOpen = isMobile ? true : isOpen;

    return (
      <div className="w-full h-full box-border flex flex-col justify-between overflow-x-hidden">
        {/* Top Header & Navigation Section */}
        <div className="w-full flex flex-col box-border">
          {/* Top Header / Actions Area */}
          <div
            className={`flex items-center w-full ${
              effectivelyOpen
                ? 'justify-between gap-2'
                : 'flex-col justify-center gap-2.5'
            } text-stone-700 dark:text-stone-300 p-1 shrink-0 box-border`}
          >
            {effectivelyOpen ? (
              <>
                {/* Brand & App Title */}
                <Link
                  href="/dashboard"
                  prefetch={true}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 min-w-0 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-md p-0.5"
                >
                  <div className="w-6 h-6 rounded-md bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    L
                  </div>
                  <span className="font-semibold text-sm tracking-tight text-stone-900 dark:text-stone-100 truncate group-hover:opacity-80 transition-opacity">
                    LifeOS
                  </span>
                </Link>

                {/* Action Buttons: Quick Capture (+) & Collapse Toggle */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      openQuickCapture();
                    }}
                    title={`Quick Capture (${isMac ? '⌘K' : 'Ctrl+K'})`}
                    aria-label={`Quick Capture (${isMac ? '⌘K' : 'Ctrl+K'})`}
                    className="p-1 rounded-md text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                  >
                    <Plus className="size-5" />
                  </button>
                  <motion.button
                    layout
                    type="button"
                    onClick={handleToggle}
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                    className="p-1 rounded-md text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                  >
                    <PanelLeft className="size-5" />
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                {/* Collapsed Controls */}
                <button
                  type="button"
                  onClick={handleToggle}
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                  className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                >
                  <PanelLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    openQuickCapture();
                  }}
                  title={`Quick Capture (${isMac ? '⌘K' : 'Ctrl+K'})`}
                  aria-label={`Quick Capture (${isMac ? '⌘K' : 'Ctrl+K'})`}
                  className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-amber-900/5 dark:hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                >
                  <Plus className="size-5" />
                </button>
              </>
            )}
          </div>

          {/* Dock Navigation Items */}
          <AnimatePresence mode="wait">
            <DockNavLane
              key={effectivelyOpen ? 'expanded-dock' : 'collapsed-dock'}
              items={resolvedItems}
              selectedIndex={selectedIndex}
              isCollapsed={!effectivelyOpen}
              onSelect={(index) => {
                setSelectedIndex(index);
                onSelect?.(index);
              }}
              onItemClick={() => {
                if (isMobile) {
                  closeMobileMenu();
                }
              }}
            />
          </AnimatePresence>
        </div>

        {/* Bottom User Profile & Theme Quick-Toggles */}
        <div className={`mt-auto pt-3 border-t border-amber-900/5 dark:border-white/5 w-full flex flex-col gap-2 box-border ${effectivelyOpen ? '' : 'items-center'}`}>
          <SidebarThemeToggle isCollapsed={!effectivelyOpen} />
          <SidebarUserFooter
            isCollapsed={!effectivelyOpen}
            onItemClick={() => {
              if (isMobile) {
                closeMobileMenu();
              }
            }}
          />
        </div>
      </div>
    );
  };

  // If children are supplied (standalone preview container mode)
  if (children) {
    return (
      <div
        className={`flex bg-amber-50/30 dark:bg-zinc-950 rounded-3xl p-3 relative w-full sm:min-w-[480px] overflow-hidden ${className}`}
      >
        <div
          className={`shrink-0 flex flex-col justify-between h-full box-border border-r border-amber-900/5 dark:border-white/5 bg-[#FDFCF9] dark:bg-[#121110] overflow-x-hidden p-3.5 transition-[width] duration-300 ${
            isOpen ? 'w-[260px]' : 'w-20'
          }`}
        >
          {renderSidebarContent(false)}
        </div>
        <div className="flex-1 w-full h-full min-h-full overflow-y-auto z-0 pl-4 lg:pl-8">
          {children}
        </div>
      </div>
    );
  }

  // Persistent Layout Mode (Integrated directly into AppShell)
  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <motion.aside
        animate={{ width: isOpen ? 260 : 80 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 h-screen box-border border-r border-amber-900/5 dark:border-white/5 bg-[#FDFCF9] dark:bg-[#121110] overflow-x-hidden p-3.5 flex-col justify-between"
      >
        {renderSidebarContent(false)}
      </motion.aside>

      {/* Mobile Drawer (Activated via header hamburger) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
            onClick={closeMobileMenu}
          />
          {/* Drawer content */}
          <div className="relative h-full w-[260px] max-w-[85vw] box-border border-r border-amber-900/5 dark:border-white/5 bg-[#FDFCF9] dark:bg-[#121110] overflow-x-hidden p-3.5 z-10 animate-in slide-in-from-left duration-200 flex flex-col justify-between">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
