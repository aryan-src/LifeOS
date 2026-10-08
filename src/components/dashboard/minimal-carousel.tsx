'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  CheckCircle2,
  FolderKanban,
  StickyNote,
  ArrowRight,
  ChevronRight,
  X,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { getTodayDate } from '@/lib/utils/date';
import type { FinancialAnalytics } from '@/lib/actions/finances';
import type { TaskWithProject } from '@/lib/actions/tasks';
import type { ProjectWithMetrics } from '@/lib/actions/projects';
import type { NoteWithProject } from '@/lib/actions/notes';

/* --- Types --- */
export interface CarouselCardPreviewItem {
  id: string;
  label: string;
  sublabel?: string;
  meta?: string;
}

export interface CarouselCard {
  id: string;
  module: 'finances' | 'tasks' | 'projects' | 'notes';
  title: string;
  value: string;
  subtitle: string;
  badge?: string;
  color: string;
  accentBg: string;
  accentText: string;
  icon: React.ElementType;
  primaryAction: {
    label: string;
    route: string;
  };
  secondaryAction: {
    label: string;
    route: string;
  };
  previewItems?: CarouselCardPreviewItem[];
}

export interface MinimalCarouselProps {
  cards: CarouselCard[];
  initialActiveId?: string | null;
  onCopyClick?: (card: CarouselCard) => void;
  onCustomizeClick?: (card: CarouselCard) => void;
  className?: string;
}

