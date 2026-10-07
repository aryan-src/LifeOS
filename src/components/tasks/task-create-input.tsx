'use client';

import React, {
  useActionState,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import {
  Folder,
  Calendar as CalendarIcon,
  Flag,
  ArrowUp,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { createTask } from '@/lib/actions/tasks';
import type { ActionResponse } from '@/types/action.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { getTodayDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------------------
// Transition Physics & Spring Curves from Origin / Jahed AI Input
// ----------------------------------------------------------------------
const SPRING_TRANSITION =
  'height 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease';
const SMOOTH_HEIGHT_TRANSITION =
  'height 0.15s ease-out, box-shadow 0.25s ease';

// ----------------------------------------------------------------------
// Kinetic Morphing Text Pill
// ----------------------------------------------------------------------
function MorphingText({ text }: { text: string }) {
  const [width, setWidth] = useState<number | 'auto'>('auto');
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) {
      setWidth(spanRef.current.offsetWidth);
    }
  }, [text]);

  return (
    <span
      className="relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
      style={{ width }}
    >
      <span ref={spanRef} className="invisible whitespace-nowrap px-0.5">
        {text}
      </span>
      <span
        key={text}
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-300"
      >
        {text}
      </span>
    </span>
  );
}

// ----------------------------------------------------------------------
// Priority Configuration
// ----------------------------------------------------------------------
interface PriorityLevel {
  value: number;
  label: string;
  dotBg: string;
  badgeClass: string;
}

const PRIORITIES: PriorityLevel[] = [
  { value: 4, label: 'P1 Urgent', dotBg: 'bg-error', badgeClass: 'text-error' },
  { value: 3, label: 'P2 High', dotBg: 'bg-on-tertiary-container', badgeClass: 'text-on-tertiary-container' },
  { value: 2, label: 'P3 Medium', dotBg: 'bg-secondary', badgeClass: 'text-secondary' },
  { value: 1, label: 'P4 Low', dotBg: 'bg-outline', badgeClass: 'text-outline' },
];

interface TaskCreateInputProps {
  projects: ProjectOption[];
  selectedDueDate?: string;
  onError?: (msg: string) => void;
  className?: string;
}

const initialState: ActionResponse = {
  success: false,
};

