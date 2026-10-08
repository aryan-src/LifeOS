'use client';

import React, { useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import type { AssignmentWithProject } from '@/lib/actions/assignments';
import { updateAssignmentStatus } from '@/lib/actions/assignments';
import { formatCalendarDate, getTodayDate } from '@/lib/utils/date';
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

interface UpcomingSubmissionsClientProps {
  initialAssignments: AssignmentWithProject[];
  totalUrgentCount: number;
  hasSubmissionPending: boolean;
}

export function UpcomingSubmissionsClient({
  initialAssignments,
  totalUrgentCount,
  hasSubmissionPending,
}: UpcomingSubmissionsClientProps) {
  const [, startTransition] = useTransition();
  const today = getTodayDate();

  // Optimistic removal when marked as submitted
  const [assignments, setAssignments] = useOptimistic(
    initialAssignments,
    (state, completedId: string) => state.filter((item) => item.id !== completedId)
  );

  const handleMarkSubmitted = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      setAssignments(id);
      await updateAssignmentStatus(id, 'submitted');
    });
  };

  const pendingCount = assignments.filter((a) => a.status === 'submission_pending').length;

  return (
    <section className="w-full rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-4 sm:p-5 shadow-xs transition-all">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-3 border-b border-stone-100 dark:border-stone-800/60">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <GraduationCap size={16} />
          </span>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
              Upcoming Submissions
            </h3>
            {pendingCount > 0 ? (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                {pendingCount} Pending Turn-In
              </span>
            ) : assignments.length > 0 ? (
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                {assignments.length} due soon
              </span>
            ) : null}
          </div>
        </div>

        <Link
          href="/assignments"
          className="text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>View all assignments</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Assignments Grid */}
      {assignments.length === 0 ? (
        <div className="flex items-center justify-between py-2 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>All academic assignments and lab reports are up to date.</span>
          </div>
          <Link
            href="/assignments"
            className="text-stone-600 dark:text-stone-300 hover:underline text-xs font-medium"
          >
            Manage Tracker
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {assignments.map((assignment) => {
            const isPending = assignment.status === 'submission_pending';
            const isOverdue =
              assignment.due_date &&
              assignment.due_date < today &&
              assignment.status !== 'submitted' &&
              assignment.status !== 'graded';
            const isDueToday = assignment.due_date === today;

            return (
              <div
                key={assignment.id}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                  isPending
                    ? 'border-amber-300/80 bg-amber-50/40 dark:border-amber-700/60 dark:bg-amber-950/20'
                    : 'border-stone-200/60 bg-stone-50/50 dark:border-stone-800 dark:bg-stone-900/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 truncate">
                      {assignment.subject}
                    </span>
                    {isPending ? (
                      <span className="text-[10px] font-semibold font-mono text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-300/80">
                        Pending
                      </span>
                    ) : isOverdue ? (
                      <span className="text-[10px] font-semibold font-mono text-rose-600 dark:text-rose-400">
                        Overdue
                      </span>
                    ) : isDueToday ? (
                      <span className="text-[10px] font-semibold font-mono text-amber-600 dark:text-amber-400">
                        Today
                      </span>
                    ) : null}
                  </div>

                  <h4 className="text-xs font-medium text-stone-900 dark:text-stone-100 line-clamp-1">
                    {assignment.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-200/40 dark:border-stone-800/60">
                  <span
                    suppressHydrationWarning
                    className="font-mono text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1"
                  >
                    <Calendar size={11} className="shrink-0" />
                    {formatCalendarDate(assignment.due_date, 'short')}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleMarkSubmitted(assignment.id, e)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:underline cursor-pointer"
                    title="Mark as Submitted"
                  >
                    <CheckCircle2 size={12} />
                    <span>Turn In</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
