import React from 'react';
import Link from 'next/link';
import { getAssignments, type AssignmentWithProject } from '@/lib/actions/assignments';
import { getTodayDate } from '@/lib/utils/date';
import { FocusCockpitWidget } from './focus-cockpit-widget';

export async function SubmissionsAndFocusCard() {
  let assignments: AssignmentWithProject[] = [];
  try {
    assignments = await getAssignments();
  } catch (err) {
    console.error('Error fetching assignments for dashboard widget:', err);
  }

  const todayStr = getTodayDate();

  // Urgent/pending assignments
  const pendingAssignments = (assignments || []).filter(
    (a) => a.status !== 'graded' && a.status !== 'submitted'
  );

  pendingAssignments.sort((a, b) => {
    if (a.status === 'submission_pending' && b.status !== 'submission_pending') return -1;
    if (b.status === 'submission_pending' && a.status !== 'submission_pending') return 1;
    const dateA = a.due_date || '9999-99-99';
    const dateB = b.due_date || '9999-99-99';
    return dateA.localeCompare(dateB);
  });

  const displayList = pendingAssignments.slice(0, 3);
  const remainingCount = Math.max(0, pendingAssignments.length - displayList.length);

  return (
    <section className="w-full h-full min-w-0 bg-white dark:bg-zinc-900/70 text-[#07343C] dark:text-zinc-100 rounded-2xl p-5 flex flex-col justify-between border border-[#07343C]/10 dark:border-zinc-800/60 shadow-xs transition-colors">
      {/* Upcoming Submissions Section */}
      <div>
        <div className="flex items-baseline justify-between mb-1 pb-1 border-b border-[#07343C]/10 dark:border-zinc-800/60">
          <h2 className="font-serif text-[16px] xl:text-[17px] font-bold text-[#07343C] dark:text-zinc-100">
            Upcoming Submissions
          </h2>
          <Link
            href="/assignments"
            className="text-[11px] font-medium text-[#07343C]/70 dark:text-zinc-400 hover:text-[#07343C] dark:hover:text-zinc-100 underline decoration-[#07343C]/30 dark:decoration-zinc-700"
          >
            View all →
          </Link>
        </div>

        <div className="divide-y divide-[#07343C]/10 dark:divide-zinc-800/60">
          {displayList.length === 0 ? (
            <div className="py-4 text-center text-[12px] text-[#07343C]/60 dark:text-zinc-400">
              No pending assignment deadlines!
            </div>
          ) : (
            displayList.map((assignment) => {
              const isToday = assignment.due_date === todayStr || assignment.status === 'submission_pending';
              let daysDiffLabel = '';
              if (!isToday && assignment.due_date) {
                const diffTime = new Date(assignment.due_date).getTime() - new Date(todayStr).getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                daysDiffLabel = diffDays > 0 ? `${diffDays}d` : 'Overdue';
              }

              const courseLabel = assignment.project
                ? `${assignment.project.slug.toUpperCase()} · ${assignment.status.replace('_', ' ')}`
                : 'COURSE · Assignment';

              return (
                <div key={assignment.id} className="py-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#07343C]/70 dark:text-zinc-400 uppercase tracking-wider font-semibold truncate font-mono">
                      {courseLabel}
                    </p>
                    <p className="text-[12px] font-semibold text-[#07343C] dark:text-zinc-100 leading-tight truncate">
                      {assignment.title}
                    </p>
                  </div>
                  {isToday ? (
                    <span className="font-serif text-[14px] xl:text-[15px] font-bold text-[#BE123C] dark:text-rose-400 shrink-0 px-2 py-0.5 rounded bg-[#FFF1F2] dark:bg-rose-950/40 border border-[#FECDD3] dark:border-rose-900/60 font-mono">
                      Today
                    </span>
                  ) : (
                    <span className="font-serif text-[15px] xl:text-[16px] font-bold text-[#07343C] dark:text-zinc-200 shrink-0 font-mono">
                      {daysDiffLabel || '—'}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {remainingCount > 0 && (
          <div className="pt-1.5">
            <Link
              href="/assignments"
              className="text-[11px] xl:text-[12px] font-medium text-[#07343C]/80 dark:text-zinc-400 hover:text-[#07343C] dark:hover:text-zinc-100 hover:underline"
            >
              + {remainingCount} more due this week →
            </Link>
          </div>
        )}
      </div>

      {/* Focus Timer Cockpit */}
      <FocusCockpitWidget />
    </section>
  );
}

export function SubmissionsAndFocusSkeleton() {
  return (
    <div className="min-w-0 bg-white dark:bg-zinc-900/70 rounded-2xl p-4 flex flex-col justify-between h-full border border-[#07343C]/10 dark:border-zinc-800/60 shadow-xs animate-pulse">
      <div className="h-5 w-44 bg-stone-200 dark:bg-zinc-800 rounded mb-3" />
      <div className="space-y-3">
        <div className="h-9 bg-stone-100 dark:bg-zinc-800/50 rounded" />
        <div className="h-9 bg-stone-100 dark:bg-zinc-800/50 rounded" />
      </div>
      <div className="pt-4 border-t border-[#07343C]/10 dark:border-zinc-800/60 mt-4">
        <div className="h-24 bg-stone-100 dark:bg-zinc-800/50 rounded-xl" />
      </div>
    </div>
  );
}