export function TaskCreateInput({
  projects,
  selectedDueDate,
  onError,
  className,
}: TaskCreateInputProps) {
  const [state, formAction, isPending] = useActionState(createTask, initialState);

  // Form & Component Refs
  const formRef = useRef<HTMLFormElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const topFadeRef = useRef<HTMLDivElement>(null);
  const bottomFadeRef = useRef<HTMLDivElement>(null);
  const calendarPopoverRef = useRef<HTMLDivElement>(null);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const priorityMenuRef = useRef<HTMLDivElement>(null);

  // Task State
  const [title, setTitle] = useState('');
  const todayStr = getTodayDate();
  const [dueDate, setDueDate] = useState(selectedDueDate || todayStr);
  const [priority, setPriority] = useState<number>(2);
  const [projectId, setProjectId] = useState<string>('none');

  // UI Interactive States
  const [expanded, setExpanded] = useState(false);
  const [isSmoothResize, setIsSmoothResize] = useState(false);
  const [containerHeight, setContainerHeight] = useState(116);
  const [textareaHeight, setTextareaHeight] = useState(64);
  const [isScrolling, setIsScrolling] = useState(false);

  // Dropdown Popups
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);
  const [isPrioritySelectOpen, setIsPrioritySelectOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Floating hover pill for project dropdown
  const [projectHoverStyle, setProjectHoverStyle] = useState({
    opacity: 0,
    transform: 'translateY(0px) scale(0.95)',
    transition: 'none',
  });

  const hasValue = title.trim() !== '';

  // Parse YYYY-MM-DD safely into local Date
  const selectedDateObj = useMemo(() => {
    if (!dueDate) return undefined;
    const parts = dueDate.split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return undefined;
  }, [dueDate]);

  // Formatted human-readable date label
  const displayDateLabel = useMemo(() => {
    if (!dueDate || !selectedDateObj) return 'No Date';
    if (isToday(selectedDateObj)) return `Today, ${format(selectedDateObj, 'MMM d')}`;
    if (isTomorrow(selectedDateObj)) return `Tomorrow, ${format(selectedDateObj, 'MMM d')}`;
    return format(selectedDateObj, 'MMM d');
  }, [dueDate, selectedDateObj]);

  // Selected project label
  const selectedProject = useMemo(() => {
    if (projectId === 'none') return null;
    return projects.find((p) => p.id === projectId) || null;
  }, [projectId, projects]);

  const selectedProjectLabel = selectedProject ? `#${selectedProject.slug}` : 'Personal';

  // Selected priority item
  const currentPriority = useMemo(() => {
    return PRIORITIES.find((p) => p.value === priority) || PRIORITIES[2];
  }, [priority]);

  // Update top/bottom gradient fade masks on scroll
  const updateFades = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (topFadeRef.current) {
      topFadeRef.current.style.opacity = Math.min(scrollTop / 20, 1).toString();
    }
    if (bottomFadeRef.current) {
      const bottomScroll = scrollHeight - clientHeight - scrollTop;
      bottomFadeRef.current.style.opacity = Math.min(
        Math.max(bottomScroll - 16, 0) / 10,
        1
      ).toString();
    }
  };

  const handleTitleChange = useCallback((val: string) => {
    setIsSmoothResize(true);
    setTitle(val);
  }, []);

  const expand = () => {
    setIsSmoothResize(false);
    setExpanded(true);
  };

  // Auto-focus textarea when expanded
  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [expanded]);

  // Auto-expand textarea height with content
  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const currentH = el.style.height;
    el.style.transition = 'none';
    el.style.height = '0px';
    const scrollH = el.scrollHeight;
    el.style.height = currentH;
    void el.offsetHeight;
    el.style.transition = '';

    const newH = Math.max(64, Math.min(scrollH, 140));
    el.style.height = `${newH}px`;
    setTextareaHeight(newH);
    setIsScrolling(scrollH > 140);
    setTimeout(updateFades, 0);
  }, [title, expanded]);

  // Update overall container height
  useEffect(() => {
    setContainerHeight(Math.max(116, textareaHeight + 52));
    setTimeout(updateFades, 0);
  }, [textareaHeight]);

  // Listen to prop selectedDueDate changes
  useEffect(() => {
    if (selectedDueDate) {
      setDueDate(selectedDueDate);
      expand();
    }
  }, [selectedDueDate]);

  // Server action outcome listener
  useEffect(() => {
    if (state.success) {
      setTitle('');
      setDueDate(selectedDueDate || todayStr);
      setIsSmoothResize(false);
      setExpanded(false);
      setIsProjectSelectOpen(false);
      setIsPrioritySelectOpen(false);
      setIsCalendarOpen(false);
    } else if (state.error && onError) {
      onError(state.error);
    }
  }, [state, onError, selectedDueDate, todayStr]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;

      // Close project dropdown
      if (
        isProjectSelectOpen &&
        projectMenuRef.current &&
        !projectMenuRef.current.contains(target)
      ) {
        setIsProjectSelectOpen(false);
      }

      // Close priority dropdown
      if (
        isPrioritySelectOpen &&
        priorityMenuRef.current &&
        !priorityMenuRef.current.contains(target)
      ) {
        setIsPrioritySelectOpen(false);
      }

      // Close calendar popover
      if (
        isCalendarOpen &&
        calendarPopoverRef.current &&
        !calendarPopoverRef.current.contains(target) &&
        calendarTriggerRef.current &&
        !calendarTriggerRef.current.contains(target)
      ) {
        setIsCalendarOpen(false);
      }

      // Collapse container if clicking outside and input is empty
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        title.trim() === '' &&
        !isProjectSelectOpen &&
        !isPrioritySelectOpen &&
        !isCalendarOpen
      ) {
        setIsSmoothResize(false);
        setExpanded(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isProjectSelectOpen) setIsProjectSelectOpen(false);
        else if (isPrioritySelectOpen) setIsPrioritySelectOpen(false);
        else if (isCalendarOpen) setIsCalendarOpen(false);
        else if (title.trim() === '') {
          setIsSmoothResize(false);
          setExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProjectSelectOpen, isPrioritySelectOpen, isCalendarOpen, title]);

  const handleSubmit = () => {
    if (!title.trim() || isPending) return;
    formRef.current?.requestSubmit();
  };

  const handleQuickDateSelect = (targetDate: Date | null) => {
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
      className={cn('relative w-full', className)}
    >
      {/* Hidden Form Inputs for Server Action submission */}
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="dueDate" value={dueDate} />
      <input type="hidden" name="priority" value={priority} />
      <input type="hidden" name="projectId" value={projectId} />

      {/* Main Adaptive Task Input Box */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          const isTextarea = e.target === textareaRef.current;
          if (expanded && !isTextarea && !isPending) {
            e.preventDefault();
            textareaRef.current?.focus();
          }
        }}
        style={{
          height: expanded ? containerHeight : 50,
          transition: isSmoothResize
            ? SMOOTH_HEIGHT_TRANSITION
            : SPRING_TRANSITION,
          overflow: expanded ? 'visible' : 'hidden',
        }}
        className={cn(
          'relative w-full rounded-2xl border border-outline-variant/60 dark:border-stone-800 bg-surface-container-lowest dark:bg-stone-900 shadow-sm transition-all focus-within:shadow-md focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 hover:border-outline-variant z-10',
          expanded ? 'cursor-text' : 'cursor-default'
        )}
      >
        {/* Resting Placeholder Trigger Button */}
        <button
          type="button"
          onClick={expand}
          style={{
            transition: isSmoothResize
              ? 'none'
              : 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
          className={cn(
            'absolute inset-x-0 top-0 z-[1] flex items-center justify-between h-[50px] px-4 text-left outline-none cursor-pointer',
            !expanded
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-1 pointer-events-none'
          )}
          aria-label="Add a new task"
        >
          <div className="flex items-center gap-2.5 text-outline">
            <span className="material-symbols-outlined text-[19px] text-[#2f5c3a] dark:text-emerald-400">
              add_circle
            </span>
            <span className="text-[13px] font-normal text-outline">
              Add a new task (e.g. &apos;Deploy API route updates&apos;)...
            </span>
          </div>
          <div className="flex items-center gap-1.5 mr-10">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-outline bg-surface-container dark:bg-stone-800 px-1.5 py-0.5 rounded border border-outline-variant/40">
              <span>↵</span>
              <span>New</span>
            </kbd>
          </div>
        </button>

        {/* Multi-line Task Title Textarea (Expanded) */}
        <textarea
          ref={textareaRef}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onScroll={updateFades}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="What needs to be done? Press Enter to save..."
          aria-label="Task title"
          disabled={isPending}
          style={{
            transition: isSmoothResize
              ? 'height 0.15s ease-out'
              : 'opacity 0.25s ease-out, transform 0.25s ease-out',
          }}
          className={cn(
            'absolute top-0 inset-x-0 z-[1] w-full resize-none bg-transparent pl-4 pr-12 pt-3 pb-2 text-[14px] leading-[22px] text-on-surface outline-none placeholder:text-outline/70 cursor-text',
            expanded
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 -translate-y-1 pointer-events-none',
            isScrolling ? 'overflow-y-auto' : 'overflow-y-hidden'
          )}
        />

        {/* Top & Bottom Fade Overlays */}
        <div
          ref={topFadeRef}
          className="absolute left-4 right-12 top-0 z-[2] h-6 bg-gradient-to-b from-surface-container-lowest via-surface-container-lowest/80 to-transparent dark:from-stone-900 pointer-events-none"
        />
        <div
          ref={bottomFadeRef}
          className="absolute left-4 right-12 z-[2] h-6 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent dark:from-stone-900 pointer-events-none"
          style={{
            opacity: 0,
            top: `${textareaHeight - 24}px`,
            transition: isSmoothResize ? 'top 0.15s ease-out' : 'top 0.35s ease',
          }}
        />

        {/* Bottom Task Toolbar Actions */}
        <div
          className={cn(
            'absolute bottom-2 left-3 right-12 z-[10] flex items-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]',
            expanded
              ? 'opacity-100 blur-0 translate-y-0 pointer-events-auto'
              : 'opacity-0 blur-sm translate-y-2 pointer-events-none'
          )}
        >
          {/* 1. Project Selector Pill */}
          <div className="relative" ref={projectMenuRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setIsProjectSelectOpen((prev) => !prev);
                setIsPrioritySelectOpen(false);
                setIsCalendarOpen(false);
              }}
              className={cn(
                'group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high transition-all duration-200 outline-none text-[12px] font-mono cursor-pointer',
                isProjectSelectOpen && 'bg-surface-container-high ring-1 ring-primary/20 text-on-surface'
              )}
              aria-label={`Select project. Current: ${selectedProjectLabel}`}
            >
              <Folder size={13} className="text-outline group-hover:text-primary transition-colors" />
              <span className="font-medium select-none">
                <MorphingText text={selectedProjectLabel} />
              </span>
            </button>

            {/* Project Floating Dropdown Menu */}
            {isProjectSelectOpen && (
              <div
                style={{ transformOrigin: 'bottom left' }}
                onMouseLeave={() => {
                  setProjectHoverStyle((prev) => ({
                    ...prev,
                    opacity: 0,
                    transform: prev.transform.replace('scale(1)', 'scale(0.95)'),
                    transition: 'opacity 0.2s ease-in, transform 0.2s ease-out',
                  }));
                }}
                className="absolute bottom-full left-0 mb-2 z-50 w-52 rounded-xl border border-outline-variant/60 bg-surface-container-lowest dark:bg-stone-900 p-1 shadow-xl backdrop-blur-md flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-outline border-b border-surface-container-high/60 mb-0.5">
                  Assign Project
                </div>
                <div className="relative flex flex-col gap-0.5">
                  <div
                    style={projectHoverStyle}
                    className="absolute left-0 right-0 top-0 h-7 -z-10 rounded-lg bg-surface-container pointer-events-none"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => {
                      setProjectHoverStyle({
                        opacity: 1,
                        transform: 'translateY(0px) scale(1)',
                        transition: 'opacity 0.15s ease-out, transform 0.2s ease-out',
                      });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectId('none');
                      setIsProjectSelectOpen(false);
                    }}
                    className={cn(
                      'group flex h-7 w-full items-center justify-between rounded-lg px-2 text-left text-[12px] font-mono transition-colors cursor-pointer',
                      projectId === 'none' ? 'font-semibold text-primary' : 'text-on-surface-variant'
                    )}
                  >
                    <span>Personal Workspace</span>
                    {projectId === 'none' && <span className="text-[11px] text-[#2f5c3a] dark:text-emerald-400">✓</span>}
                  </button>

                  {projects.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => {
                        setProjectHoverStyle({
                          opacity: 1,
                          transform: `translateY(${(idx + 1) * 30}px) scale(1)`,
                          transition: 'opacity 0.15s ease-out, transform 0.2s ease-out',
                        });
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectId(p.id);
                        setIsProjectSelectOpen(false);
                      }}
                      className={cn(
                        'group flex h-7 w-full items-center justify-between rounded-lg px-2 text-left text-[12px] font-mono transition-colors cursor-pointer',
                        projectId === p.id ? 'font-semibold text-primary' : 'text-on-surface-variant'
                      )}
                    >
                      <span className="truncate">#{p.slug}</span>
                      {projectId === p.id && <span className="text-[11px] text-[#2f5c3a] dark:text-emerald-400">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Priority Selector Pill */}
          <div className="relative" ref={priorityMenuRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setIsPrioritySelectOpen((prev) => !prev);
                setIsProjectSelectOpen(false);
                setIsCalendarOpen(false);
              }}
              className={cn(
                'group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high transition-all duration-200 outline-none text-[12px] font-mono cursor-pointer',
                isPrioritySelectOpen && 'bg-surface-container-high ring-1 ring-primary/20 text-on-surface'
              )}
              aria-label={`Select priority. Current: ${currentPriority.label}`}
            >
              <span className={cn('size-2 rounded-full', currentPriority.dotBg)} />
              <span className="font-medium select-none">
                <MorphingText text={currentPriority.label} />
              </span>
            </button>

            {/* Priority Floating Dropdown Menu */}
            {isPrioritySelectOpen && (
              <div
                style={{ transformOrigin: 'bottom left' }}
                className="absolute bottom-full left-0 mb-2 z-50 w-36 rounded-xl border border-outline-variant/60 bg-surface-container-lowest dark:bg-stone-900 p-1 shadow-xl backdrop-blur-md flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-outline border-b border-surface-container-high/60 mb-0.5">
                  Priority
                </div>
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPriority(p.value);
                      setIsPrioritySelectOpen(false);
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-2 py-1 text-left text-[12px] font-mono hover:bg-surface-container transition-colors cursor-pointer',
                      priority === p.value ? 'font-semibold text-primary' : 'text-on-surface-variant'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('size-2 rounded-full', p.dotBg)} />
                      <span>{p.label}</span>
                    </div>
                    {priority === p.value && <span className="text-[11px] text-[#2f5c3a] dark:text-emerald-400">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Due Date OriginUI Calendar Popover Pill */}
          <div className="relative">
            <button
              ref={calendarTriggerRef}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setIsCalendarOpen((prev) => !prev);
                setIsProjectSelectOpen(false);
                setIsPrioritySelectOpen(false);
              }}
              className={cn(
                'group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high transition-all duration-200 outline-none text-[12px] font-mono cursor-pointer',
                isCalendarOpen && 'bg-surface-container-high ring-1 ring-primary/20 text-on-surface'
              )}
              aria-label={`Select due date. Current: ${displayDateLabel}`}
            >
              <CalendarIcon size={13} className="text-secondary" />
              <span className="font-medium select-none">
                <MorphingText text={displayDateLabel} />
              </span>
            </button>

            {/* Origin UI Calendar Popover */}
            {isCalendarOpen && (
              <div
                ref={calendarPopoverRef}
                className="absolute bottom-full left-0 mb-2 z-50 rounded-xl border border-outline-variant/60 bg-surface-container-lowest dark:bg-stone-900 p-3 shadow-xl backdrop-blur-md flex flex-col gap-2.5 min-w-[280px] animate-in fade-in zoom-in-95 duration-200"
              >
                {/* Header & Clear */}
                <div className="flex items-center justify-between border-b border-surface-container-high/70 pb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-outline font-semibold">
                    Task Deadline
                  </span>
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => handleQuickDateSelect(null)}
                      className="text-[11px] font-mono text-outline hover:text-error transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <X size={12} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => handleQuickDateSelect(new Date())}
                    className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDateSelect(addDays(new Date(), 1))}
                    className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDateSelect(addDays(new Date(), 7))}
                    className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                  >
                    Next Week
                  </button>
                </div>

                {/* Origin UI DayPicker Calendar */}
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
        </div>

        {/* Circular Action Button at Bottom-Right */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={handleSubmit}
          disabled={!hasValue || isPending}
          aria-label="Add Task"
          style={{ borderRadius: 9999 }}
          className={cn(
            'absolute right-2 bottom-2 z-[10] flex size-8 items-center justify-center transition-all duration-300 outline-none cursor-pointer',
            hasValue
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm hover:opacity-90 active:scale-95'
              : 'bg-surface-container text-outline/50 cursor-not-allowed opacity-60'
          )}
        >
          {isPending ? (
            <Loader2 size={15} className="animate-spin text-current" />
          ) : (
            <ArrowUp
              size={15}
              strokeWidth={2.25}
              className={cn(
                'transition-transform duration-200',
                hasValue ? 'translate-y-0 scale-100' : 'translate-y-0.5 scale-90'
              )}
            />
          )}
        </button>
      </div>

      {state.error && (
        <p className="text-xs text-error mt-1.5 px-2">{state.error}</p>
      )}
    </form>
  );
}