export const MinimalCarousel: React.FC<MinimalCarouselProps> = ({
  cards,
  initialActiveId = null,
  onCopyClick,
  onCustomizeClick,
  className = '',
}) => {
  const [activeId, setActiveId] = useState<string | null>(initialActiveId);
  const router = useRouter();

  const activeCard = cards.find((c) => c.id === activeId);
  const secondaryCards = cards.filter((c) => c.id !== activeId);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setActiveId(null);
    }
  };

  const handlePrimaryAction = (card: CarouselCard, e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyClick?.(card);
    router.push(card.primaryAction.route);
  };

  const handleSecondaryAction = (card: CarouselCard, e: React.MouseEvent) => {
    e.stopPropagation();
    onCustomizeClick?.(card);
    router.push(card.secondaryAction.route);
  };

  return (
    <div
      className={`w-full flex flex-col items-center justify-center select-none font-sans ${className}`}
      onClick={handleBackgroundClick}
    >
      <div className="w-full max-w-5xl">
        <motion.div layout className="flex flex-col gap-3 sm:gap-4">
          {/* Expanded Hero Card */}
          <AnimatePresence mode="popLayout">
            {activeCard && (
              <motion.div
                key={activeCard.id}
                layoutId={activeCard.id}
                className={`relative flex w-full flex-col justify-between
                           rounded-2xl sm:rounded-3xl p-5 sm:p-7 border
                           shadow-xs transition-colors duration-300
                           ${activeCard.color}
                           min-h-[220px] sm:min-h-[260px]`}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              >
                {/* Top Row: Icon Badge, Module Tag, Collapse Button & Primary Action */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl shrink-0 ${activeCard.accentBg} ${activeCard.accentText}`}
                    >
                      <activeCard.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold tracking-wider uppercase opacity-70">
                        {activeCard.module}
                      </span>
                      {activeCard.badge && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 w-fit ${activeCard.accentBg} ${activeCard.accentText}`}
                        >
                          {activeCard.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Primary Context-Aware Action (e.g., "Open Ledger", "View Board") */}
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      type="button"
                      onClick={(e) => handlePrimaryAction(activeCard, e)}
                      className="flex items-center gap-1.5 rounded-xl border border-stone-300/70 dark:border-stone-700/70
                                 bg-white/80 dark:bg-stone-800/80 px-3.5 py-2
                                 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100
                                 hover:bg-white dark:hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>{activeCard.primaryAction.label}</span>
                      <ArrowRight size={14} className="opacity-60" />
                    </motion.button>

                    {/* Collapse Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveId(null);
                      }}
                      title="Collapse card"
                      className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200
                                 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Middle: Title, Dynamic Metrics, & Mini Item Previews */}
                <div className="my-4 flex flex-col gap-3">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
                      {activeCard.title}
                    </h3>
                    <p className="text-base sm:text-lg font-medium opacity-80 mt-0.5">
                      {activeCard.value}
                    </p>
                    <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                      {activeCard.subtitle}
                    </p>
                  </div>

                  {/* Context Preview List if items exist */}
                  {activeCard.previewItems && activeCard.previewItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-200/50 dark:border-stone-800/50">
                      {activeCard.previewItems.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-white/60 dark:bg-stone-900/40 border border-stone-200/40 dark:border-stone-800/40 flex flex-col justify-between min-w-0"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                              {item.label}
                            </span>
                            {item.meta && (
                              <span className="text-[10px] text-stone-500 font-mono shrink-0">
                                {item.meta}
                              </span>
                            )}
                          </div>
                          {item.sublabel && (
                            <span className="text-[11px] text-stone-500 truncate mt-0.5">
                              {item.sublabel}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Secondary Action & Hint */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-200/40 dark:border-stone-800/40">
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    Click outside or press anywhere to fold
                  </span>

                  {/* Secondary Context-Aware Action (e.g. "Record Expense", "New Scratch") */}
                  <button
                    type="button"
                    onClick={(e) => handleSecondaryAction(activeCard, e)}
                    className="flex items-center gap-1 rounded-xl border border-stone-300/60 dark:border-stone-700/60
                               bg-white/70 dark:bg-stone-800/70 px-3.5 py-1.5
                               text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100
                               hover:bg-white dark:hover:bg-stone-800 transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    <span>{activeCard.secondaryAction.label}</span>
                    <ChevronRight size={14} className="opacity-50" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid Layout (Collapses into 3 columns if one is active, or 2x2 grid if none active) */}
          <motion.div
            layout
            className={`grid gap-3 sm:gap-4 transition-all duration-300 ${
              activeId
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2'
            }`}
          >
            {(activeId ? secondaryCards : cards).map((card) => (
              <motion.div
                key={card.id}
                layoutId={card.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveId(card.id);
                }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                className={`relative flex flex-col justify-between cursor-pointer
                           rounded-2xl sm:rounded-3xl p-4 sm:p-5 border
                           shadow-xs hover:border-stone-300 dark:hover:border-stone-700
                           transition-all
                           ${card.color}
                           ${activeId ? 'h-28 sm:h-32' : 'h-36 sm:h-40'}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div
                    className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl shrink-0 ${card.accentBg} ${card.accentText}`}
                  >
                    <card.icon className={activeId ? 'w-4 h-4' : 'w-5 h-5'} />
                  </div>
                  {card.badge && (
                    <span
                      className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${card.accentBg} ${card.accentText} shrink-0`}
                    >
                      {card.badge}
                    </span>
                  )}
                </div>

                <div className="mt-2 overflow-hidden">
                  <h4
                    className={`font-semibold text-stone-900 dark:text-stone-100 truncate leading-tight ${
                      activeId ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                    }`}
                  >
                    {card.title}
                  </h4>
                  <p
                    className={`font-semibold mt-0.5 truncate opacity-90 ${
                      activeId ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                    }`}
                  >
                    {card.value}
                  </p>
                  {!activeId && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-1">
                      {card.subtitle}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

/* --- Data Binder: Maps Server Component telemetry to CarouselCard[] --- */
export function buildDashboardCards({
  analytics,
  tasks,
  projects,
  notes,
}: {
  analytics?: FinancialAnalytics | null;
  tasks?: TaskWithProject[] | null;
  projects?: ProjectWithMetrics[] | null;
  notes?: NoteWithProject[] | null;
} = {}): CarouselCard[] {
  const currency = analytics?.currencySymbol || '₹';
  const todayStr = analytics?.currentDate || getTodayDate();

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeNotes = Array.isArray(notes) ? notes : [];

  // 1. Finances data
  const remainingAllowance = typeof analytics?.remainingAllowance === 'number' ? analytics.remainingAllowance : 15000;
  const allowanceUsage = typeof analytics?.allowanceUsagePercent === 'number' ? analytics.allowanceUsagePercent : 0;
  const safeBufferPercent = Math.max(0, 100 - allowanceUsage);
  const monthlyAllowance = typeof analytics?.monthlyAllowance === 'number' ? analytics.monthlyAllowance : 15000;
  const safeDailyBudget = typeof analytics?.safeDailyBudget === 'number' ? analytics.safeDailyBudget : 500;
  const monthlySpent = typeof analytics?.monthlySpent === 'number' ? analytics.monthlySpent : 0;

  // 2. Tasks data
  const completedTasks = safeTasks.filter((t) => t?.is_completed);
  const pendingTodayTasks = safeTasks.filter(
    (t) => !t?.is_completed && (!t?.due_date || t.due_date <= todayStr)
  );
  const tasksPercent =
    safeTasks.length > 0
      ? Math.round((completedTasks.length / safeTasks.length) * 100)
      : 0;

  // 3. Projects data
  const activeProjects = safeProjects.filter((p) => p?.status === 'active');
  const completedProjects = safeProjects.filter((p) => p?.status === 'completed');
  const backlogProjects = safeProjects.filter((p) => p?.status === 'backlog');

  const latestNoteTitle =
    safeNotes.length > 0 && safeNotes[0]?.title
      ? `Latest: "${safeNotes[0].title}"`
      : 'Scratchpad is ready for new ideas';

  return [
    // Quadrant 1: Pocket Money Tracker (Soft Sage palette)
    {
      id: 'finances-card',
      module: 'finances',
      title: 'Pocket Money Tracker',
      value: `${currency}${formatCurrency(remainingAllowance)} remaining balance`,
      subtitle: `Safe daily runway: ${currency}${formatCurrency(safeDailyBudget)}/day`,
      badge: `${safeBufferPercent}% buffer`,
      color:
        'bg-emerald-50/70 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40 text-stone-900 dark:text-stone-100',
      accentBg: 'bg-emerald-100/80 dark:bg-emerald-900/40',
      accentText: 'text-emerald-800 dark:text-emerald-300',
      icon: Wallet,
      primaryAction: {
        label: 'Open Ledger',
        route: '/finances',
      },
      secondaryAction: {
        label: 'Record Expense',
        route: '/finances',
      },
      previewItems: [
        {
          id: 'fin-1',
          label: 'Pool Total',
          meta: `${currency}${formatCurrency(monthlyAllowance)}`,
          sublabel: 'Monthly cap',
        },
        {
          id: 'fin-2',
          label: 'Safe Pace',
          meta: `${currency}${formatCurrency(safeDailyBudget)}`,
          sublabel: 'Per day guidance',
        },
        {
          id: 'fin-3',
          label: 'Spent',
          meta: `${currency}${formatCurrency(monthlySpent)}`,
          sublabel: `${allowanceUsage}% utilized`,
        },
      ],
    },

    // Quadrant 2: Today's Focus (Warm Amber palette)
    {
      id: 'tasks-card',
      module: 'tasks',
      title: "Today's Focus",
      value: `${completedTasks.length} of ${safeTasks.length} tasks completed`,
      subtitle: `${pendingTodayTasks.length} pending scheduled today`,
      badge: `${tasksPercent}% complete`,
      color:
        'bg-amber-50/70 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40 text-stone-900 dark:text-stone-100',
      accentBg: 'bg-amber-100/80 dark:bg-amber-900/40',
      accentText: 'text-amber-800 dark:text-amber-300',
      icon: CheckCircle2,
      primaryAction: {
        label: 'Priority Matrix',
        route: '/tasks',
      },
      secondaryAction: {
        label: 'Add Task',
        route: '/tasks',
      },
      previewItems: pendingTodayTasks.slice(0, 3).map((t) => ({
        id: t.id,
        label: t.title || 'Untitled task',
        meta: typeof t.priority === 'number' && t.priority > 0 ? `P${t.priority}` : undefined,
        sublabel: t.project ? `#${t.project.slug}` : 'Daily Focus',
      })),
    },

    // Quadrant 3: Active Projects (Soft Indigo palette)
    {
      id: 'projects-card',
      module: 'projects',
      title: 'Active Projects',
      value: `${activeProjects.length} Ongoing Workstreams`,
      subtitle: `${completedProjects.length} completed • ${backlogProjects.length} backlog`,
      badge: `${activeProjects.length} Active`,
      color:
        'bg-indigo-50/70 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30 border-indigo-200/60 dark:border-indigo-800/40 text-stone-900 dark:text-stone-100',
      accentBg: 'bg-indigo-100/80 dark:bg-indigo-900/40',
      accentText: 'text-indigo-800 dark:text-indigo-300',
      icon: FolderKanban,
      primaryAction: {
        label: 'View Board',
        route: '/projects',
      },
      secondaryAction: {
        label: 'New Project',
        route: '/projects',
      },
      previewItems: activeProjects.slice(0, 3).map((p) => ({
        id: p.id,
        label: p.title || 'Untitled project',
        meta: `${p.completion_percentage ?? 0}%`,
        sublabel: `#${p.slug || 'project'} • ${p.total_tasks ?? 0} tasks`,
      })),
    },

    // Quadrant 4: Recent Ideas & Scratchpad (Soft Rose / Terracotta palette)
    {
      id: 'notes-card',
      module: 'notes',
      title: 'Recent Ideas & Scratchpad',
      value: `${safeNotes.length} thoughts in vault`,
      subtitle: latestNoteTitle,
      badge: `${safeNotes.length} Notes`,
      color:
        'bg-rose-50/70 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/40 text-stone-900 dark:text-stone-100',
      accentBg: 'bg-rose-100/80 dark:bg-rose-900/40',
      accentText: 'text-rose-800 dark:text-rose-300',
      icon: StickyNote,
      primaryAction: {
        label: 'Open Notes',
        route: '/notes',
      },
      secondaryAction: {
        label: 'New Scratch',
        route: '/notes',
      },
      previewItems: safeNotes.slice(0, 3).map((n) => ({
        id: n.id,
        label: n.title || 'Untitled idea',
        sublabel: n.content ? n.content.substring(0, 45) : 'Empty note',
      })),
    },
  ];
}
