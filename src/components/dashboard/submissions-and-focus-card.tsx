import React from 'react';
import Link from 'next/link';
import { getAssignments, type AssignmentWithProject } from '@/lib/actions/assignments';
import { getTodayDate } from '@/lib/utils/date';

interface SubmissionsAndFocusCardProps {
  initialAssignments?: AssignmentWithProject[];
}

export async function SubmissionsAndFocusCard({
  initialAssignments,
}: SubmissionsAndFocusCardProps = {}) {
  let assignments: AssignmentWithProject[] = initialAssignments || [];
  if (!initialAssignments) {
    try {
      assignments = await getAssignments();
    } catch (err) {
      console.error('Error fetching assignments for dashboard widget:', err);
    }
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

  const displayList = pendingAssignments.slice(0, 4);
  const remainingCount = Math.max(0, pendingAssignments.length - displayList.length);

  return (
    <article
      className="h-full rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100/80 dark:border-zinc-800 p-6 sm:p-7 flex flex-col justify-between shadow-sm transition-colors"
      data-purpose="card-upcoming-submissions"
    >
      {/* Card Header */}
      <div className="shrink-0 flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Upcoming Submissions
          </h2>
        </div>
        <Link
          href="/assignments"
          className="text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1 shrink-0"
        >
          <span>View all</span>
          <span>→</span>
        </Link>
      </div>

      {/* Card Content: Deadlines List */}
      <div className="py-3.5 flex flex-col gap-3 flex-1 justify-between">
        <div className="space-y-2.5 min-w-0">
          {displayList.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-400 dark:text-zinc-500 rounded-2xl bg-stone-50/50 dark:bg-zinc-950/40 border border-dashed border-stone-200/80 dark:border-zinc-800">
              No pending assignment deadlines!
            </div>
          ) : (
            displayList.map((assignment) => {
              const isToday = assignment.due_date === todayStr || assignment.status === 'submission_pending';
              let daysDiffLabel = '';
              let daysDiff = 0;
              if (!isToday && assignment.due_date) {
                const diffTime = new Date(assignment.due_date).getTime() - new Date(todayStr).getTime();
                daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                daysDiffLabel = daysDiff > 0 ? `${daysDiff}d` : 'Overdue';
              }

              const dotColor = isToday
                ? 'bg-rose-500'
                : daysDiff <= 2
                ? 'bg-amber-500'
                : 'bg-stone-400 dark:bg-zinc-500';

              return (
                <div
                  key={assignment.id}
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-stone-50/60 dark:bg-zinc-950/40 hover:bg-stone-100 dark:hover:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-800/60 transition-colors min-w-0"
                >
                  <div className="flex items-center space-x-2 truncate pr-2 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                    <span className="text-xs font-medium text-stone-800 dark:text-zinc-200 group-hover:text-stone-950 dark:group-hover:text-zinc-50 truncate">
                      {assignment.title}
                    </span>
                  </div>
                  {isToday ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 shrink-0">
                      Today
                    </span>
                  ) : daysDiff <= 2 ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 shrink-0">
                      {daysDiffLabel}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-medium text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60 shrink-0">
                      {daysDiffLabel || '—'}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-3 shrink-0 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
        <Link
          className="text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 transition-colors font-medium text-[11px]"
          href="/assignments"
        >
          <span>+ {remainingCount} more due this week →</span>
        </Link>
        <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500">
          Sync: LMS Active
        </span>
      </div>
    </article>
  );
}

export function SubmissionsAndFocusSkeleton() {
  return (
    <div className="h-full rounded-3xl bg-white dark:bg-zinc-900 border border-slate-100/80 dark:border-zinc-800 p-6 sm:p-7 flex flex-col justify-between shadow-sm animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="h-7 w-52 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-4 w-16 bg-slate-200 dark:bg-zinc-800 rounded" />
      </div>
      <div className="space-y-3 my-4">
        <div className="h-10 bg-slate-100 dark:bg-zinc-800/50 rounded-xl" />
        <div className="h-10 bg-slate-100 dark:bg-zinc-800/50 rounded-xl" />
        <div className="h-10 bg-slate-100 dark:bg-zinc-800/50 rounded-xl" />
      </div>
      <div className="h-4 w-44 bg-slate-200 dark:bg-zinc-800 rounded mt-2" />
    </div>
  );
}
