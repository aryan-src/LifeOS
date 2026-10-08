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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/25 dark:bg-black/40 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/60 dark:border-stone-700/60 bg-[#FAF8F5]/85 dark:bg-stone-900/85 backdrop-blur-xl backdrop-saturate-150 shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-1 ring-black/5 dark:ring-white/10 p-6 sm:p-8 flex flex-col gap-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between pb-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs backdrop-blur-sm">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base tracking-tight">
                Record Grade
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                {assignment.subject}: {assignment.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl p-1.5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 backdrop-blur-sm text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
                Marks Achieved
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={marksAchieved}
                onChange={(e) => setMarksAchieved(e.target.value)}
                placeholder="e.g. 85"
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:bg-white/95 dark:focus:bg-stone-800/95 focus:ring-2 focus:ring-stone-400/20 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
                Total Marks
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="e.g. 100"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:bg-white/95 dark:focus:bg-stone-800/95 focus:ring-2 focus:ring-stone-400/20 transition-all"
              />
            </div>
          </div>

          {percentage !== null && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 dark:bg-stone-800/70 border border-stone-200/60 dark:border-stone-700/60 backdrop-blur-sm text-xs text-stone-700 dark:text-stone-300">
              <span className="font-medium">Computed Score:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm font-mono">
                {percentage}%
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 mt-1 border-t border-stone-200/60 dark:border-stone-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
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
