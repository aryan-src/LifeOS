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
  { label: 'Settings', href: '/settings', icon: 'settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { openQuickCapture, isMobileMenuOpen, closeMobileMenu } = useUIStore();

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full py-4 px-3">
      <div className="flex flex-col gap-3">
        {/* Brand & Mobile Close button */}
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[14px]">splitscreen</span>
            </div>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
              LifeOS
            </span>
          </div>
          <button
            onClick={closeMobileMenu}
            className="lg:hidden p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container transition-colors"
            type="button"
            aria-label="Close navigation"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Quick Capture Button */}
        <div className="pt-1">
          <button
            onClick={() => {
              closeMobileMenu();
              openQuickCapture();
            }}
            className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container shadow-xs transition-colors"
            type="button"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">add_circle</span>
              <span className="font-body-sm text-body-sm font-medium truncate">Quick Capture</span>
            </div>
            <kbd className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-2 pt-2 pb-1">
          <span className="font-label-sm text-label-sm text-outline tracking-wider uppercase">Workspace</span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={closeMobileMenu}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors min-w-0 ${
                  isActive
                    ? 'bg-surface-container-high text-on-surface font-medium shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] shrink-0 ${isActive ? 'text-primary' : 'text-outline'}`}>
                  {item.icon}
                </span>
                <span className="font-body-sm text-body-sm truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile Footer */}
      <div className="pt-3 mt-auto border-t border-outline-variant/20">
        <Link
          href="/settings"
          prefetch={true}
          onClick={closeMobileMenu}
          className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 hover:bg-surface-container transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[16px]">person</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-sm text-body-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                Personal Workspace
              </span>
              <span className="font-label-sm text-label-sm text-outline truncate">Student Settings</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline text-[16px] shrink-0 ml-1 group-hover:text-on-surface transition-colors">
            tune
          </span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-outline-variant/30 z-40 flex-col shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Visible when isMobileMenuOpen is true) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-on-surface/20 backdrop-blur-xs transition-opacity"
            onClick={closeMobileMenu}
          />
          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-surface-container-low border-r border-outline-variant/30 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
