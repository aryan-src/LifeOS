'use client';

import React, { useState, useEffect } from 'react';

function getLocalGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getLocalDateFormatted(): { dayName: string; dateFormatted: string } {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    dayName: dayNames[now.getDay()],
    dateFormatted: `${now.getDate()} ${months[now.getMonth()]}`,
  };
}

interface DashboardGreetingProps {
  displayName?: string;
  initialGreeting?: string;
  initialDayName?: string;
  initialDateFormatted?: string;
}

export function DashboardGreeting({
  displayName = 'Aryan',
  initialGreeting = 'Good morning',
  initialDayName = 'Sunday',
  initialDateFormatted = '25 Oct',
}: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState(initialGreeting);
  const [{ dayName, dateFormatted }, setDateInfo] = useState({
    dayName: initialDayName,
    dateFormatted: initialDateFormatted,
  });

  useEffect(() => {
    // Immediately synchronize with the user's local system clock
    setGreeting(getLocalGreeting());
    setDateInfo(getLocalDateFormatted());

    // Periodically re-check every minute so greetings naturally progress
    const interval = setInterval(() => {
      setGreeting(getLocalGreeting());
      setDateInfo(getLocalDateFormatted());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900/70 border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl px-6 py-3.5 shadow-sm flex items-center justify-between transition-colors">
      <h1 className="text-xl sm:text-2xl font-serif font-medium text-stone-950 dark:text-zinc-50 tracking-tight leading-none">
        {`${greeting}, ${displayName}.`}
      </h1>
      <div className="flex items-center gap-2.5 bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 rounded-xl px-3.5 py-1.5 shrink-0 shadow-2xs">
        <svg className="w-4 h-4 text-stone-500 dark:text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect height="18" rx="2" strokeWidth="1.8" width="18" x="3" y="4" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-xs font-mono text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
            {`${dayName},`}
          </span>
          <span className="text-xs font-bold font-mono text-stone-900 dark:text-zinc-100 tracking-tight">
            {dateFormatted}
          </span>
        </div>
      </div>
    </div>
  );
}
