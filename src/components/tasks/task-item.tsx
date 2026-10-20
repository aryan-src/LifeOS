'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { TaskWithProject } from '@/lib/actions/tasks';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { getTodayDate } from '@/lib/utils/date';
import {
  Check,
  Play,
  Trash2,
  Clock,
  AlertCircle,
  Hash,
  MoreVertical,
  RotateCcw,
  Flag,
} from 'lucide-react';

export interface TaskItemProps {
  task: TaskWithProject;
  projects?: ProjectOption[];
  onToggle: (taskId: string, targetState: boolean) => void;
  onToggleInProgress?: (taskId: string, targetState: boolean) => void;
  onUpdatePriority?: (taskId: string, priority: number) => void;
  onDelete: (taskId: string) => void;
}

const PRIORITY_BADGES: Record<
  number,
  { label: string; className: string; dotColor: string }
> = {
  4: {
    label: 'P1 Urgent',
    className:
      'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40 font-medium',
    dotColor: 'bg-rose-500',
  },
  3: {
    label: 'P2 High',
    className:
      'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 font-medium',
    dotColor: 'bg-amber-500',
  },
  2: {
    label: 'P3 Medium',
    className:
      'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 font-medium',
    dotColor: 'bg-emerald-500',
  },
  1: {
    label: 'P4 Low',
    className:
      'bg-stone-50 text-stone-600 border border-stone-200/60 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700/60 font-medium',
    dotColor: 'bg-stone-400',
  },
};

