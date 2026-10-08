import React from 'react';
import { getAssignments, type AssignmentWithProject } from '@/lib/actions/assignments';
import { getTodayDate } from '@/lib/utils/date';
import { UpcomingSubmissionsClient } from './upcoming-submissions-client';

export function UpcomingSubmissionsSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-4 sm:p-5 shadow-xs animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-stone-200 dark:bg-stone-800 rounded" />
          <div className="h-4 w-44 bg-stone-200 dark:bg-stone-800 rounded" />
        </div>
        <div className="h-4 w-16 bg-stone-200 dark:bg-stone-800 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800"
          />
        ))}
      </div>
    </div>
  );
}

export async function UpcomingSubmissionsWidget() {
  let assignments: AssignmentWithProject[] = [];
  try {
    assignments = await getAssignments();
  } catch (err) {
    console.error('Error fetching assignments for dashboard widget:', err);
  }

  const todayStr = getTodayDate();
  const in48hStr = getTodayDate(new Date(Date.now() + 48 * 60 * 60 * 1000));

  // Urgent assignments:
  // 1. submission_pending
  // 2. OR due date <= 48 hours away (or overdue) and not yet submitted/graded
  const urgentAssignments = assignments.filter((a) => {
    if (a.status === 'submission_pending') return true;
    if (
      a.due_date &&
      a.due_date <= in48hStr &&
      a.status !== 'submitted' &&
      a.status !== 'graded'
    ) {
      return true;
    }
    return false;
  });

  // Sort: submission_pending first, then by closest due date
  urgentAssignments.sort((a, b) => {
    if (a.status === 'submission_pending' && b.status !== 'submission_pending') return -1;
    if (b.status === 'submission_pending' && a.status !== 'submission_pending') return 1;
    const dateA = a.due_date || '9999-99-99';
    const dateB = b.due_date || '9999-99-99';
    return dateA.localeCompare(dateB);
  });

  return (
    <UpcomingSubmissionsClient
      initialAssignments={urgentAssignments.slice(0, 4)}
      totalUrgentCount={urgentAssignments.length}
      hasSubmissionPending={urgentAssignments.some((a) => a.status === 'submission_pending')}
    />
  );
}
