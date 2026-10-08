'use client';

import React from 'react';
import { formatCalendarDate, getTodayDate } from '@/lib/utils/date';
import type { AssignmentWithProject } from '@/lib/actions/assignments';
import type { AssignmentStatus } from '@/types/database.types';
import {
  Calendar,
  CheckCircle2,
  Award,
  Trash2,
  Edit,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface AssignmentRowProps {
  assignment: AssignmentWithProject;
  onStatusChange: (id: string, status: AssignmentStatus) => void;
  onGradeClick: (assignment: AssignmentWithProject) => void;
  onEditClick: (assignment: AssignmentWithProject) => void;
  onDeleteClick: (id: string) => void;
}

export function AssignmentRow({
  assignment,
  onStatusChange,
  onGradeClick,
  onEditClick,
  onDeleteClick,
}: AssignmentRowProps) {
  const today = getTodayDate();
  const isOverdue =
    assignment.due_date &&
    assignment.due_date < today &&
    assignment.status !== 'submitted' &&
    assignment.status !== 'graded';

  const isDueToday = assignment.due_date === today;
  const isPendingSubmission = assignment.status === 'submission_pending';

  const percentage =
    assignment.marks_achieved !== null &&
    assignment.total_marks !== null &&
    assignment.total_marks > 0
      ? Math.round((assignment.marks_achieved / assignment.total_marks) * 100)
      : null;

  return (
    <tr className="border-b border-stone-200/60 dark:border-stone-800/80 hover:bg-stone-50/60 dark:hover:bg-stone-900/40 transition-colors group">
      {/* Subject */}
      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
          {assignment.subject}
        </span>
      </td>

      {/* Title & Project */}
      <td className="py-3 px-3 sm:px-4">
        <div className="flex flex-col min-w-0 max-w-xs sm:max-w-md">
          <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
            {assignment.title}
          </span>
          {assignment.project && (
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 truncate">
              #{assignment.project.slug} • {assignment.project.title}
            </span>
          )}
        </div>
      </td>

      {/* Due Date */}
      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
        {assignment.due_date ? (
          <div className="flex items-center gap-1.5 text-xs">
            {isOverdue ? (
              <AlertTriangle size={13} className="text-rose-500 shrink-0" />
            ) : isDueToday ? (
              <Clock size={13} className="text-amber-500 shrink-0" />
            ) : (
              <Calendar size={13} className="text-stone-400 shrink-0" />
            )}
            <span
              suppressHydrationWarning
              className={`font-mono text-xs ${
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400 font-medium'
                  : isDueToday
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              {formatCalendarDate(assignment.due_date, 'short')}
              {isOverdue && ' (Overdue)'}
              {isDueToday && ' (Today)'}
            </span>
          </div>
        ) : (
          <span className="text-xs text-stone-400 italic">No date</span>
        )}
      </td>

      {/* Status */}
      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
        <select
          value={assignment.status}
          onChange={(e) => onStatusChange(assignment.id, e.target.value as AssignmentStatus)}
          className={`text-xs font-medium px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer transition-colors ${
            isPendingSubmission
              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
              : assignment.status === 'submitted' || assignment.status === 'graded'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : assignment.status === 'in_progress'
              ? 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
              : 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
          }`}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="submission_pending">Submission Pending</option>
          <option value="submitted">Submitted</option>
          <option value="graded">Graded</option>
        </select>
      </td>

      {/* Grade / Marks */}
      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
        {assignment.status === 'graded' && percentage !== null ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
            <Award size={12} />
            {assignment.marks_achieved}/{assignment.total_marks} ({percentage}%)
          </span>
        ) : (
          <span className="text-xs text-stone-400">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
          {assignment.status !== 'submitted' && assignment.status !== 'graded' ? (
            <button
              type="button"
              onClick={() => onStatusChange(assignment.id, 'submitted')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2 py-1 rounded-md transition-colors"
              title="Mark as Submitted"
            >
              <CheckCircle2 size={13} />
              <span className="hidden sm:inline">Submit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onGradeClick(assignment)}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 px-2 py-1 rounded-md transition-colors"
              title="Record / Edit Grade"
            >
              <Award size={13} />
              <span className="hidden sm:inline">{assignment.status === 'graded' ? 'Edit Grade' : 'Grade'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEditClick(assignment)}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
            title="Edit"
          >
            <Edit size={13} />
          </button>

          <button
            type="button"
            onClick={() => onDeleteClick(assignment.id)}
            className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
