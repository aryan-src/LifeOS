'use client';

import React, { useState } from 'react';
import { X, Award, CheckCircle } from 'lucide-react';
import type { AssignmentWithProject } from '@/lib/actions/assignments';

interface GradeModalProps {
  assignment: AssignmentWithProject;
  isOpen: boolean;
  onClose: () => void;
  onGrade: (id: string, marksAchieved: number, totalMarks: number) => Promise<void>;
}

export function GradeModal({ assignment, isOpen, onClose, onGrade }: GradeModalProps) {
  const [marksAchieved, setMarksAchieved] = useState<string>(
    assignment.marks_achieved !== null && assignment.marks_achieved !== undefined
      ? String(assignment.marks_achieved)
      : ''
  );
  const [totalMarks, setTotalMarks] = useState<string>(
    assignment.total_marks !== null && assignment.total_marks !== undefined
      ? String(assignment.total_marks)
      : '100'
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const achievedNum = parseFloat(marksAchieved);
  const totalNum = parseFloat(totalMarks);
  const percentage =
    !isNaN(achievedNum) && !isNaN(totalNum) && totalNum > 0
      ? Math.round((achievedNum / totalNum) * 100)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(achievedNum) || achievedNum < 0) {
      setError('Please enter a valid positive number for marks achieved.');
      return;
    }
    if (isNaN(totalNum) || totalNum <= 0) {
      setError('Total marks must be greater than zero.');
      return;
    }
    if (achievedNum > totalNum) {
      setError('Marks achieved cannot exceed total marks.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onGrade(assignment.id, achievedNum, totalNum);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record grade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-stone-200/80 bg-white dark:bg-stone-900 dark:border-stone-800 p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-base">Record Grade</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">
                {assignment.subject}: {assignment.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Marks Achieved</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={marksAchieved}
                onChange={(e) => setMarksAchieved(e.target.value)}
                placeholder="e.g. 85"
                required
                autoFocus
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Total Marks</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="e.g. 100"
                required
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
              />
            </div>
          </div>

          {percentage !== null && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800/60 text-xs text-stone-600 dark:text-stone-400">
              <span>Computed Score:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                {percentage}%
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <CheckCircle size={14} />
              <span>{isSubmitting ? 'Saving...' : 'Save Grade'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
