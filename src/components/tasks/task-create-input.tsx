'use client';

import React, { useActionState, useEffect, useRef } from 'react';
import { Plus, Calendar, Flag, Folder } from 'lucide-react';
import { createTask } from '@/lib/actions/tasks';
import type { ActionResponse } from '@/types/action.types';
import type { ProjectOption } from '@/lib/actions/projects-options';

interface TaskCreateInputProps {
  projects: ProjectOption[];
  onError?: (msg: string) => void;
}

const initialState: ActionResponse = {
  success: false,
};

export function TaskCreateInput({ projects, onError }: TaskCreateInputProps) {
  const [state, formAction, isPending] = useActionState(createTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    } else if (state.error && onError) {
      onError(state.error);
    }
  }, [state, onError]);

  // Format today's local date as default YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all focus-within:shadow-md flex flex-col gap-space-sm"
    >
      <div className="flex items-center gap-space-sm">
        <span className="material-symbols-outlined text-[20px] text-outline">add_circle</span>
        <input
          name="title"
          required
          type="text"
          placeholder="Add a new task (e.g. 'Deploy API route updates')..."
          className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
        />
      </div>

      <div className="mt-space-md pt-space-sm flex flex-wrap items-center justify-between gap-space-sm border-t border-surface-container-high/60">
        <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant">
          {/* Due Date Chip */}
          <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors">
            <span className="material-symbols-outlined text-[15px] text-secondary">calendar_today</span>
            <input
              suppressHydrationWarning
              name="dueDate"
              type="date"
              defaultValue={todayStr}
              className="bg-transparent text-on-surface font-label-sm text-label-sm focus:outline-none cursor-pointer"
            />
          </div>

          {/* Priority Selector Chip */}
          <div className="inline-flex items-center gap-1 px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors">
            <span className="w-2 h-2 rounded-full bg-on-tertiary-container"></span>
            <select
              name="priority"
              defaultValue="2"
              className="bg-transparent text-on-surface font-label-sm text-label-sm focus:outline-none cursor-pointer pr-1"
            >
              <option value="4" className="bg-surface-container-lowest text-error">P1 - Urgent</option>
              <option value="3" className="bg-surface-container-lowest text-on-tertiary-container">P2 - High</option>
              <option value="2" className="bg-surface-container-lowest text-on-surface">P3 - Medium</option>
              <option value="1" className="bg-surface-container-lowest text-outline">P4 - Low</option>
            </select>
          </div>

          {/* Project Link Chip */}
          {projects.length > 0 && (
            <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors">
              <span className="material-symbols-outlined text-[15px] text-outline">folder</span>
              <select
                name="projectId"
                defaultValue="none"
                className="bg-transparent text-on-surface font-label-sm text-label-sm focus:outline-none cursor-pointer max-w-[130px] truncate pr-1"
              >
                <option value="none" className="bg-surface-container-lowest text-outline">Personal Workspace</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-surface-container-lowest text-on-surface">
                    #{p.slug}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-space-md py-1.5 rounded bg-primary text-on-primary font-body-sm text-body-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.99] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>{isPending ? 'Adding...' : 'Add Task'}</span>
        </button>
      </div>

      {state.error && (
        <p className="text-xs text-error mt-1">{state.error}</p>
      )}
    </form>
  );
}
