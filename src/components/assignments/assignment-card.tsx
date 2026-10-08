'use client';

import React from 'react';
import { formatCalendarDate, getTodayDate } from '@/lib/utils/date';
import type { AssignmentWithProject } from '@/lib/actions/assignments';
import type { AssignmentStatus } from '@/types/database.types';
import {
  getSubjectBadgeStyle,
  getAssignmentPriority,
} from './assignment-helpers';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  Trash2,
  Edit,
  ArrowRight,
} from 'lucide-react';

interface AssignmentCardProps {
  assignment: AssignmentWithProject;
  onStatusChange: (id: string, status: AssignmentStatus) => void;
  onGradeClick: (assignment: AssignmentWithProject) => void;
  onEditClick: (assignment: AssignmentWithProject) => void;
  onDeleteClick: (id: string) => void;
}

export function AssignmentCard({
  assignment,
  onStatusChange,
  onGradeClick,
  onEditClick,
  onDeleteClick,
}: AssignmentCardProps) {
  const today = getTodayDate();
  const isOverdue =
    assignment.due_date &&
    assignment.due_date < today &&
    assignment.status !== 'submitted' &&
    assignment.status !== 'graded';

  const isDueToday = assignment.due_date === today;
  const isPendingSubmission = assignment.status === 'submission_pending';
  const isGraded = assignment.status === 'graded';
  const isSubmitted = assignment.status === 'submitted';

  const priority = getAssignmentPriority(assignment, today);

  const percentage =
    assignment.marks_achieved !== null &&
    assignment.total_marks !== null &&
    assignment.total_marks > 0
      ? Math.round((assignment.marks_achieved / assignment.total_marks) * 100)
      : null;

  // Card border styling
  const cardBorderClass = isPendingSubmission
    ? 'border-amber-300 dark:border-amber-700/70 ring-1 ring-amber-200/60 dark:ring-amber-900/40 bg-white dark:bg-stone-900'
    : 'border-[#EAE6DF] dark:border-stone-800 bg-white dark:bg-stone-900';

  return (
    <article
      data-subject={assignment.subject}
      data-priority={priority}
      className={`rounded-xl p-5 border ${cardBorderClass} shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between gap-3 group`}
    >
      <div className="flex flex-col gap-2.5 min-w-0">
        {/* Top Header: Subject Badge & Status/Priority Tag & Action Icons */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span
            className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-md border truncate ${getSubjectBadgeStyle(
              assignment.subject
            )}`}
          >
            {assignment.subject}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Status / Priority Badges */}
            {isPendingSubmission ? (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                Action Needed
              </span>
            ) : isGraded && percentage !== null ? (
              <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold text-xs dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                <span>
                  {assignment.marks_achieved}/{assignment.total_marks}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  ({percentage}%)
                </span>
              </div>
            ) : isSubmitted ? (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                Awaiting Review
              </span>
            ) : priority === 'HIGH' ? (
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                P1 High
              </span>
            ) : priority === 'MED' ? (
              <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded dark:bg-stone-800 dark:text-stone-300">
                P2 Medium
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded dark:bg-stone-800 dark:text-stone-400">
                P3 Low
              </span>
            )}

            {/* Quick Edit/Delete Hover Icons */}
            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity pl-1 border-l border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => onEditClick(assignment)}
                title="Edit assignment"
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
              >
                <Edit size={12} />
              </button>
              <button
                type="button"
                onClick={() => onDeleteClick(assignment.id)}
                title="Delete assignment"
                className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-stone-100 leading-snug line-clamp-2">
          {assignment.title}
        </h3>

        {/* Project Tag */}
        {assignment.project && (
          <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 truncate">
            #{assignment.project.slug} • {assignment.project.title}
          </span>
        )}

        {/* Submission Pending Inline Action Box */}
        {isPendingSubmission && (
          <div className="mt-2.5 p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between gap-3 flex-wrap">
            <span
              className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5"
              suppressHydrationWarning
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              {assignment.due_date ? (
                isDueToday ? (
                  'Due Tonight 11:59 PM'
                ) : isOverdue ? (
                  'Overdue'
                ) : (
                  `Due ${formatCalendarDate(assignment.due_date, 'short')}`
                )
              ) : (
                'Action Required'
              )}
            </span>
            <button
              type="button"
              onClick={() => onStatusChange(assignment.id, 'submitted')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Turn In</span>
              <ArrowRight className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Card Footer / Contextual Metadata & Actions */}
      <div className="mt-2 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 flex-wrap gap-2">
        {isSubmitted ? (
          <>
            <span
              className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium"
              suppressHydrationWarning
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {assignment.due_date
                ? `Turned in ${formatCalendarDate(assignment.due_date, 'short')}`
                : 'Turned In'}
            </span>
            <button
              type="button"
              onClick={() => onGradeClick(assignment)}
              className="text-xs font-medium text-stone-600 hover:text-[#1A1A1A] dark:text-stone-300 dark:hover:text-white underline cursor-pointer"
            >
              Grade
            </button>
          </>
        ) : isGraded ? (
          <>
            <span suppressHydrationWarning>
              {assignment.due_date
                ? `${formatCalendarDate(assignment.due_date, 'short')} evaluation`
                : 'Evaluated'}
            </span>
            <button
              type="button"
              onClick={() => onGradeClick(assignment)}
              className="text-xs font-medium text-stone-600 hover:text-[#1A1A1A] dark:text-stone-300 dark:hover:text-white underline cursor-pointer"
            >
              Edit Grade
            </button>
          </>
        ) : (
          <>
            <div
              className="flex items-center space-x-1.5 text-stone-500 dark:text-stone-400"
              suppressHydrationWarning
            >
              <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span
                className={
                  isOverdue
                    ? 'text-rose-600 dark:text-rose-400 font-medium'
                    : isDueToday
                    ? 'text-amber-600 dark:text-amber-400 font-medium'
                    : ''
                }
              >
                {assignment.due_date
                  ? formatCalendarDate(assignment.due_date, 'short')
                  : 'No due date'}
                {isOverdue && ' (Overdue)'}
                {isDueToday && ' (Today)'}
              </span>
            </div>

            <select
              value={assignment.status}
              onChange={(e) =>
                onStatusChange(assignment.id, e.target.value as AssignmentStatus)
              }
              className="text-[11px] font-medium px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer focus:outline-none"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="submission_pending">Submission Pending</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
            </select>
          </>
        )}
      </div>
    </article>
  );
}
