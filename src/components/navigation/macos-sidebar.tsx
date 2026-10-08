'use client';

import React, { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
  type MotionValue,
} from 'framer-motion';
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

/**
 * Mathematical proximity formula used by the dock zoom effect.
 * Directly hovered center: 1.12 (max 1.16 in collapsed mode) [Doubled zoom factor]
 * Immediate vertical neighbor (~42px): 1.044
 * Edge boundary (>=85px): 1.0
 */
export function calculateDockScale(distance: number, isCollapsed = false): number {
  if (!isFinite(distance)) return 1;
  const absDist = Math.abs(distance);
  const maxScale = isCollapsed ? 1.16 : 1.12;
  const neighborScale = 1.044;
  const maxRange = 85;
  const midRange = 42;

  if (absDist >= maxRange) return 1;
  if (absDist <= midRange) {
    const t = absDist / midRange;
    return maxScale - t * (maxScale - neighborScale);
  }
  const t = (absDist - midRange) / (maxRange - midRange);
  return neighborScale - t * (neighborScale - 1);
}

interface DockNavItemProps {
  item: NavItemConfig;
  index: number;
  isSelected: boolean;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
  mouseY: MotionValue<number>;
  onSelect: () => void;
  isCollapsed: boolean;
}

function DockNavItem({
  item,
  index,
  isSelected,
  hoveredIndex,
  setHoveredIndex,
  mouseY,
  onSelect,
  isCollapsed,
}: DockNavItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  // Measure vertical distance from mouse cursor to item center in viewport space
  const distance = useTransform(mouseY, (val: number) => {
    if (val === Infinity || !itemRef.current) return Infinity;
    const bounds = itemRef.current.getBoundingClientRect();
    const centerY = bounds.top + bounds.height / 2;
    return val - centerY;
  });

  // Calculate doubled magnification (1.12 expanded, 1.16 collapsed)
  const maxTargetScale = isCollapsed ? 1.16 : 1.12;
  const rawScale = useTransform(
    distance,
    [-85, -42, 0, 42, 85],
    [1, 1.044, maxTargetScale, 1.044, 1],
    { clamp: true }
  );

  // Apply fluid physical spring elasticity without visual lag
  const scale = useSpring(rawScale, {
    mass: 0.1,
    stiffness: 260,
    damping: 20,
  });

  return (
    <motion.div
      ref={itemRef}
      style={{
        scale,
        transformOrigin: 'center center',
        willChange: 'transform',
      }}
      className={`relative box-border ${
        isCollapsed ? 'w-full flex justify-center' : 'w-full max-w-full px-1'
      }`}
      onMouseEnter={() => setHoveredIndex(index)}
    >
      <Link
        href={item.href}
        prefetch={true}
        onClick={onSelect}
        title={isCollapsed ? item.label : undefined}
        className={`relative cursor-pointer block transition-colors group select-none box-border ${
          isCollapsed
            ? 'flex items-center justify-center size-10 rounded-xl'
            : 'w-full rounded-xl overflow-hidden'
        }`}
      >
        {/* Active Route Selection Pill */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              layoutId={isCollapsed ? 'sidebar-active-pill-collapsed' : 'sidebar-active-pill-expanded'}
              className="absolute inset-0 z-0 bg-neutral-200/80 dark:bg-neutral-800 rounded-xl shadow-xs border border-neutral-300/40 dark:border-neutral-700/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* Hover Pill Background */}
        <AnimatePresence>
          {hoveredIndex === index && !isSelected && (
            <motion.span
              layoutId={isCollapsed ? 'sidebar-hover-bg-collapsed' : 'sidebar-hover-bg-expanded'}
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

        {/* Item Label and Icon */}
        {isCollapsed ? (
          <HugeiconsIcon
            icon={item.icon}
            className={`size-5 z-10 shrink-0 transition-colors ${
              isSelected
                ? 'text-neutral-950 dark:text-neutral-100 font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200'
            }`}
          />
        ) : (
          <div className="relative z-10 flex items-center gap-3 px-3 py-2 min-w-0 w-full box-border">
            <HugeiconsIcon
              icon={item.icon}
              className={`size-5 shrink-0 transition-colors ${
                isSelected
                  ? 'text-neutral-950 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200'
              }`}
            />
            <span
              className={`tracking-tight text-sm transition-colors truncate flex-1 min-w-0 ${
                isSelected
                  ? 'text-neutral-950 dark:text-neutral-100 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-950 dark:group-hover:text-neutral-100 font-normal'
              }`}
            >
              {item.label}
            </span>
          </div>
        )}
      </Link>
    </motion.div>
  );
}

interface DockNavLaneProps {
  items: NavItemConfig[];
  selectedIndex: number;
  setSelectedIndex: (idx: number) => void;
  isCollapsed: boolean;
  onItemClick: () => void;
}

export function DockNavLane({
  items,
  selectedIndex,
  setSelectedIndex,
  isCollapsed,
  onItemClick,
}: DockNavLaneProps) {
  // Continuous pointer tracker across the vertical navigation container
  const mouseY = useMotionValue(Infinity);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav
      onMouseMove={(e) => mouseY.set(e.clientY)}
      onMouseLeave={() => {
        mouseY.set(Infinity);
        setHoveredIndex(null);
      }}
      className={`flex flex-col ${
        isCollapsed ? 'items-center gap-1.5' : 'gap-1'
      } mt-3 w-full relative z-10`}
    >
      {items.map((item, index) => (
        <DockNavItem
          key={item.href}
          item={item}
          index={index}
          isSelected={selectedIndex === index}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
          mouseY={mouseY}
          onSelect={() => {
            setSelectedIndex(index);
            onItemClick();
          }}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>
  );
}

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
            } text-neutral-700 dark:text-neutral-300 p-1 shrink-0 box-border`}
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

          {/* Refactored Navigation Items with MacBook-style Dock Zoom Effect */}
          <AnimatePresence mode="wait">
            <DockNavLane
              key={effectivelyOpen ? 'expanded-dock' : 'collapsed-dock'}
              items={resolvedItems}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
              isCollapsed={!effectivelyOpen}
              onItemClick={closeMobileMenu}
            />
          </AnimatePresence>
        </div>

        {/* Bottom Profile / Personal Workspace Section */}
        {effectivelyOpen ? (
          <div className="mt-auto pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80 w-full box-border">
            <Link
              href="/settings"
              prefetch={true}
              onClick={closeMobileMenu}
              className="flex items-center justify-between p-2 rounded-xl bg-neutral-200/40 hover:bg-neutral-200/80 dark:bg-neutral-800/40 dark:hover:bg-neutral-800 transition-colors cursor-pointer group w-full box-border"
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
          <div className="mt-auto pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80 w-full flex justify-center box-border">
            <Link
              href="/settings"
              prefetch={true}
              onClick={closeMobileMenu}
              className="size-10 rounded-xl bg-neutral-200/60 hover:bg-neutral-200 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer box-border"
              title="Personal Workspace — Settings"
            >
              <HugeiconsIcon
                icon={UserCircleIcon}
                className="size-5 text-neutral-700 dark:text-neutral-200"
              />
            </Link>
          </div>
        )}
      </div>
    );
  };

  // If children are supplied (standalone preview container mode)
  if (children) {
    return (
      <div
        className={`flex bg-neutral-200 dark:bg-neutral-950 rounded-3xl p-3 relative w-full sm:min-w-[480px] overflow-hidden ${className}`}
      >
        <div
          className={`shrink-0 flex flex-col justify-between h-full box-border border-r border-neutral-200/80 dark:border-neutral-800 bg-neutral-100/95 dark:bg-neutral-900/95 backdrop-blur-md overflow-x-hidden p-3.5 transition-[width] duration-300 ${
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
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 h-screen box-border border-r border-neutral-200/80 dark:border-neutral-800 bg-neutral-100/95 dark:bg-neutral-900/95 backdrop-blur-md overflow-x-hidden p-3.5 flex-col justify-between"
      >
        {renderSidebarContent(false)}
      </motion.aside>

      {/* Mobile Drawer (Activated via header hamburger) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity"
            onClick={closeMobileMenu}
          />
          {/* Drawer content */}
          <div className="relative h-full w-[260px] max-w-[85vw] box-border border-r border-neutral-200/80 dark:border-neutral-800 bg-neutral-100/95 dark:bg-neutral-900/95 backdrop-blur-md overflow-x-hidden p-3.5 z-10 animate-in slide-in-from-left duration-200 flex flex-col justify-between">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
