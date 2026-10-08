'use client';

import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PlusSignIcon,
  SidebarLeftIcon,
  DashboardSquare01Icon,
  KanbanIcon,
  TaskDaily01Icon,
  AssignmentsIcon,
  Wallet01Icon,
  NoteEditIcon,
  Settings02Icon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { useUIStore } from '@/lib/store/use-ui-store';

export interface NavItemConfig {
  label: string;
  href: string;
  icon: any;
}

export const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', href: '/', icon: DashboardSquare01Icon },
  { label: 'Projects', href: '/projects', icon: KanbanIcon },
  { label: 'Daily Tasks', href: '/tasks', icon: TaskDaily01Icon },
  { label: 'Assignments', href: '/assignments', icon: AssignmentsIcon },
  { label: 'Finances', href: '/finances', icon: Wallet01Icon },
  { label: 'Ideas & Notes', href: '/notes', icon: NoteEditIcon },
  { label: 'Settings', href: '/settings', icon: Settings02Icon },
];

export interface MacOSSidebarProps {
  items?: (string | NavItemConfig)[];
  defaultOpen?: boolean;
  initialSelectedIndex?: number;
  children?: ReactNode;
  className?: string;
}

export function MacOSSidebar({
  items,
  defaultOpen = true,
  initialSelectedIndex = 0,
  children,
  className = '',
}: MacOSSidebarProps) {
  const pathname = usePathname();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    openQuickCapture,
    isMobileMenuOpen,
    closeMobileMenu,
  } = useUIStore();

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(
    typeof defaultOpen === 'boolean' ? defaultOpen : !isSidebarCollapsed
  );

  // Sync internal open state with global store
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

  // Resolve navigation items to NavItemConfig array
  const resolvedItems: NavItemConfig[] = useMemo(() => {
    if (!items || items.length === 0) return DEFAULT_NAV_ITEMS;
    return items.map((item) => {
      if (typeof item === 'string') {
        const found = DEFAULT_NAV_ITEMS.find(
          (d) => d.label.toLowerCase() === item.toLowerCase()
        );
        if (found) return found;
        return {
          label: item,
          href: item === 'Dashboard' ? '/' : `/${item.toLowerCase().replace(/\s+/g, '-')}`,
          icon: DashboardSquare01Icon,
        };
      }
      return item;
    });
  }, [items]);

  // Sync selectedIndex with current pathname
  const activeRouteIndex = useMemo(() => {
    const index = resolvedItems.findIndex((item) => {
      if (item.href === '/') {
        return pathname === '/';
      }
      return pathname === item.href || pathname.startsWith(item.href + '/');
    });
    return index >= 0 ? index : initialSelectedIndex;
  }, [pathname, resolvedItems, initialSelectedIndex]);

  const [selectedIndex, setSelectedIndex] = useState<number>(activeRouteIndex);

  useEffect(() => {
    setSelectedIndex(activeRouteIndex);
  }, [activeRouteIndex]);

  const renderSidebarBody = (isMobile = false) => {
    const effectivelyOpen = isMobile ? true : isOpen;

    return (
      <motion.div
        animate={{ width: effectivelyOpen ? 240 : 64 }}
        transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
        className={`p-2.5 rounded-2xl shrink-0 flex flex-col items-start h-full transition-colors duration-300 ease-out border border-neutral-200/80 dark:border-neutral-800 shadow-sm ${
          effectivelyOpen
            ? 'bg-neutral-100/95 dark:bg-neutral-900/95 backdrop-blur-md'
            : 'bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-md'
        }`}
      >
        {/* Top Header / Actions Area */}
        <div
          className={`flex items-center w-full ${
            effectivelyOpen
              ? 'justify-between gap-2'
              : 'flex-col justify-center gap-2.5'
          } text-neutral-700 dark:text-neutral-300 p-1.5 shrink-0`}
        >
          {effectivelyOpen ? (
            <>
              {/* Brand & App Title */}
              <Link
                href="/"
                prefetch={true}
                onClick={closeMobileMenu}
                className="flex items-center gap-2.5 min-w-0 group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  L
                </div>
                <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100 truncate group-hover:opacity-80 transition-opacity">
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
                  title="Quick Capture (⌘K)"
                  className="p-1 rounded-md text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon className="size-5" icon={PlusSignIcon} />
                </button>
                <motion.button
                  layout
                  type="button"
                  onClick={handleToggle}
                  title="Collapse sidebar"
                  className="p-1 rounded-md text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon className="size-5" icon={SidebarLeftIcon} />
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
                className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <HugeiconsIcon className="size-5" icon={SidebarLeftIcon} />
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  openQuickCapture();
                }}
                title="Quick Capture (⌘K)"
                className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <HugeiconsIcon className="size-5" icon={PlusSignIcon} />
              </button>
            </>
          )}
        </div>

        {/* Navigation Items */}
        {effectivelyOpen ? (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col gap-1 mt-3 w-full relative z-10 whitespace-nowrap"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {resolvedItems.map((item, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className="relative cursor-pointer block rounded-lg overflow-hidden"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onClick={() => {
                      setSelectedIndex(index);
                      closeMobileMenu();
                    }}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 z-0 bg-neutral-200/80 dark:bg-neutral-800 rounded-lg shadow-xs"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                        />
                      )}
                    </AnimatePresence>
                    <div className="relative z-10 flex items-center gap-3 px-3 py-2">
                      <HugeiconsIcon
                        icon={item.icon}
                        className={`size-5 shrink-0 transition-colors ${
                          isSelected
                            ? 'text-neutral-950 dark:text-neutral-100'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      />
                      <p
                        className={`tracking-tight text-sm transition-colors truncate ${
                          isSelected
                            ? 'text-neutral-950 dark:text-neutral-100 font-semibold'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {item.label}
                      </p>
                    </div>
                    <AnimatePresence>
                      {hoveredIndex === index && !isSelected && (
                        <motion.span
                          layoutId="sidebar-hover-bg"
                          className="absolute inset-0 z-0 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 350,
                            damping: 30,
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </motion.div>
          </AnimatePresence>
        ) : (
          /* Folded / Collapsed Icon Bar (Centered 64px) */
          <div
            className="flex flex-col items-center gap-1.5 mt-3 w-full relative z-10"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {resolvedItems.map((item, index) => {
              const isSelected = selectedIndex === index;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  title={item.label}
                  className="relative cursor-pointer flex items-center justify-center size-10 rounded-xl"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onClick={() => {
                    setSelectedIndex(index);
                    closeMobileMenu();
                  }}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 z-0 bg-neutral-200/80 dark:bg-neutral-800 rounded-xl shadow-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      />
                    )}
                  </AnimatePresence>
                  <HugeiconsIcon
                    icon={item.icon}
                    className={`size-5 z-10 shrink-0 transition-colors ${
                      isSelected
                        ? 'text-neutral-950 dark:text-neutral-100'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  />
                  <AnimatePresence>
                    {hoveredIndex === index && !isSelected && (
                      <motion.span
                        layoutId="sidebar-hover-bg-collapsed"
                        className="absolute inset-0 z-0 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
        )}

        {/* Bottom Profile / Personal Workspace Section */}
        {effectivelyOpen ? (
          <div className="mt-auto pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80 w-full">
            <Link
              href="/settings"
              prefetch={true}
              onClick={closeMobileMenu}
              className="flex items-center justify-between p-2 rounded-xl bg-neutral-200/40 hover:bg-neutral-200/80 dark:bg-neutral-800/40 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
              title="Personal Workspace — Settings"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center shrink-0 shadow-xs">
                  <HugeiconsIcon icon={UserCircleIcon} className="size-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                    Personal Workspace
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    Student Settings
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 text-[16px] shrink-0 ml-1 transition-colors">
                tune
              </span>
            </Link>
          </div>
        ) : (
          <div className="mt-auto pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80 w-full flex justify-center">
            <Link
              href="/settings"
              prefetch={true}
              onClick={closeMobileMenu}
              className="w-10 h-10 rounded-full bg-neutral-200/60 hover:bg-neutral-200 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Personal Workspace — Settings"
            >
              <HugeiconsIcon
                icon={UserCircleIcon}
                className="size-5 text-neutral-700 dark:text-neutral-200"
              />
            </Link>
          </div>
        )}
      </motion.div>
    );
  };

  // If children are supplied (standalone macOS preview container mode)
  if (children) {
    return (
      <div
        className={`flex bg-neutral-200 dark:bg-neutral-950 rounded-3xl p-3 relative w-full sm:min-w-[480px] overflow-hidden ${className}`}
      >
        {renderSidebarBody(false)}
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
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 p-2.5 pointer-events-none h-screen">
        <div className="pointer-events-auto h-full flex flex-col">
          {renderSidebarBody(false)}
        </div>
      </aside>

      {/* Mobile Drawer (Activated via header hamburger) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity"
            onClick={closeMobileMenu}
          />
          {/* Drawer content */}
          <div className="relative h-full p-2.5 z-10 animate-in slide-in-from-left duration-200 max-w-[85vw]">
            {renderSidebarBody(true)}
          </div>
        </div>
      )}
    </>
  );
}
