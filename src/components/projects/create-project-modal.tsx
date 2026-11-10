'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createProject, type ProjectWithMetrics } from '@/lib/actions/projects';
import type { ProjectStatus } from '@/types/database.types';
import { X, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

export type ExtendedProjectStatus = ProjectStatus | 'planning';

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: ExtendedProjectStatus;
  onSuccess?: (project: ProjectWithMetrics) => void;
  currencySymbol?: string;
}

const STATUS_OPTIONS: { id: ExtendedProjectStatus; label: string; dotClass: string }[] = [
  { id: 'backlog', label: 'Backlog', dotClass: 'bg-stone-400 dark:bg-zinc-500' },
  { id: 'planning', label: 'Planning', dotClass: 'bg-stone-400 dark:bg-zinc-500' },
  { id: 'active', label: 'Active', dotClass: 'bg-[#10B981] ring-2 ring-emerald-500/20' },
  { id: 'paused', label: 'Paused', dotClass: 'bg-amber-400 dark:bg-amber-500' },
  { id: 'completed', label: 'Completed', dotClass: 'bg-blue-400 dark:bg-blue-500' },
];

const PRIORITY_OPTIONS = [
  {
    level: 4,
    label: 'P1 Urgent',
    activeClass:
      'border-rose-300 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-200 ring-2 ring-rose-500/20 shadow-xs font-semibold',
    inactiveClass:
      'border-rose-200/70 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 text-rose-700 dark:text-rose-300 font-medium',
    icon: (
      <svg
        className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    level: 3,
    label: 'P2 High',
    activeClass:
      'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-xs font-semibold',
    inactiveClass:
      'border-amber-200/70 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 text-amber-700 dark:text-amber-300 font-medium',
    icon: (
      <svg
        className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path
          d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    level: 2,
    label: 'P3 Medium',
    activeClass:
      'border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs font-semibold',
    inactiveClass:
      'border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 text-emerald-800 dark:text-emerald-300 font-medium',
    icon: (
      <svg
        className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    level: 1,
    label: 'P4 Low',
    activeClass:
      'border-stone-300 dark:border-zinc-600 bg-stone-200/80 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 ring-2 ring-stone-500/20 shadow-xs font-semibold',
    inactiveClass:
      'border-stone-200/80 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-800/40 hover:bg-stone-200/60 text-stone-600 dark:text-zinc-400 font-medium',
    icon: (
      <svg
        className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path
          d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/**
 * Converts a YYYY-MM-DD ISO string to DD/MM/YYYY string without timezone drift
 */
function toDisplayDMY(isoDateStr: string): string {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDateStr;
}

/**
 * Parses user input (DD/MM/YYYY or YYYY-MM-DD) into strict YYYY-MM-DD without UTC timezone drift
 */
function toIsoDate(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return '';
}

export function CreateProjectModal({
  isOpen,
  onClose,
  defaultStatus = 'active',
  onSuccess,
  currencySymbol = '₹',
}: CreateProjectModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<ExtendedProjectStatus>(defaultStatus);
  const [priority, setPriority] = useState<number>(2); // P3 Medium default
  const [displayDate, setDisplayDate] = useState('');
  const [isoDate, setIsoDate] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  // Sync default status when opened
  useEffect(() => {
    if (isOpen) {
      setStatus(defaultStatus);
      setErrorMessage(null);
    }
  }, [isOpen, defaultStatus]);

  // Focus title input on mount/open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Global Keyboard shortcuts: ⌘+Enter / Ctrl+Enter to submit, Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (formRef.current) {
          if (typeof formRef.current.requestSubmit === 'function') {
            formRef.current.requestSubmit();
          } else {
            formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setStatus(defaultStatus);
    setPriority(2);
    setDisplayDate('');
    setIsoDate('');
    setBudget('');
    setDescription('');
    setErrorMessage(null);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handleDateChange = (rawInput: string) => {
    setDisplayDate(rawInput);
    const parsed = toIsoDate(rawInput);
    setIsoDate(parsed);
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    setIsoDate(val);
    setDisplayDate(toDisplayDMY(val));
  };

  const handleOpenPicker = () => {
    if (datePickerRef.current) {
      if (typeof datePickerRef.current.showPicker === 'function') {
        try {
          datePickerRef.current.showPicker();
          return;
        } catch {
          // fallback
        }
      }
      datePickerRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('status', status === 'planning' ? 'backlog' : status);
    formData.append('priority', String(priority));
    formData.append('budget', budget.trim() || '0');
    if (isoDate) {
      formData.append('targetDate', isoDate);
    }
    if (description.trim()) {
      formData.append('description', description.trim());
    }

    startTransition(async () => {
      const res = await createProject(null, formData);
      if (res.success && res.data) {
        const createdProject = res.data;
        const projectWithMetrics: ProjectWithMetrics = {
          ...createdProject,
          total_tasks: 0,
          completed_tasks: 0,
          completion_percentage: 0,
          total_spend: 0,
        };

        // Fire subtle toast notification
        const successMsg = `Project "${createdProject.title}" initiated successfully`;
        setToastMessage(successMsg);
        setTimeout(() => setToastMessage(null), 3500);

        onSuccess?.(projectWithMetrics);
        resetForm();
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to create project.');
      }
    });
  };

  // If modal closed but toast notification is active, render only the floating toast portal
  if (!isOpen) {
    if (toastMessage && typeof document !== 'undefined') {
      return createPortal(
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-xl border border-stone-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 px-4 py-3 text-xs font-medium text-stone-900 dark:text-zinc-100 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>,
        document.body
      );
    }
    return null;
  }

  return (
    <>
      {/* 1. Modal Container & Backdrop Scrim */}
      <div
        data-purpose="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="initiate-project-title"
        onClick={handleCancel}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/30 backdrop-blur-[6px] transition-all animate-in fade-in duration-200"
      >
        {/* Modal Canvas Card */}
        <section
          data-purpose="initiate-project-modal"
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-xl w-full bg-[#FAF9F5] dark:bg-[#090A0F] border border-stone-200/90 dark:border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Ambient Highlight: 1px gradient accent bar along the top edge */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-600/40 to-teal-500/0 pointer-events-none" />

          {/* Header */}
          <header className="px-6 py-4 border-b border-stone-200/70 dark:border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {/* Emerald Icon Tile */}
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h1
                  id="initiate-project-title"
                  className="text-lg font-bold text-stone-900 dark:text-zinc-100 tracking-tight flex items-center gap-2"
                >
                  Initiate New Project
                </h1>
              </div>
            </div>

            {/* Accessible Dismiss / Esc Button */}
            <button
              type="button"
              id="close-modal-btn"
              aria-label="Close dialog"
              onClick={handleCancel}
              className="flex items-center gap-1.5 p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-zinc-200 hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors group cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Body */}
          <form
            id="project-form"
            ref={formRef}
            onSubmit={handleSubmit}
            className="p-6 space-y-5"
          >
            {/* Field 1: Prominent Project Title Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="project-title"
                className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-zinc-400 uppercase flex items-center gap-1"
              >
                Project Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <input
                  id="project-title"
                  name="title"
                  ref={titleInputRef}
                  autoFocus
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter project title..."
                  className="w-full bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-stone-900 dark:text-zinc-100 font-semibold text-base placeholder:text-stone-300 dark:placeholder:text-zinc-600 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-zinc-700/50 focus:border-stone-800 dark:focus:border-zinc-600 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Field 2: Segmented Status Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-zinc-400 uppercase">
                Status
              </label>
              <div
                data-purpose="status-segmented-control"
                className="bg-stone-200/60 dark:bg-zinc-800/60 p-1 rounded-xl flex gap-1 border border-stone-300/40 dark:border-zinc-700/40"
              >
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = status === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStatus(opt.id)}
                      className={`flex-1 py-1.5 px-2.5 sm:px-3 text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'font-semibold text-stone-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 shadow-xs border border-stone-200/70 dark:border-zinc-700'
                          : 'font-medium text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200/50 dark:hover:bg-zinc-750/50 border border-transparent'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotClass}`} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 3: Priority Tier Badges (Linear-inspired) */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-zinc-400 uppercase">
                Priority
              </label>
              <div
                data-purpose="priority-selector"
                className="grid grid-cols-4 gap-2"
              >
                {PRIORITY_OPTIONS.map((item) => {
                  const isSelected = priority === item.level;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setPriority(item.level)}
                      className={`group flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isSelected ? item.activeClass : item.inactiveClass
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 4: Target Deadline & Budget Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {/* Target Deadline */}
              <div className="space-y-1.5">
                <label
                  htmlFor="target-deadline"
                  className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-zinc-400 uppercase flex items-center justify-between"
                >
                  <span>Target Deadline</span>
                </label>
                <div
                  onClick={handleOpenPicker}
                  className="relative flex items-center h-10 w-full bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800 rounded-xl shadow-xs focus-within:ring-2 focus-within:ring-stone-900/10 dark:focus-within:ring-zinc-700/50 focus-within:border-stone-800 dark:focus-within:border-zinc-600 transition-all overflow-hidden cursor-pointer"
                >
                  <input
                    id="target-deadline"
                    type="text"
                    value={displayDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    placeholder="dd/mm/yyyy"
                    className="w-full h-full bg-transparent border-none pl-3.5 pr-10 py-0 text-xs font-medium text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-0 cursor-pointer"
                  />
                  {/* Invisible native date picker for rich OS picker experience */}
                  <input
                    ref={datePickerRef}
                    type="date"
                    tabIndex={-1}
                    aria-hidden="true"
                    value={isoDate}
                    onChange={handleNativePickerChange}
                    className="absolute inset-0 opacity-0 pointer-events-none -z-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Pick date"
                    className="absolute right-3.5 text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 transition-colors pointer-events-none"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Allocated Budget Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="allocated-budget"
                  className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-zinc-400 uppercase flex items-center justify-between"
                >
                  <span>Allocated Budget</span>
                </label>
                <div className="relative flex items-center h-10 w-full bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800 rounded-xl shadow-xs focus-within:ring-2 focus-within:ring-stone-900/10 dark:focus-within:ring-zinc-700/50 focus-within:border-stone-800 dark:focus-within:border-zinc-600 transition-all overflow-hidden">
                  <span className="absolute left-3.5 text-stone-500 dark:text-zinc-400 font-mono font-medium text-xs select-none pointer-events-none">
                    {currencySymbol}
                  </span>
                  <input
                    id="allocated-budget"
                    name="budget"
                    type="number"
                    step="any"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0"
                    className="w-full h-full bg-transparent border-none pl-7 pr-3.5 py-0 text-xs font-mono font-semibold text-stone-800 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-0 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* Field 5: Description & Scope */}
            <div className="space-y-1.5">
              <label
                htmlFor="project-scope"
                className="text-[11px] font-semibold tracking-wider text-stone-500 dark:text-zinc-400 uppercase flex items-center justify-between"
              >
                <span>Description &amp; Scope</span>
              </label>
              <textarea
                id="project-scope"
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level objectives, deliverables, and requirements..."
                className="w-full bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800 rounded-xl p-3 text-xs text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-zinc-700/50 focus:border-stone-800 dark:focus:border-zinc-600 shadow-xs transition-all resize-none leading-relaxed"
              />
            </div>
          </form>

          {/* Action Footer & Keyboard Shortcuts */}
          <footer className="p-4 sm:px-6 bg-[#F5F4F0]/80 dark:bg-[#121318]/80 border-t border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between">
            {/* Keyboard shortcut hint */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-stone-400 dark:text-zinc-500">
              <kbd className="px-1.5 py-0.5 rounded bg-stone-200/60 dark:bg-zinc-800 border border-stone-300/80 dark:border-zinc-700 text-[10px] text-stone-600 dark:text-zinc-400 font-semibold shadow-2xs">
                ⌘ / Ctrl + ↵
              </kbd>
              <span>to submit</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                id="cancel-btn"
                disabled={isPending}
                onClick={handleCancel}
                className="px-3.5 py-2 text-xs font-semibold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="submit-project-btn"
                disabled={isPending}
                onClick={() => {
                  if (formRef.current) {
                    if (typeof formRef.current.requestSubmit === 'function') {
                      formRef.current.requestSubmit();
                    } else {
                      formRef.current.dispatchEvent(
                        new Event('submit', { cancelable: true, bubbles: true })
                      );
                    }
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white active:scale-[0.98] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{isPending ? 'Initiating...' : 'Create Project'}</span>
              </button>
            </div>
          </footer>
        </section>
      </div>

      {/* Subtle Toast Notification */}
      {toastMessage &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-xl border border-stone-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 px-4 py-3 text-xs font-medium text-stone-900 dark:text-zinc-100 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>,
          document.body
        )}
    </>
  );
}

export const ProjectCreateModal = CreateProjectModal;
export default CreateProjectModal;
