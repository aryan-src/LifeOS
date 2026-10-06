'use client';

import React from 'react';
import Link from 'next/link';
import { useUIStore } from '@/lib/store/use-ui-store';

export function TopHeader() {
  const { toggleMobileMenu } = useUIStore();

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 z-30 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-[left] duration-200">
      <div className="h-14 w-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left side: Hamburger on mobile + Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-1.5 -ml-1 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors shrink-0"
            type="button"
            aria-label="Toggle navigation"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
          <div className="flex items-center gap-1.5 text-outline font-label-sm text-label-sm truncate">
            <span className="hover:text-on-surface cursor-pointer transition-colors">LifeOS</span>
            <span className="text-outline/60">/</span>
            <span className="text-on-surface font-medium truncate">Workspace</span>
          </div>
        </div>

        {/* Right side: Search, Controls, Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="relative flex items-center min-w-0">
            <span className="material-symbols-outlined absolute left-2.5 text-[16px] text-outline pointer-events-none">
              search
            </span>
            <input
              className="bg-surface-container-low pl-9 pr-3 py-1.5 rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-outline/40 transition-all w-36 sm:w-52 md:w-64"
              placeholder="Search anything..."
              type="text"
            />
          </div>
          <Link
            href="/settings"
            className="text-on-surface-variant hover:text-on-surface flex items-center justify-center p-1.5 rounded-lg hover:bg-surface-container transition-colors shrink-0"
            aria-label="View settings"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </Link>
          <Link
            href="/settings"
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm hover:ring-2 hover:ring-outline-variant/50 transition-all"
            aria-label="User Profile Settings"
          >
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
