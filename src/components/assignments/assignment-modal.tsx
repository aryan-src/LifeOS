'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Calendar } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-stone-200/80 bg-white dark:bg-stone-900 dark:border-stone-800 p-6 sm:p-7 shadow-xl flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
              {isEditing ? <Edit3 size={18} /> : <Plus size={18} />}
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-base">
                {isEditing ? 'Edit Assignment' : 'New Assignment'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Track deliverables, academic deadlines, and scores.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics, Algorithms"
                required
                autoFocus
                className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Problem Set 3: Thermodynamic Potentials"
              required
              className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="submission_pending">Submission Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Associated Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
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
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Total Marks (Optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="e.g. 100"
                className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
              />
            </div>

            {status === 'graded' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Marks Achieved</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={marksAchieved}
                  onChange={(e) => setMarksAchieved(e.target.value)}
                  placeholder="e.g. 92"
                  className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
                />
              </div>
            )}
          </div>

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
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-stone-50 text-xs font-medium transition-colors shadow-xs"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Assignment' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
