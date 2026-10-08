'use client';

import React from 'react';
import { formatCalendarDate, getTodayDate } from '@/lib/utils/date';
import type { AssignmentWithProject } from '@/lib/actions/assignments';
import type { AssignmentStatus } from '@/types/database.types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  MoreVertical,
  Trash2,
  Edit,
  ArrowRight,
  AlertCircle,
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

  // Status-specific card accent styles
  const isPendingSubmission = assignment.status === 'submission_pending';
  const isCompleted = assignment.status === 'submitted' || assignment.status === 'graded';

  let cardAccentBorder = 'border-stone-200/70 dark:border-stone-800';
  let cardAccentBg = 'bg-white dark:bg-stone-900';

  if (isPendingSubmission) {
    cardAccentBorder = 'border-amber-300/80 dark:border-amber-700/60 ring-1 ring-amber-400/20';
    cardAccentBg = 'bg-amber-50/40 dark:bg-amber-950/20';
  } else if (isCompleted) {
    cardAccentBorder = 'border-emerald-200/80 dark:border-emerald-800/40';
  }

  const percentage =
    assignment.marks_achieved !== null &&
    assignment.total_marks !== null &&
    assignment.total_marks > 0
      ? Math.round((assignment.marks_achieved / assignment.total_marks) * 100)
      : null;

  return (
    <div
      className={`rounded-2xl border ${cardAccentBorder} ${cardAccentBg} p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-3 min-w-0 group`}
    >
      <div className="flex flex-col gap-2.5 min-w-0">
        {/* Top Header: Subject Badge & Menu */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 truncate">
            {assignment.subject}
          </span>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEditClick(assignment)}
              title="Edit assignment"
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <Edit size={13} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteClick(assignment.id)}
              title="Delete assignment"
              className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm leading-snug line-clamp-2">
          {assignment.title}
        </h4>

        {/* Project association tag */}
        {assignment.project && (
          <span className="font-label-sm text-[11px] text-stone-500 dark:text-stone-400 truncate">
            #{assignment.project.slug} • {assignment.project.title}
          </span>
        )}

        {/* Due Date & Urgency Indicator */}
        {assignment.due_date && (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar size={13} className="text-stone-400 shrink-0" />
            <span
              suppressHydrationWarning
              className={`font-mono text-[11px] ${
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-medium'
                  : isDueToday
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {formatCalendarDate(assignment.due_date, 'short')}
              {isOverdue && ' (Overdue)'}
              {isDueToday && ' (Today)'}
            </span>
          </div>
        )}

        {/* Graded Marks Pill */}
        {assignment.status === 'graded' && percentage !== null && (
          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
            <span className="flex items-center gap-1">
              <Award size={13} />
              <span>Score:</span>
            </span>
            <span className="font-semibold font-mono">
              {assignment.marks_achieved}/{assignment.total_marks} ({percentage}%)
            </span>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-2 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between gap-2 mt-1">
        {/* Status Dropdown / Quick Transition */}
        <select
          value={assignment.status}
          onChange={(e) => onStatusChange(assignment.id, e.target.value as AssignmentStatus)}
          className={`text-[11px] font-medium px-2 py-1 rounded-lg border focus:outline-none cursor-pointer transition-colors ${
            assignment.status === 'submission_pending'
              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
              : assignment.status === 'submitted' || assignment.status === 'graded'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              : assignment.status === 'in_progress'
              ? 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
              : 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
          }`}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="submission_pending">Submission Pending</option>
          <option value="submitted">Submitted</option>
          <option value="graded">Graded</option>
        </select>

        {/* Contextual Quick Actions */}
        {assignment.status !== 'submitted' && assignment.status !== 'graded' ? (
          <button
            type="button"
            onClick={() => onStatusChange(assignment.id, 'submitted')}
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:underline cursor-pointer"
          >
            <CheckCircle2 size={12} />
            <span>Mark Submitted</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onGradeClick(assignment)}
            className="flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:underline cursor-pointer"
          >
            <Award size={12} />
            <span>{assignment.status === 'graded' ? 'Edit Grade' : 'Grade'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
