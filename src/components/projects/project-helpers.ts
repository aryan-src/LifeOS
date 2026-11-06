import type { ProjectStatus } from '@/types/database.types';
import { getTodayDate } from '@/lib/utils/date';

export const PRIORITY_CONFIG: Record<
  number,
  { label: string; shortLabel: string; badgeClass: string }
> = {
  4: {
    label: 'P1 Urgent',
    shortLabel: 'P1',
    badgeClass:
      'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 font-medium',
  },
  3: {
    label: 'P2 High',
    shortLabel: 'P2',
    badgeClass:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 font-medium',
  },
  2: {
    label: 'P3 Medium',
    shortLabel: 'P3',
    badgeClass:
      'bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60 font-normal',
  },
  1: {
    label: 'P4 Low',
    shortLabel: 'P4',
    badgeClass:
      'bg-stone-50 dark:bg-zinc-800/40 text-stone-500 dark:text-zinc-400 border border-stone-200/40 dark:border-zinc-800/60 font-normal',
  },
};

export const STATUS_CONFIG: Record<
  ProjectStatus,
  { title: string; dotClass: string; badgeClass: string }
> = {
  backlog: {
    title: 'Backlog',
    dotClass: 'bg-stone-400 dark:bg-zinc-500',
    badgeClass:
      'bg-stone-100 dark:bg-zinc-800/80 text-stone-600 dark:text-zinc-300 border border-stone-200/60 dark:border-zinc-700/60',
  },
  active: {
    title: 'Active',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
    badgeClass:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-medium',
  },
  paused: {
    title: 'Paused',
    dotClass: 'bg-amber-500 dark:bg-amber-400',
    badgeClass:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 font-medium',
  },
  completed: {
    title: 'Completed',
    dotClass: 'bg-emerald-600 dark:bg-emerald-400',
    badgeClass:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-medium',
  },
};

export function getDaysRemaining(targetDateStr: string | null): {
  days: number | null;
  label: string;
  badgeClass: string;
} {
  if (!targetDateStr) {
    return {
      days: null,
      label: 'No deadline',
      badgeClass:
        'text-stone-400 dark:text-zinc-500 bg-stone-100/60 dark:bg-zinc-800/40 border border-stone-200/50 dark:border-zinc-700/40',
    };
  }

  const today = getTodayDate();
  if (targetDateStr === today) {
    return {
      days: 0,
      label: 'Due today',
      badgeClass:
        'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 font-semibold',
    };
  }

  const [tY, tM, tD] = today.split('-').map(Number);
  const [dY, dM, dD] = targetDateStr.split('-').map(Number);

  const todayMs = Date.UTC(tY, tM - 1, tD);
  const targetMs = Date.UTC(dY, dM - 1, dD);
  const diffDays = Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      days: diffDays,
      label: `Overdue by ${overdueDays}d`,
      badgeClass:
        'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 font-semibold',
    };
  }

  return {
    days: diffDays,
    label: `${diffDays}d left`,
    badgeClass:
      'text-stone-700 dark:text-zinc-300 bg-stone-100/80 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/60 font-medium',
  };
}
