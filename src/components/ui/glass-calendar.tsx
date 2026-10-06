'use client';

import * as React from "react";
import { Plus, Edit2, ChevronLeft, ChevronRight, Calendar, Flag } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  getDate,
  getDaysInMonth,
  startOfMonth,
  startOfWeek,
  addDays,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/use-ui-store";

// --- TYPE DEFINITIONS ---
export interface CalendarTaskItem {
  id?: string;
  title: string;
  due_date: string | null;
  is_completed?: boolean;
}

export interface CalendarProjectItem {
  id?: string;
  title: string;
  target_date: string | null;
  slug?: string;
}

interface Day {
  date: Date;
  dateStr: string;
  isToday: boolean;
  isSelected: boolean;
}

export interface GlassCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  tasks?: CalendarTaskItem[];
  projects?: CalendarProjectItem[];
  onOpenTaskInput?: (dateStr: string) => void;
  className?: string;
}

// --- HELPER TO HIDE SCROLLBAR ---
const ScrollbarHide = () => (
  <style>{`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);

// --- MAIN COMPONENT ---
export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  (
    {
      className,
      selectedDate: propSelectedDate,
      onDateSelect,
      tasks = [],
      projects = [],
      onOpenTaskInput,
      ...props
    },
    ref
  ) => {
    const [viewMode, setViewMode] = React.useState<'weekly' | 'monthly'>('weekly');
    const [currentMonth, setCurrentMonth] = React.useState<Date>(propSelectedDate || new Date());
    const [selectedDate, setSelectedDate] = React.useState<Date>(propSelectedDate || new Date());
    const [isPending, startTransition] = React.useTransition();

    React.useEffect(() => {
      if (propSelectedDate) {
        setSelectedDate(propSelectedDate);
      }
    }, [propSelectedDate]);

    // O(1) Schedule Map indexing tasks and project deadlines by date 'YYYY-MM-DD'
    const scheduleByDate = React.useMemo(() => {
      const map = new Map<string, { tasks: CalendarTaskItem[]; projects: CalendarProjectItem[] }>();

      tasks.forEach((task) => {
        if (task.due_date) {
          const entry = map.get(task.due_date) || { tasks: [], projects: [] };
          entry.tasks.push(task);
          map.set(task.due_date, entry);
        }
      });

      projects.forEach((project) => {
        if (project.target_date) {
          const entry = map.get(project.target_date) || { tasks: [], projects: [] };
          entry.projects.push(project);
          map.set(project.target_date, entry);
        }
      });

      return map;
    }, [tasks, projects]);

    // Generate days according to viewMode (Weekly rolling cadence vs Full Monthly)
    const displayDays = React.useMemo(() => {
      if (viewMode === 'weekly') {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const days: Day[] = [];
        for (let i = 0; i < 7; i++) {
          const date = addDays(start, i);
          days.push({
            date,
            dateStr: format(date, 'yyyy-MM-dd'),
            isToday: isToday(date),
            isSelected: isSameDay(date, selectedDate),
          });
        }
        return days;
      }

      const start = startOfMonth(currentMonth);
      const totalDays = getDaysInMonth(currentMonth);
      const days: Day[] = [];
      for (let i = 0; i < totalDays; i++) {
        const date = new Date(start.getFullYear(), start.getMonth(), i + 1);
        days.push({
          date,
          dateStr: format(date, 'yyyy-MM-dd'),
          isToday: isToday(date),
          isSelected: isSameDay(date, selectedDate),
        });
      }
      return days;
    }, [viewMode, currentMonth, selectedDate]);

    const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      setCurrentMonth(date);
      onDateSelect?.(date);
      const dateStr = format(date, 'yyyy-MM-dd');
      if (onOpenTaskInput) {
        onOpenTaskInput(dateStr);
      } else {
        useUIStore.getState().openQuickCapture(`todo: @${dateStr} `);
      }
    };

    // React 19 Concurrent Transitions for Month Navigation
    const handlePrev = () => {
      startTransition(() => {
        if (viewMode === 'weekly') {
          const prevWeek = addDays(selectedDate, -7);
          setSelectedDate(prevWeek);
          setCurrentMonth(prevWeek);
          onDateSelect?.(prevWeek);
        } else {
          setCurrentMonth((prev) => subMonths(prev, 1));
        }
      });
    };

    const handleNext = () => {
      startTransition(() => {
        if (viewMode === 'weekly') {
          const nextWeek = addDays(selectedDate, 7);
          setSelectedDate(nextWeek);
          setCurrentMonth(nextWeek);
          onDateSelect?.(nextWeek);
        } else {
          setCurrentMonth((prev) => addMonths(prev, 1));
        }
      });
    };

    const handleViewModeToggle = (mode: 'weekly' | 'monthly') => {
      startTransition(() => {
        setViewMode(mode);
      });
    };

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const selectedDaySchedule = scheduleByDate.get(selectedDateStr);

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-full rounded-2xl p-5 transition-all",
          // Subtle Notion-style Frosted Overlay: ultra-clean, minimal blur, zero aggressive drop-shadows
          "backdrop-blur-md bg-white/70 dark:bg-stone-900/70 border border-stone-200/60 dark:border-stone-800/60 shadow-xs",
          "text-stone-900 dark:text-stone-100 font-sans",
          className
        )}
        {...props}
      >
        <ScrollbarHide />

        {/* Header: Mode Switcher & Navigation Controls */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200/40 dark:border-stone-800/40">
          <div className="flex items-center p-0.5 rounded-lg bg-stone-100/90 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60">
            <button
              type="button"
              onClick={() => handleViewModeToggle('weekly')}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                viewMode === 'weekly'
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-semibold"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
              )}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => handleViewModeToggle('monthly')}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                viewMode === 'monthly'
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs font-semibold"
                  : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
              )}
            >
              Monthly
            </button>
          </div>

          {/* Micro Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              <span>Task</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded-full bg-emerald-600 dark:bg-emerald-500 inline-block" />
              <span>Deadline</span>
            </span>
          </div>
        </div>

        {/* Month Header and Month Navigation */}
        <div className="my-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <motion.h4
              key={`${format(currentMonth, 'MMMM-yyyy')}-${viewMode}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
            >
              {format(currentMonth, 'MMMM')}
            </motion.h4>
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
              {format(currentMonth, 'yyyy')}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isPending}
              aria-label="Previous Period"
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isPending}
              aria-label="Next Period"
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid (Weekly is evenly justified, Monthly is horizontal scrolling) */}
        <div className="overflow-x-auto scrollbar-hide -mx-2 px-2 py-1">
          <div className={cn("flex space-x-2.5", viewMode === 'weekly' && "justify-between space-x-1.5")}>
            {displayDays.map((day) => {
              const scheduled = scheduleByDate.get(day.dateStr);
              const hasTasks = scheduled?.tasks && scheduled.tasks.length > 0;
              const hasProjects = scheduled?.projects && scheduled.projects.length > 0;

              return (
                <div
                  key={day.dateStr}
                  className="flex flex-col items-center space-y-1.5 flex-shrink-0"
                >
                  {/* Day of Week Initial */}
                  <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 select-none">
                    {format(day.date, 'E').charAt(0)}
                  </span>

                  {/* Day Date Button */}
                  <button
                    type="button"
                    onClick={() => handleDateClick(day.date)}
                    title={`${format(day.date, 'PPP')}${
                      hasTasks ? ` • ${scheduled!.tasks.length} task(s)` : ''
                    }${hasProjects ? ` • Project: ${scheduled!.projects.map((p) => p.title).join(', ')}` : ''}`}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl text-xs font-medium transition-all duration-150 relative",
                      day.isSelected
                        ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-semibold shadow-xs"
                        : day.isToday
                        ? "text-stone-900 dark:text-stone-100 font-bold bg-stone-100 dark:bg-stone-800 ring-1 ring-stone-400/40"
                        : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80"
                    )}
                  >
                    {getDate(day.date)}
                  </button>

                  {/* Minimalist Color-Coded Indicators: Amber Dot for tasks, Sage Green Pill for Project Deadlines */}
                  <div className="h-2 flex items-center justify-center gap-1">
                    {hasTasks && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 shadow-xs"
                        title={`${scheduled!.tasks.length} task(s) scheduled`}
                      />
                    )}
                    {hasProjects && (
                      <span
                        className="h-1 w-2.5 rounded-full bg-emerald-600/80 dark:bg-emerald-400/80"
                        title={`Project deadline: ${scheduled!.projects.map((p) => p.title).join(', ')}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Strip (Subtle Notion Drawer Callout) */}
        {selectedDaySchedule && (selectedDaySchedule.tasks.length > 0 || selectedDaySchedule.projects.length > 0) && (
          <div className="mt-3 pt-3 border-t border-stone-200/40 dark:border-stone-800/40 flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              {format(selectedDate, 'MMM d')} Schedule
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto scrollbar-hide">
              {selectedDaySchedule.projects.map((proj, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50 truncate max-w-[200px]"
                >
                  <Flag className="w-3 h-3 shrink-0" />
                  <span className="truncate">{proj.title}</span>
                </span>
              ))}
              {selectedDaySchedule.tasks.map((task, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50 truncate max-w-[200px]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="truncate">{task.title}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="mt-3.5 h-px bg-stone-200/50 dark:bg-stone-800/50" />

        {/* Footer Actions: Notion Quick Add Date Pre-filled */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleDateClick(selectedDate)}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Add task for {format(selectedDate, 'MMM d')}...</span>
          </button>
          <button
            type="button"
            onClick={() => handleDateClick(selectedDate)}
            className="flex items-center gap-1 rounded-lg bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 px-2.5 py-1.5 text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Quick Capture</span>
          </button>
        </div>
      </div>
    );
  }
);

GlassCalendar.displayName = "GlassCalendar";
