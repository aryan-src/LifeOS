'use client';

import React, { useState, useTransition } from 'react';
import { updateProject, deleteProject, type ProjectWithMetrics } from '@/lib/actions/projects';
import type { ProjectStatus } from '@/types/database.types';
import { X, Edit3, Trash2 } from 'lucide-react';

interface ProjectEditModalProps {
  project: ProjectWithMetrics | null;
  onClose: () => void;
  onSave?: (updated: Partial<ProjectWithMetrics> & { id: string }) => void;
  onDelete?: (id: string) => void;
}

export function ProjectEditModal({
  project,
  onClose,
  onSave,
  onDelete,
}: ProjectEditModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!project) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    const title = (formData.get('title') as string) || project.title;
    const description = (formData.get('description') as string) || null;
    const status = (formData.get('status') as ProjectStatus) || project.status;
    const priority = Number(formData.get('priority')) || project.priority;
    const budget = Number(formData.get('budget')) || 0;
    const targetDate = (formData.get('targetDate') as string) || null;

    startTransition(async () => {
      const res = await updateProject(project.id, {
        title,
        description,
        status,
        priority,
        budget,
        targetDate,
      });

      if (res.success && res.data) {
        onSave?.({
          id: project.id,
          title: res.data.title,
          description: res.data.description,
          status: res.data.status,
          priority: res.data.priority,
          budget: res.data.budget,
          target_date: res.data.target_date,
        });
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to update project.');
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete "${project.title}"?`)) return;

    startTransition(async () => {
      onDelete?.(project.id);
      const res = await deleteProject(project.id);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete project.');
      } else {
        onClose();
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/60 dark:border-zinc-800/80 bg-stone-50/60 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="edit-project-title"
                className="text-base font-semibold text-stone-900 dark:text-zinc-100"
              >
                Edit Project
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400 font-mono">
                #{project.slug}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                name="title"
                required
                defaultValue={project.title}
                className="w-full bg-white dark:bg-zinc-800/70 border border-stone-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#2A4B3D]/20 focus:border-[#2A4B3D] dark:focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Status
              </label>
              <select
                name="status"
                defaultValue={project.status}
                className="w-full bg-white dark:bg-zinc-800/70 border border-stone-200 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#2A4B3D]/20 focus:border-[#2A4B3D] dark:focus:border-emerald-500"
              >
                <option value="backlog">Backlog</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Target Deadline
              </label>
              <input
                name="targetDate"
                type="date"
                defaultValue={project.target_date || ''}
                className="w-full bg-white dark:bg-zinc-800/70 border border-stone-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#2A4B3D]/20 focus:border-[#2A4B3D] dark:focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Priority
              </label>
              <select
                name="priority"
                defaultValue={String(project.priority)}
                className="w-full bg-white dark:bg-zinc-800/70 border border-stone-200 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#2A4B3D]/20 focus:border-[#2A4B3D] dark:focus:border-emerald-500"
              >
                <option value="4">P1 - Urgent</option>
                <option value="3">P2 - High</option>
                <option value="2">P3 - Medium</option>
                <option value="1">P4 - Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Allocated Budget (₹)
              </label>
              <input
                name="budget"
                type="number"
                step="0.01"
                min="0"
                defaultValue={project.budget}
                className="w-full bg-white dark:bg-zinc-800/70 border border-stone-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#2A4B3D]/20 focus:border-[#2A4B3D] dark:focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Description & Scope
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={project.description || ''}
                className="w-full bg-white dark:bg-zinc-800/70 border border-stone-200 dark:border-zinc-700/80 rounded-xl p-3 text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2A4B3D]/20 focus:border-[#2A4B3D] dark:focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-stone-200/60 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Project
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-1.5 bg-[#2A4B3D] hover:bg-[#20392e] text-white px-5 py-2 rounded-xl text-xs font-medium shadow-xs transition duration-150 active:scale-[0.98] disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