function formatCompletionTime(completedAt?: string | null): string {
  if (!completedAt) return '';
  try {
    const date = new Date(completedAt);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function TaskItem({
  task,
  projects,
  onToggle,
  onToggleInProgress,
  onUpdatePriority,
  onDelete,
}: TaskItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES[2];

  // Compare strictly against current localized YYYY-MM-DD in IST
  const todayStr = getTodayDate();
  const isOverdue =
    task.due_date && task.due_date < todayStr && !task.is_completed;
  const isDueToday = task.due_date === todayStr && !task.is_completed;
  const completionTime = formatCompletionTime(task.completed_at);

  // Close more menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      className={`group relative flex items-start justify-between p-3.5 sm:p-4 rounded-xl transition-all duration-200 ${
        task.is_completed
          ? 'bg-stone-50/70 dark:bg-zinc-900/30 opacity-75 hover:opacity-100 border border-stone-200/60 dark:border-zinc-800/40'
          : 'bg-white dark:bg-zinc-900/70 hover:bg-stone-50/70 dark:hover:bg-zinc-800/40 border border-stone-200/80 dark:border-zinc-800/70 shadow-2xs hover:shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Animated Custom Checkbox */}
        <motion.button
          type="button"
          role="checkbox"
          aria-checked={Boolean(task.is_completed)}
          whileTap={{ scale: 0.88 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id, !task.is_completed);
          }}
          aria-label={
            task.is_completed ? 'Mark task incomplete' : 'Mark task complete'
          }
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors cursor-pointer ${
            task.is_completed
              ? 'bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-2 border-stone-900 dark:border-zinc-100 shadow-xs'
              : 'border-2 border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/80 hover:border-stone-400 dark:hover:border-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800 shadow-2xs'
          }`}
        >
          {task.is_completed && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </motion.div>
          )}
        </motion.button>

        {/* Title, description & meta badges */}
        <div className="flex flex-col min-w-0 pr-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium transition-all duration-200 ${
                task.is_completed
                  ? 'text-stone-400 dark:text-zinc-500 line-through'
                  : 'text-stone-900 dark:text-zinc-100 group-hover:text-stone-700 dark:group-hover:text-zinc-200'
              }`}
            >
              {task.title}
            </span>

            {/* In Progress Action Toggle / Start Focus Session */}
            {!task.is_completed && (
              task.in_progress ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInProgress?.(task.id, false);
                  }}
                  title="In progress — click to pause"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-all cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>In Progress</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInProgress?.(task.id, true);
                  }}
                  title="Mark In Progress"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-stone-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 border border-stone-200/60 dark:border-zinc-800/80 hover:border-emerald-200/60 transition-all cursor-pointer shadow-2xs"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span className="text-[10px]">Start</span>
                </button>
              )
            )}

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono tracking-tight ${priorityInfo.className}`}
            >
              {priorityInfo.label}
            </span>
          </div>

          {task.description && (
            <p
              className={`text-xs mt-1 line-clamp-2 ${
                task.is_completed
                  ? 'text-stone-400 dark:text-zinc-600'
                  : 'text-stone-600 dark:text-zinc-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Meta Row: Due Date, Completion Metadata, Project Pill */}
          <div className="flex flex-wrap items-center gap-2.5 mt-2 text-xs text-stone-400 dark:text-zinc-500">
            {/* Due Date & Overdue Badge */}
            {task.due_date && (
              <span
                suppressHydrationWarning
                className={`inline-flex items-center gap-1 font-mono text-[11px] transition-colors ${
                  task.is_completed
                    ? 'text-stone-400 dark:text-zinc-500'
                    : isOverdue
                    ? 'text-rose-600 bg-rose-50/50 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40 px-2 py-0.5 rounded-md font-semibold'
                    : isDueToday
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-md font-medium'
                    : 'text-stone-500 dark:text-zinc-400 bg-stone-100/70 dark:bg-zinc-800/40 px-2 py-0.5 rounded-md border border-stone-200/40 dark:border-zinc-800'
                }`}
              >
                {isOverdue && !task.is_completed ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <Clock
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isDueToday
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-stone-400 dark:text-zinc-500'
                    }`}
                  />
                )}
                <span>
                  {isOverdue && !task.is_completed
                    ? `Overdue: ${task.due_date}`
                    : isDueToday
                    ? 'Due Today'
                    : task.due_date}
                </span>
              </span>
            )}

            {/* Completed Task Timestamp Metadata */}
            {task.is_completed && completionTime && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-stone-400 dark:text-zinc-500 bg-stone-100/60 dark:bg-zinc-800/40 px-2 py-0.5 rounded-md border border-stone-200/40 dark:border-zinc-800">
                <Clock className="w-3 h-3 text-stone-400 dark:text-zinc-500" />
                <span>Done at {completionTime}</span>
              </span>
            )}

            {/* Linked Project Pill */}
            {task.project && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-stone-600 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md border border-stone-200/60 dark:border-zinc-700/50">
                <Hash className="w-3 h-3 text-stone-400 dark:text-zinc-500" />
                <span>{task.project.slug}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Action Bar */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
        {/* Quick Uncheck / Restore button for completed items */}
        {task.is_completed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task.id, false);
            }}
            title="Uncheck / Restore task"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white bg-white hover:bg-stone-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-stone-200/80 dark:border-zinc-700/80 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="text-[11px]">Restore</span>
          </button>
        )}

        {/* More Actions Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label="More task options"
            className="p-1.5 rounded-lg text-stone-400 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Quick Dropdown Menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800 shadow-lg py-1.5 z-30"
              >
                {/* Priority Selector Group */}
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-stone-400 dark:text-zinc-500 tracking-wider">
                  Priority
                </div>
                <div className="flex flex-col gap-0.5 px-1 pb-1 border-b border-stone-100 dark:border-zinc-800">
                  {[4, 3, 2, 1].map((lvl) => {
                    const cfg = PRIORITY_BADGES[lvl];
                    const isSelected = task.priority === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdatePriority?.(task.id, lvl);
                          setMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-white font-medium'
                            : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                          <span>{cfg.label}</span>
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-stone-600 dark:text-zinc-300" />}
                      </button>
                    );
                  })}
                </div>

                {/* Delete Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(task.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 mt-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Delete Quick Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          aria-label="Delete task"
          className="p-1.5 rounded-lg text-stone-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
