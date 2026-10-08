import type { AssignmentStatus } from '@/types/database.types';
import type { AssignmentWithProject } from '@/lib/actions/assignments';
import { getTodayDate } from '@/lib/utils/date';

export type PriorityLevel = 'HIGH' | 'MED' | 'LOW';

export interface ColumnConfig {
  id: 'active' | 'in_progress' | 'submitted' | 'graded';
  title: string;
  statuses: AssignmentStatus[];
  defaultCreateStatus: AssignmentStatus;
  accentDot: string;
  containerClass: string;
  badgeClass: string;
  isHighlighted?: boolean;
}

export const FOUR_COLUMNS: ColumnConfig[] = [
  {
    id: 'active',
    title: 'Active Action Items',
    statuses: ['not_started'],
    defaultCreateStatus: 'not_started',
    accentDot: 'bg-stone-400',
    containerClass: 'bg-stone-100/60 dark:bg-stone-900/40 border border-[#EAE6DF]/90 dark:border-stone-800',
    badgeClass: 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700',
  },
  {
    id: 'in_progress',
    title: 'In Progress / Action Needed',
    statuses: ['in_progress', 'submission_pending'],
    defaultCreateStatus: 'in_progress',
    accentDot: 'bg-amber-500 animate-pulse',
    containerClass: 'bg-[#FFFDF7] dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/60 shadow-sm',
    badgeClass: 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold',
    isHighlighted: true,
  },
  {
    id: 'submitted',
    title: 'Submitted',
    statuses: ['submitted'],
    defaultCreateStatus: 'submitted',
    accentDot: 'bg-emerald-500',
    containerClass: 'bg-stone-100/60 dark:bg-stone-900/40 border border-[#EAE6DF]/90 dark:border-stone-800',
    badgeClass: 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium',
  },
  {
    id: 'graded',
    title: 'Graded & History',
    statuses: ['graded'],
    defaultCreateStatus: 'graded',
    accentDot: 'bg-purple-500',
    containerClass: 'bg-stone-100/60 dark:bg-stone-900/40 border border-[#EAE6DF]/90 dark:border-stone-800',
    badgeClass: 'bg-white dark:bg-stone-800 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 font-medium',
  },
];

/**
 * Returns distinct pastel styling for academic subjects matching Stitch design.
 */
export function getSubjectBadgeStyle(subject: string): string {
  const normalized = (subject || '').trim().toUpperCase();
  if (normalized.includes('CS') || normalized.includes('COMP') || normalized.includes('CODE') || normalized.includes('PROG')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
  }
  if (normalized.includes('MATH') || normalized.includes('STAT') || normalized.includes('CALC') || normalized.includes('ALG')) {
    return 'bg-teal-50 text-teal-800 border-teal-100 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800';
  }
  if (normalized.includes('HIST') || normalized.includes('ARCH') || normalized.includes('GOV') || normalized.includes('POL')) {
    return 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
  }
  if (normalized.includes('PHIL') || normalized.includes('LIT') || normalized.includes('ENG') || normalized.includes('WRIT')) {
    return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
  }
  if (normalized.includes('ECON') || normalized.includes('BUS') || normalized.includes('FIN') || normalized.includes('ACCT')) {
    return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
  }
  if (normalized.includes('NEURO') || normalized.includes('BIO') || normalized.includes('CHEM') || normalized.includes('PHYS') || normalized.includes('SCI')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
  }

  // Graceful deterministic hash for custom subjects
  const palette = [
    'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
    'bg-teal-50 text-teal-800 border-teal-100 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    'bg-sky-50 text-sky-800 border-sky-100 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
  ];
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash + normalized.charCodeAt(i)) % palette.length;
  }
  return palette[hash] || palette[0];
}

/**
 * Calculates priority based on deadline and status.
 */
export function getAssignmentPriority(
  assignment: Pick<AssignmentWithProject, 'due_date' | 'status'>,
  todayStr: string = getTodayDate()
): PriorityLevel {
  // Submission pending is always High Priority action item
  if (assignment.status === 'submission_pending') {
    return 'HIGH';
  }

  // Overdue items that are not completed
  if (
    assignment.due_date &&
    assignment.due_date < todayStr &&
    assignment.status !== 'submitted' &&
    assignment.status !== 'graded'
  ) {
    return 'HIGH';
  }

  // Calculate days difference
  if (assignment.due_date) {
    const todayMs = new Date(todayStr).getTime();
    const dueMs = new Date(assignment.due_date).getTime();
    const diffDays = Math.ceil((dueMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays <= 2 && assignment.status !== 'submitted' && assignment.status !== 'graded') {
      return 'HIGH';
    }
    if (diffDays <= 7) {
      return 'MED';
    }
  }

  if (assignment.status === 'in_progress') {
    return 'MED';
  }

  return 'LOW';
}

/**
 * Returns letter grade representation for a percentage.
 */
export function getLetterGrade(percentage: number | null): string | null {
  if (percentage === null) return null;
  if (percentage >= 97) return 'A+ (4.0)';
  if (percentage >= 93) return 'A (4.0)';
  if (percentage >= 90) return 'A- (3.7)';
  if (percentage >= 87) return 'B+ (3.3)';
  if (percentage >= 83) return 'B (3.0)';
  if (percentage >= 80) return 'B- (2.7)';
  if (percentage >= 77) return 'C+ (2.3)';
  if (percentage >= 70) return 'C (2.0)';
  return 'Pass';
}
