'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
  type MotionValue,
} from 'motion/react';

export interface NavItemConfig {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
}

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

export interface DockNavItemProps {
  item: NavItemConfig;
  index: number;
  isSelected: boolean;
  isCollapsed: boolean;
  mouseY: MotionValue<number>;
  onSelect: (index: number) => void;
  onItemClick?: () => void;
}

export function DockNavItem({
  item,
  index,
  isSelected,
  isCollapsed,
  mouseY,
  onSelect,
  onItemClick,
}: DockNavItemProps) {
  const itemRef = useRef<HTMLAnchorElement>(null);
  const [distance, setDistance] = useState<number>(Infinity);

  // Update distance when mouse moves
  useEffect(() => {
    return mouseY.on('change', (y) => {
      if (!itemRef.current || y === -1) {
        setDistance(Infinity);
        return;
      }
      const rect = itemRef.current.getBoundingClientRect();
      const itemCenterY = rect.top + rect.height / 2;
      setDistance(y - itemCenterY);
    });
  }, [mouseY]);

  // Derived scale from distance
  const targetScale = useMemo(() => {
    if (distance === Infinity) return 1.0;
    return calculateDockScale(distance, isCollapsed);
  }, [distance, isCollapsed]);

  // Spring physics for authentic macOS tactile bounce
  const springScale = useSpring(targetScale, {
    stiffness: 400,
    damping: 25,
    mass: 0.1,
  });

  const IconComponent = item.icon;

  return (
    <motion.div
      style={{
        scale: springScale,
        originX: isCollapsed ? 0.5 : 0.05,
        originY: 0.5,
      }}
      className="relative w-full select-none"
    >
      <Link
        ref={itemRef}
        href={item.href}
        prefetch={true}
        onClick={() => {
          onSelect(index);
          onItemClick?.();
        }}
        className={`group relative flex items-center w-full rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
          isCollapsed
            ? 'justify-center h-10 w-10 mx-auto'
            : 'h-10 px-1'
        } ${
          isSelected
            ? 'font-medium text-stone-900 dark:text-stone-100'
            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-zinc-800/50'
        }`}
        title={item.label}
        aria-label={item.label}
      >
        {/* Active Pill Indicator (Fluid sliding motion) */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              layoutId="macos-sidebar-active-indicator"
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 35,
              }}
              className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-zinc-800 z-0"
            />
          )}
        </AnimatePresence>

        {/* Item Label and Icon */}
        {isCollapsed ? (
          <IconComponent
            className={`size-5 z-10 shrink-0 transition-colors ${
              isSelected
                ? 'text-stone-900 dark:text-stone-100 font-semibold'
                : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200'
            }`}
          />
        ) : (
          <div className="relative z-10 flex items-center gap-3 px-3 py-2 min-w-0 w-full box-border">
            <IconComponent
              className={`size-5 shrink-0 transition-colors ${
                isSelected
                  ? 'text-stone-900 dark:text-stone-100'
                  : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200'
              }`}
            />
            <span
              className={`text-sm truncate transition-colors ${
                isSelected
                  ? 'text-stone-900 dark:text-stone-100 font-medium'
                  : 'text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100'
              }`}
            >
              {item.label}
            </span>
          </div>
        )}

        {/* Minimal macOS notification tooltip in collapsed mode */}
        {isCollapsed && (
          <div className="pointer-events-none fixed left-[84px] ml-1 hidden rounded-md bg-stone-900/90 dark:bg-stone-100/90 px-2 py-1 text-xs font-medium text-white dark:text-stone-900 shadow-md backdrop-blur-xs group-hover:block z-50 whitespace-nowrap">
            {item.label}
          </div>
        )}
      </Link>
    </motion.div>
  );
}

export interface DockNavLaneProps {
  items: NavItemConfig[];
  selectedIndex: number;
  isCollapsed: boolean;
  onSelect: (index: number) => void;
  onItemClick?: () => void;
}

export function DockNavLane({
  items,
  selectedIndex,
  isCollapsed,
  onSelect,
  onItemClick,
}: DockNavLaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseY = useMotionValue<number>(-1);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseY.set(e.clientY);
  };

  const handleMouseLeave = () => {
    mouseY.set(-1);
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`flex flex-col gap-1 w-full box-border py-1 ${
        isCollapsed ? 'items-center px-1' : 'px-1'
      }`}
    >
      {items.map((item, idx) => (
        <DockNavItem
          key={item.href}
          item={item}
          index={idx}
          isSelected={selectedIndex === idx}
          isCollapsed={isCollapsed}
          mouseY={mouseY}
          onSelect={onSelect}
          onItemClick={onItemClick}
        />
      ))}
    </motion.div>
  );
}
