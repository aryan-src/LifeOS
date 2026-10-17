'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  Moon,
  Sun,
  Monitor,
  SlidersHorizontal,
  User,
  LogOut,
} from 'lucide-react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { signOutAction } from '@/lib/actions/profile';
import { useTheme } from '@/lib/theme/use-theme';

export function TopHeader() {
  const { toggleMobileMenu, isSidebarCollapsed } = useUIStore();
  const { theme, isDark, setTheme, toggleLightDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDarkMode = isDark;

  // Handle click outside & Escape to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMenuOpen]);

  const setLightMode = () => setTheme('light');
  const setDarkMode = () => setTheme('dark');
  const setSystemMode = () => setTheme('default');
  const toggleTheme = () => toggleLightDark();

  return (
    <header
      className={`fixed top-0 right-0 z-30 bg-surface/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-outline-variant/30 dark:border-zinc-800/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-[left,background-color,border-color] duration-300 ease-out ${
        isSidebarCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-[260px]'
      }`}
    >
      <div className="h-14 w-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left side: Hamburger on mobile + Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-1.5 -ml-1 text-on-surface-variant hover:text-on-surface dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-surface-container dark:hover:bg-zinc-900 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            type="button"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-1.5 text-outline dark:text-zinc-500 font-label-sm text-label-sm truncate">
            <Link
              href="/dashboard"
              className="hover:text-on-surface dark:hover:text-zinc-300 transition-colors"
            >
              LifeOS
            </Link>
            <span className="text-outline/60 dark:text-zinc-600">/</span>
            <span className="text-on-surface dark:text-zinc-200 font-medium truncate">Workspace</span>
          </div>
        </div>

        {/* Right side: Search, Burger Theme Switcher, Settings, Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="relative flex items-center min-w-0">
            <Search className="absolute left-2.5 size-4 text-outline dark:text-zinc-500 pointer-events-none" />
            <input
              className="bg-surface-container-low dark:bg-zinc-900/60 pl-9 pr-3 py-1.5 rounded-lg font-body-sm text-body-sm text-on-surface dark:text-zinc-100 placeholder:text-outline dark:placeholder:text-zinc-500 focus:outline-none focus:bg-surface-container-lowest dark:focus:bg-zinc-900 focus:ring-1 focus:ring-outline/40 dark:focus:ring-zinc-700/60 transition-all w-32 sm:w-52 md:w-64 border border-transparent dark:border-zinc-800/60"
              placeholder="Search anything..."
              type="text"
              aria-label="Search records"
            />
          </div>

          {/* Burger Button to switch between dark and light theme */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center justify-center p-2 rounded-lg transition-all cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
                isMenuOpen
                  ? 'bg-surface-container dark:bg-zinc-800 border-outline-variant/60 dark:border-zinc-700 text-on-surface dark:text-zinc-100 shadow-xs'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-surface-container dark:hover:bg-zinc-900'
              }`}
              aria-label="Burger button to switch between dark and light theme"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
              title="Burger button to switch between dark and light theme"
            >
              {/* 3-line animated hamburger / burger icon */}
              <div className="w-4 h-3.5 flex flex-col justify-between items-center py-0.5">
                <span
                  className={`h-0.5 w-4 rounded-full bg-current transition-all duration-200 ${
                    isMenuOpen ? 'rotate-45 translate-y-1' : ''
                  }`}
                />
                <span
                  className={`h-0.5 w-4 rounded-full bg-current transition-all duration-200 ${
                    isMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`h-0.5 w-4 rounded-full bg-current transition-all duration-200 ${
                    isMenuOpen ? '-rotate-45 -translate-y-1' : ''
                  }`}
                />
              </div>
            </button>

            {/* Notion-Style Theme Switch Dropdown Menu */}
            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface-container-lowest dark:bg-zinc-900 border border-outline-variant/40 dark:border-zinc-800 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2.5"
                role="menu"
                aria-orientation="vertical"
              >
                <div className="flex items-center justify-between px-1 pt-0.5">
                  <span className="font-label-sm text-[11px] font-semibold text-outline dark:text-zinc-500 uppercase tracking-wider">
                    Appearance
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-surface-container dark:bg-zinc-800 text-on-surface-variant dark:text-zinc-400">
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>

                {/* Direct Dark Mode Switch Row */}
                <div
                  onClick={toggleTheme}
                  className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low dark:bg-zinc-800/60 hover:bg-surface-container dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isDarkMode ? (
                      <Moon className="size-4 text-on-surface-variant dark:text-zinc-400" />
                    ) : (
                      <Sun className="size-4 text-on-surface-variant dark:text-zinc-400" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-on-surface dark:text-zinc-200">
                        Dark Mode
                      </span>
                      <span className="text-[10px] text-outline dark:text-zinc-500">
                        {isDarkMode ? 'Matte obsidian theme' : 'Warm cream theme'}
                      </span>
                    </div>
                  </div>

                  {/* Switch Pill */}
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                      isDarkMode ? 'bg-indigo-600 justify-end' : 'bg-surface-container-highest dark:bg-zinc-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </div>
                </div>

                {/* Segmented Light / Dark / Auto Buttons */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-surface-container dark:bg-zinc-950/60 rounded-xl border border-outline-variant/20 dark:border-zinc-800/60">
                  <button
                    type="button"
                    onClick={setLightMode}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 ${
                      theme === 'light'
                        ? 'bg-surface-container-lowest dark:bg-zinc-800 text-on-surface dark:text-zinc-100 shadow-xs'
                        : 'text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200'
                    }`}
                  >
                    <Sun className="size-3.5" />
                    <span>Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={setDarkMode}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 ${
                      theme === 'dark' || theme === 'crimson-dark'
                        ? 'bg-surface-container-lowest dark:bg-zinc-800 text-on-surface dark:text-zinc-100 shadow-xs'
                        : 'text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200'
                    }`}
                  >
                    <Moon className="size-3.5" />
                    <span>Dark</span>
                  </button>

                  <button
                    type="button"
                    onClick={setSystemMode}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 ${
                      theme === 'default'
                        ? 'bg-surface-container-lowest dark:bg-zinc-800 text-on-surface dark:text-zinc-100 shadow-xs'
                        : 'text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200'
                    }`}
                  >
                    <Monitor className="size-3.5" />
                    <span>Auto</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/settings"
            prefetch={true}
            className="text-on-surface-variant hover:text-on-surface dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center justify-center p-1.5 rounded-lg hover:bg-surface-container dark:hover:bg-zinc-900 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            aria-label="View settings"
          >
            <SlidersHorizontal className="size-4" />
          </Link>
          <Link
            href="/settings"
            prefetch={true}
            className="w-8 h-8 rounded-full bg-primary dark:bg-zinc-100 flex items-center justify-center shrink-0 shadow-sm hover:ring-2 hover:ring-outline-variant/50 dark:hover:ring-zinc-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 text-on-primary dark:text-zinc-900"
            aria-label="User Profile Settings"
          >
            <User className="size-4" />
          </Link>
          <form action={signOutAction} className="shrink-0 flex items-center">
            <button
              type="submit"
              className="text-on-surface-variant hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 flex items-center justify-center p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
