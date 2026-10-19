'use client';

import React from 'react';
import Link from 'next/link';
import { User, LogOut, SlidersHorizontal } from 'lucide-react';
import { signOutAction } from '@/lib/actions/profile';

export interface SidebarUserFooterProps {
  isCollapsed?: boolean;
  onItemClick?: () => void;
}

export function SidebarUserFooter({ isCollapsed = false, onItemClick }: SidebarUserFooterProps) {
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 box-border">
        <Link
          href="/settings"
          prefetch={true}
          onClick={onItemClick}
          className="size-10 rounded-xl bg-stone-200/40 hover:bg-stone-200/70 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer box-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
          title="Personal Workspace — Settings"
          aria-label="Personal Workspace — Settings"
        >
          <User className="size-5 text-stone-700 dark:text-stone-200" />
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="size-10 rounded-xl bg-stone-200/40 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800/40 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-stone-700 dark:text-stone-200 flex items-center justify-center transition-colors cursor-pointer box-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/settings"
        prefetch={true}
        onClick={onItemClick}
        className="flex items-center justify-between p-2 rounded-xl bg-stone-200/40 hover:bg-stone-200/70 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 transition-colors cursor-pointer group flex-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
        title="Personal Workspace — Settings"
        aria-label="Personal Workspace — Settings"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center shrink-0 shadow-xs">
            <User className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate group-hover:text-stone-950 dark:group-hover:text-white transition-colors">
              Personal Workspace
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              Student Settings
            </span>
          </div>
        </div>
        <SlidersHorizontal className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200 size-4 shrink-0 ml-1 transition-colors" />
      </Link>
      <form action={signOutAction} className="shrink-0">
        <button
          type="submit"
          title="Sign Out"
          aria-label="Sign Out"
          className="p-2 rounded-xl bg-stone-200/40 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800/40 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-stone-500 dark:text-stone-400 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}
