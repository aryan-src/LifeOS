'use client';

import React, { useState, useTransition } from 'react';
import { createProject, type ProjectWithMetrics } from '@/lib/actions/projects';
import type { ProjectStatus } from '@/types/database.types';
import { X, FolderPlus } from 'lucide-react';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: ProjectStatus;
  onSuccess?: (project: ProjectWithMetrics) => void;
}

export function ProjectCreateModal({
  isOpen,
  onClose,
  defaultStatus = 'active',
  onSuccess,
}: ProjectCreateModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createProject(null, formData);
      if (res.success && res.data) {
        onSuccess?.({
          ...res.data,
          total_tasks: 0,
          completed_tasks: 0,
          completion_percentage: 0,
          total_spend: 0,
        });
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to create project.');
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/60 dark:border-zinc-800/80 bg-stone-50/60 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="create-project-title"
                className="text-base font-semibold text-stone-900 dark:text-zinc-100"
              >
                Initiate New Project
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Create a milestone track with budget, priority, and timeline targets.
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
                autoFocus
                placeholder="e.g. 'Operating System Revision'"
                className="w-full bg-white dark:bg-zinc-800/70 border border-stone-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2A4B3D]/20 focus:border-[#2A4B3D] dark:focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Initial Status
              </label>
              <select
                name="status"
                defaultValue={defaultStatus}
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
                className="w-full bg-white dark:bg-zinc-800/70 border border-stone-200 dark:border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#2A4B3D]/20 focus:border-[#2A4B3D] dark:focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Priority Tier
              </label>
              <select
                name="priority"
                defaultValue="2"
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
                defaultValue="0"
                placeholder="0.00"
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
                placeholder="High-level objectives, deliverables, and requirements..."
                className="w-full bg-white dark:bg-zinc-800/70 border border-stone-200 dark:border-zinc-700/80 rounded-xl p-3 text-sm text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2A4B3D]/20 focus:border-[#2A4B3D] dark:focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200/60 dark:border-zinc-800/80">
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
              {isPending ? 'Initiating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
