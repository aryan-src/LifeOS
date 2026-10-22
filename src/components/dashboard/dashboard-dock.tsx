'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  CheckSquare,
  CheckCircle2,
  Wallet,
  FileText,
  Settings,
} from 'lucide-react';

interface DockItem {
  title: string;
  icon: React.ReactNode;
  href: string;
}

const DOCK_ITEMS: DockItem[] = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard className="w-[20px] h-[20px]" />,
    href: '/dashboard',
  },
  {
    title: 'Projects',
    icon: <Kanban className="w-[20px] h-[20px]" />,
    href: '/projects',
  },
  {
    title: 'Tasks',
    icon: <CheckSquare className="w-[20px] h-[20px]" />,
    href: '/tasks',
  },
  {
    title: 'Habits',
    icon: <CheckCircle2 className="w-[20px] h-[20px]" />,
    href: '/habits',
  },
  {
    title: 'Finances',
    icon: <Wallet className="w-[20px] h-[20px]" />,
    href: '/finances',
  },
  {
    title: 'Notes',
    icon: <FileText className="w-[20px] h-[20px]" />,
    href: '/notes',
  },
  {
    title: 'Settings',
    icon: <Settings className="w-[20px] h-[20px]" />,
    href: '/settings',
  },
];

export function DashboardDock() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <nav
        className="p-[8px] sm:p-[10px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-[20px] flex items-center gap-1.5 sm:gap-2 border border-[#07343C]/10 dark:border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
        aria-label="Application dock navigation"
      >
        {DOCK_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/' || pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <div key={item.title} className="relative group">
              <Link
                href={item.href}
                aria-label={item.title}
                className={`w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] rounded-[12px] flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 border border-[#07343C]/15 dark:border-zinc-700 shadow-2xs text-[#0B5563] dark:text-emerald-400 font-semibold'
                    : 'bg-[#F3F0EA] dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 text-[#3F3F3F] dark:text-zinc-400 hover:text-[#07343C] dark:hover:text-zinc-100 hover:shadow-2xs'
                }`}
              >
                {item.icon}
              </Link>
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#07343C] dark:bg-zinc-800 text-white text-[10px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md font-sans">
                {item.title}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
