'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme/use-theme';
import { signOutAction } from '@/lib/actions/profile';
import {
  Calendar,
  Bell,
  Sun,
  Moon,
  Monitor,
  Settings,
  LogOut,
  Search,
} from 'lucide-react';

interface DashboardHeaderProps {
  displayName?: string;
}

export function DashboardHeader({ displayName = 'Aryan' }: DashboardHeaderProps) {
  const { isDark, setTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isDropdownOpen]);

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-quick-capture'));
  };

  const initial = (displayName.trim()[0] || 'A').toUpperCase();

  return (
    <header className="h-[48px] shrink-0 px-6 sm:px-8 flex items-center justify-between border-b border-[#07343C]/10 dark:border-zinc-800/60 bg-[#FBF9F5] dark:bg-[#090A0F] z-30 transition-colors">
      {/* Breadcrumb Brand */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="font-serif font-semibold text-[18px] tracking-tight text-[#07343C] dark:text-zinc-100 hover:opacity-85 transition-opacity"
        >
          LifeOS
        </Link>
        <span className="text-[#07343C]/40 dark:text-zinc-600 font-light text-[13px]">/</span>
        <span className="text-[#07343C]/70 dark:text-zinc-400 font-medium text-[13px]">Workspace</span>
      </div>

      {/* Center Search bar with ⌘K badge */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={handleOpenSearch}
          className="flex items-center w-56 sm:w-64 h-7 pl-8 pr-11 rounded-full bg-white dark:bg-zinc-900 border border-[#07343C]/10 dark:border-zinc-800 text-[12px] text-[#07343C]/60 dark:text-zinc-400 hover:border-[#0B5563] dark:hover:border-emerald-600 transition-colors shadow-2xs text-left cursor-pointer group"
          aria-label="Open search omnibar (⌘K)"
        >
          <Search className="absolute left-2.5 size-3.5 text-[#07343C]/40 dark:text-zinc-500 group-hover:text-[#0B5563] transition-colors" />
          <span>Search anything…</span>
          <kbd className="absolute right-2 px-1.5 py-0.5 text-[10px] font-semibold text-[#07343C]/60 dark:text-zinc-400 bg-[#F8F6F0] dark:bg-zinc-800 rounded border border-[#07343C]/15 dark:border-zinc-700 pointer-events-none font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Calendar, Notifications & Avatar Dropdown */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Link
            href="/tasks"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#07343C]/70 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-[#07343C]/10 dark:hover:border-zinc-700 transition-all"
            title="Calendar & Tasks"
            aria-label="View Tasks and Calendar"
          >
            <Calendar className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={handleOpenSearch}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#07343C]/70 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-[#07343C]/10 dark:hover:border-zinc-700 transition-all cursor-pointer"
            title="Notifications & Quick Action"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Avatar & Popover Menu */}
        <div className="relative pl-2.5 border-l border-[#07343C]/15 dark:border-zinc-800" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 cursor-pointer group focus-visible:outline-none"
            aria-label="User account menu"
            aria-expanded={isDropdownOpen}
          >
            <div className="w-7 h-7 rounded-full bg-[#0B5563] dark:bg-emerald-600 text-white flex items-center justify-center font-medium text-[12px] shadow-2xs group-hover:opacity-90 transition-opacity">
              {initial}
            </div>
            <span className="text-[13px] font-medium text-[#07343C] dark:text-zinc-200 hidden sm:inline group-hover:text-[#0B5563] transition-colors">
              {displayName}
            </span>
          </button>

          {/* Account & Theme Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-[#07343C]/10 dark:border-zinc-800 shadow-lg py-1.5 z-50 text-[12px] text-[#07343C] dark:text-zinc-200">
              <div className="px-3 py-1.5 border-b border-[#07343C]/10 dark:border-zinc-800 mb-1">
                <p className="font-semibold text-[13px] truncate">{displayName}</p>
                <p className="text-[10px] text-[#07343C]/60 dark:text-zinc-400">Personal Workspace</p>
              </div>

              {/* Theme Selector */}
              <div className="px-2 py-1">
                <span className="px-2 text-[10px] uppercase font-bold text-[#07343C]/50 dark:text-zinc-500 font-mono tracking-wider">
                  Theme
                </span>
                <div className="grid grid-cols-3 gap-1 mt-1 px-1">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${
                      !isDark
                        ? 'bg-[#F3F0EA] dark:bg-zinc-800 border-[#07343C]/20 font-semibold'
                        : 'border-transparent hover:bg-stone-100 dark:hover:bg-zinc-800'
                    }`}
                    title="Light"
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 font-semibold text-emerald-400'
                        : 'border-transparent hover:bg-stone-100 dark:hover:bg-zinc-800'
                    }`}
                    title="Dark"
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('default')}
                    className="flex items-center justify-center p-1.5 rounded-lg border border-transparent hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all"
                    title="System Default"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="my-1 border-t border-[#07343C]/10 dark:border-zinc-800" />

              <Link
                href="/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#F3F0EA] dark:hover:bg-zinc-800 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[#07343C]/70 dark:text-zinc-400" />
                <span>Settings</span>
              </Link>

              <form action={signOutAction} className="w-full">
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
