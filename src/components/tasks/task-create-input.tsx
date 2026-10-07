'use client';

import React, { useActionState, useEffect, useRef, useState, useMemo } from 'react';
import { Plus, Flag, Folder, Calendar as CalendarIcon, X } from 'lucide-react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { createTask } from '@/lib/actions/tasks';
import type { ActionResponse } from '@/types/action.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { getTodayDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils';

interface TaskCreateInputProps {
  projects: ProjectOption[];
  selectedDueDate?: string;
  onError?: (msg: string) => void;
}

const initialState: ActionResponse = {
  success: false,
};

export function TaskCreateInput({ projects, selectedDueDate, onError }: TaskCreateInputProps) {
  const [state, formAction, isPending] = useActionState(createTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Format today's local date in IST as default YYYY-MM-DD
  const todayStr = getTodayDate();
  const [dueDate, setDueDate] = useState(selectedDueDate || todayStr);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Parse YYYY-MM-DD safely into local Date
  const selectedDateObj = useMemo(() => {
    if (!dueDate) return undefined;
    const parts = dueDate.split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return undefined;
  }, [dueDate]);

  // Formatted human-readable label
  const displayDateLabel = useMemo(() => {
    if (!dueDate || !selectedDateObj) return 'No due date';
    if (isToday(selectedDateObj)) return `Today, ${format(selectedDateObj, 'MMM d')}`;
    if (isTomorrow(selectedDateObj)) return `Tomorrow, ${format(selectedDateObj, 'MMM d')}`;
    return format(selectedDateObj, 'MMM d, yyyy');
  }, [dueDate, selectedDateObj]);

  // Close calendar popover on outside click or Escape key
  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalendarOpen]);

  useEffect(() => {
    if (selectedDueDate) {
      setDueDate(selectedDueDate);
      titleInputRef.current?.focus();
    }
  }, [selectedDueDate]);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setDueDate(selectedDueDate || todayStr);
      setIsCalendarOpen(false);
    } else if (state.error && onError) {
      onError(state.error);
    }
  }, [state, onError, selectedDueDate, todayStr]);

  const handleQuickSelect = (targetDate: Date | null) => {
    if (!targetDate) {
      setDueDate('');
    } else {
      setDueDate(format(targetDate, 'yyyy-MM-dd'));
    }
    setIsCalendarOpen(false);
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all focus-within:shadow-md flex flex-col gap-space-sm"
    >
      <div className="flex items-center gap-space-sm">
        <span className="material-symbols-outlined text-[20px] text-outline">add_circle</span>
        <input
          ref={titleInputRef}
          name="title"
          required
          type="text"
          placeholder="Add a new task (e.g. 'Deploy API route updates')..."
          className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
        />
      </div>

      <div className="mt-space-md pt-space-sm flex flex-wrap items-center justify-between gap-space-sm border-t border-surface-container-high/60 relative">
        <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant">
          {/* Due Date Chip with OriginUI Calendar Popover */}
          <div className="relative">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              aria-haspopup="dialog"
              aria-expanded={isCalendarOpen}
              className={cn(
                "inline-flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer",
                isCalendarOpen && "ring-1 ring-primary/30 bg-surface-container-high"
              )}
            >
              <span className="material-symbols-outlined text-[15px] text-secondary">calendar_today</span>
              <span className="font-medium">{displayDateLabel}</span>
            </button>
            <input type="hidden" name="dueDate" value={dueDate} />

            {/* Origin UI Calendar Popup */}
            {isCalendarOpen && (
              <div
                ref={popoverRef}
                className="absolute left-0 top-full mt-2 z-50 rounded-xl border border-outline-variant/60 bg-surface-container-lowest dark:bg-stone-900 p-3 shadow-xl backdrop-blur-md flex flex-col gap-3 min-w-[280px]"
              >
                {/* Header & Quick Presets */}
                <div className="flex items-center justify-between border-b border-surface-container-high/70 pb-2">
                  <span className="text-[12px] font-mono uppercase tracking-wider text-outline font-semibold">
                    Select Due Date
                  </span>
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => handleQuickSelect(null)}
                      className="text-[11px] font-mono text-outline hover:text-error transition-colors flex items-center gap-1"
                    >
                      <X size={12} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(new Date())}
                    className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(addDays(new Date(), 1))}
                    className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(addDays(new Date(), 7))}
                    className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
                  >
                    Next Week
                  </button>
                </div>

                {/* Origin UI Calendar Picker */}
                <div className="flex justify-center pt-1">
                  <Calendar
                    mode="single"
                    selected={selectedDateObj}
                    onSelect={(date) => {
                      if (date) {
                        setDueDate(format(date, 'yyyy-MM-dd'));
                        setIsCalendarOpen(false);
                      }
                    }}
                    className="p-0 border-0"
                  />
                </div>
              </div>
            )}
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
