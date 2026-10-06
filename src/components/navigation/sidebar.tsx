'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store/use-ui-store';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: 'grid_view' },
  { label: 'Projects', href: '/projects', icon: 'view_kanban' },
  { label: 'Daily Tasks', href: '/tasks', icon: 'check_circle' },
  { label: 'Finances', href: '/finances', icon: 'account_balance_wallet' },
  { label: 'Ideas & Notes', href: '/notes', icon: 'edit_note' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { openQuickCapture } = useUIStore();

  return (
    <div className="flex flex-col gap-space-sm h-full">
      <div className="flex flex-col gap-space-sm">
        {/* Brand */}
        <div className="flex items-center gap-space-sm px-space-sm py-space-xs">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[14px]">splitscreen</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface font-medium tracking-tight">LifeOS</span>
        </div>

        {/* Quick Capture */}
        <div className="px-space-xs pt-space-xs">
          <button
            onClick={openQuickCapture}
            className="w-full flex items-center justify-between px-space-sm py-space-xs bg-surface-container-lowest rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            type="button"
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span className="font-body-sm text-body-sm">Quick Capture</span>
            </div>
            <kbd className="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant">⌘K</kbd>
          </button>
        </div>

        {/* Nav label */}
        <div className="px-space-sm pt-space-sm pb-space-xs">
          <span className="font-label-sm text-label-sm text-outline tracking-wider uppercase">Workspace</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 px-space-xs">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-colors ${
                  isActive
                    ? 'bg-surface-container-high text-on-surface font-medium'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span className="font-body-sm text-body-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile footer */}
      <div className="px-space-xs pt-space-sm mt-auto">
        <div className="flex items-center justify-between p-space-sm rounded bg-surface-container-lowest hover:bg-surface-container transition-colors cursor-pointer">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-sm text-body-sm font-medium text-on-surface truncate">Personal Workspace</span>
              <span className="font-label-sm text-label-sm text-outline truncate">Free Plan</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline text-[16px]">unfold_more</span>
        </div>
      </div>
    </div>
  );
}
