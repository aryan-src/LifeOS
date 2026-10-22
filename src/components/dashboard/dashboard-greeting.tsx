'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCalendarDate, getTodayDate } from '@/lib/utils/date';

interface DashboardGreetingProps {
  displayName?: string;
}

export function DashboardGreeting({ displayName = 'Aryan' }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState('Good day');
  const [dateLabel, setDateLabel] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else if (hour < 21) setGreeting('Good evening');
    else setGreeting('Good night');

    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    setDateLabel(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`);
  }, []);

  const handleQuickAdd = () => {
    window.dispatchEvent(new CustomEvent('open-quick-capture'));
  };

  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#07343C]/60 dark:text-zinc-400 font-mono">
        {dateLabel || formatCalendarDate(getTodayDate(), 'short')}
      </div>
      <h1 className="font-serif text-[28px] xl:text-[32px] leading-tight text-[#07343C] dark:text-zinc-100 font-medium mt-0.5">
        {greeting}, {displayName}.
      </h1>
      <p className="text-[12px] text-[#07343C]/70 dark:text-zinc-400 mt-1 leading-snug">
        Academics, tasks, finances, and notes —<br className="hidden sm:inline" /> in one calm workspace.
      </p>
      <div className="flex items-center gap-2 mt-2">
        <Link
          href="/projects"
          className="border border-[#07343C]/20 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-2xs text-[#07343C] dark:text-zinc-200 rounded-full px-3 py-1 text-[11px] font-medium hover:bg-[#F3F0EA] dark:hover:bg-zinc-700 transition-colors"
        >
          Workspaces
        </Link>
        <button
          type="button"
          onClick={handleQuickAdd}
          className="bg-[#0B5563] dark:bg-emerald-600 text-white rounded-full px-3 py-1 text-[11px] font-medium flex items-center gap-1.5 hover:bg-[#07343C] dark:hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer"
        >
          <span>+ Quick Add</span>
          <kbd className="px-1 py-0.2 bg-white/20 text-[9px] rounded font-mono">⌘N</kbd>
        </button>
      </div>
    </div>
  );
}
