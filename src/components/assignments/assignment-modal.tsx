'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3 } from 'lucide-react';
import type { AssignmentWithProject, CreateAssignmentInput } from '@/lib/actions/assignments';
import type { ProjectOption } from '@/lib/actions/projects-options';
import type { AssignmentStatus } from '@/types/database.types';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAssignmentInput, id?: string) => Promise<void>;
  initialAssignment?: AssignmentWithProject | null;
  defaultStatus?: AssignmentStatus;
  projects: ProjectOption[];
}

export function AssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  initialAssignment,
  defaultStatus,
  projects,
}: AssignmentModalProps) {
  const isEditing = Boolean(initialAssignment);

  const [subject, setSubject] = useState(initialAssignment?.subject || '');
  const [title, setTitle] = useState(initialAssignment?.title || '');
  const [dueDate, setDueDate] = useState(initialAssignment?.due_date || '');
  const [status, setStatus] = useState<AssignmentStatus>(
    initialAssignment?.status || defaultStatus || 'not_started'
  );
  const [projectId, setProjectId] = useState<string>(initialAssignment?.project_id || '');
  const [totalMarks, setTotalMarks] = useState<string>(
    initialAssignment?.total_marks ? String(initialAssignment.total_marks) : ''
  );
  const [marksAchieved, setMarksAchieved] = useState<string>(
    initialAssignment?.marks_achieved ? String(initialAssignment.marks_achieved) : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubject(initialAssignment?.subject || '');
      setTitle(initialAssignment?.title || '');
      setDueDate(initialAssignment?.due_date || '');
      setStatus(initialAssignment?.status || defaultStatus || 'not_started');
      setProjectId(initialAssignment?.project_id || '');
      setTotalMarks(initialAssignment?.total_marks ? String(initialAssignment.total_marks) : '');
      setMarksAchieved(initialAssignment?.marks_achieved ? String(initialAssignment.marks_achieved) : '');
      setError(null);
    }
  }, [isOpen, initialAssignment, defaultStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim()) {
      setError('Please enter a subject (e.g. Physics, CS, Math).');
      return;
    }
    if (!title.trim()) {
      setError('Please enter an assignment title.');
      return;
    }

    const payload: CreateAssignmentInput = {
      subject: subject.trim(),
      title: title.trim(),
      due_date: dueDate.trim() || null,
      status,
      project_id: projectId.trim() || null,
      total_marks: totalMarks ? parseFloat(totalMarks) : null,
      marks_achieved: marksAchieved ? parseFloat(marksAchieved) : null,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(payload, initialAssignment?.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save assignment.');
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
        className="w-full max-w-lg rounded-3xl border border-white/60 dark:border-stone-700/60 bg-[#FAF8F5]/85 dark:bg-stone-900/85 backdrop-blur-xl backdrop-saturate-150 shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-1 ring-black/5 dark:ring-white/10 p-6 sm:p-8 flex flex-col gap-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 dark:bg-stone-800/70 border border-white/80 dark:border-stone-700/60 shadow-xs text-stone-800 dark:text-stone-200 backdrop-blur-sm">
              {isEditing ? <Edit3 size={18} /> : <Plus size={18} />}
            </div>
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base tracking-tight">
                {isEditing ? 'Edit Assignment' : 'New Assignment'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Track deliverables, academic deadlines, and scores.
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

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 backdrop-blur-sm text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics, Algorithms"
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:bg-white/95 dark:focus:bg-stone-800/95 focus:ring-2 focus:ring-stone-400/20 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:bg-white/95 dark:focus:bg-stone-800/95 focus:ring-2 focus:ring-stone-400/20 transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
              Assignment Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Problem Set 3: Thermodynamic Potentials"
              required
              className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:bg-white/95 dark:focus:bg-stone-800/95 focus:ring-2 focus:ring-stone-400/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:bg-white/95 dark:focus:bg-stone-800/95 focus:ring-2 focus:ring-stone-400/20 transition-all cursor-pointer"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="submission_pending">Submission Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
                Associated Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:bg-white/95 dark:focus:bg-stone-800/95 focus:ring-2 focus:ring-stone-400/20 transition-all cursor-pointer"
              >
                <option value="">No Project (Independent)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.slug} — {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
                Total Marks (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="e.g. 100"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:bg-white/95 dark:focus:bg-stone-800/95 focus:ring-2 focus:ring-stone-400/20 transition-all"
              />
            </div>

            {status === 'graded' && (
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
                  placeholder="e.g. 92"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:bg-white/95 dark:focus:bg-stone-800/95 focus:ring-2 focus:ring-stone-400/20 transition-all"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
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
              className="px-5 py-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-900 dark:bg-stone-100 dark:hover:bg-white backdrop-blur-sm text-white dark:text-stone-900 text-xs font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                ? 'Update Assignment'
                : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
