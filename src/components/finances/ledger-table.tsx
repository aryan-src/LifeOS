'use client';

import React, { useState, useMemo, useOptimistic, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { TransactionWithRelations, FinancialAnalytics } from '@/lib/actions/finances';
import type { Category } from '@/types/database.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { TransactionEditModal } from './transaction-edit-modal';
import {
  Search,
  Pencil,
  Trash2,
  Table as TableIcon,
  LayoutGrid,
  Plus,
  AlertTriangle,
} from 'lucide-react';

export interface LedgerTableProps {
  transactions: TransactionWithRelations[];
  categories?: Category[];
  projects?: ProjectOption[];
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onEdit?: (tx: TransactionWithRelations) => void;
  onOptimisticUpdate?: (updatedTx: TransactionWithRelations) => void;
  currencySymbol?: string;
  activeTab?: 'today' | 'this_week' | 'monthly' | 'all';
  onTabChange?: (tab: 'today' | 'this_week' | 'monthly' | 'all') => void;
  activeTimeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  viewMode?: 'table' | 'cards';
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  onRecordExpense?: () => void;
  analytics?: FinancialAnalytics;
  showKpiStrip?: boolean;
}

type OptimisticAction =
  | { type: 'delete'; id: string }
  | { type: 'update'; updatedTx: TransactionWithRelations };

export function getCategoryBadge(name?: string | null) {
  const norm = (name || '').toLowerCase();
  if (
    norm.includes('junk') ||
    norm.includes('snack') ||
    norm.includes('fast food') ||
    norm.includes('noodles')
  ) {
    return {
      pill: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60',
      dot: 'bg-rose-500',
    };
  }
  if (
    norm.includes('juice') ||
    norm.includes('drink') ||
    norm.includes('tea') ||
    norm.includes('chai') ||
    norm.includes('coffee')
  ) {
    return {
      pill: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
      dot: 'bg-amber-500',
    };
  }
  if (norm.includes('veg') || norm.includes('fruit')) {
    return {
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
      dot: 'bg-emerald-500',
    };
  }
  if (
    norm.includes('groc') ||
    norm.includes('supermarket') ||
    norm.includes('provision')
  ) {
    return {
      pill: 'bg-teal-50 text-teal-700 border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/60',
      dot: 'bg-teal-500',
    };
  }
  if (
    norm.includes('commute') ||
    norm.includes('metro') ||
    norm.includes('bus') ||
    norm.includes('travel') ||
    norm.includes('auto') ||
    norm.includes('cab')
  ) {
    return {
      pill: 'bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60',
      dot: 'bg-sky-500',
    };
  }
  if (
    norm.includes('allowance') ||
    norm.includes('pocket money') ||
    norm.includes('salary') ||
    norm.includes('income')
  ) {
    return {
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
      dot: 'bg-emerald-500',
    };
  }
  return {
    pill: 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60',
    dot: 'bg-purple-500',
  };
}

export function LedgerTable({
  transactions: initialTransactions,
  categories = [],
  projects = [],
  onDelete,
  onEdit,
  onOptimisticUpdate,
  currencySymbol = '₹',
  activeTab,
  onTabChange,
  activeTimeframe,
  onTimeframeChange,
  viewMode = 'table',
  onViewModeChange,
  onRecordExpense,
  analytics,
  showKpiStrip = true,
}: LedgerTableProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [internalEditingTx, setInternalEditingTx] =
    useState<TransactionWithRelations | null>(null);
  const itemsPerPage = 10;
  const [, startTransition] = useTransition();

  const currentTab: 'today' | 'this_week' | 'monthly' | 'all' =
    activeTab ||
    (activeTimeframe === 'daily'
      ? 'today'
      : activeTimeframe === 'weekly'
      ? 'this_week'
      : activeTimeframe === 'monthly'
      ? 'monthly'
      : 'all');

  const handleTabClick = (tab: 'today' | 'this_week' | 'monthly' | 'all') => {
    setCurrentPage(1);
    if (onTabChange) {
      onTabChange(tab);
    } else if (onTimeframeChange) {
      onTimeframeChange(
        tab === 'today'
          ? 'daily'
          : tab === 'this_week'
          ? 'weekly'
          : tab === 'monthly'
          ? 'monthly'
          : 'all'
      );
    }
  };

  // React 19 native useOptimistic: zero-latency row removal from DOM
  const [optimisticTransactions, setOptimisticTransactions] = useOptimistic(
    initialTransactions,
    (state, action: OptimisticAction) => {
      if (action.type === 'delete') {
        return state.filter((tx) => tx.id !== action.id);
      }
      if (action.type === 'update') {
        return state.map((tx) =>
          tx.id === action.updatedTx.id ? action.updatedTx : tx
        );
      }
      return state;
    }
  );

  const handleDeleteClick = (id: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      setOptimisticTransactions({ type: 'delete', id });
      const res = await onDelete(id);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete transaction. Reverted.');
      }
    });
  };

  const handleEditClick = (tx: TransactionWithRelations) => {
    if (onEdit) {
      onEdit(tx);
    } else {
      setInternalEditingTx(tx);
    }
  };

  const handleInternalOptimisticUpdate = (
    updatedTx: TransactionWithRelations
  ) => {
    setOptimisticTransactions({ type: 'update', updatedTx });
    onOptimisticUpdate?.(updatedTx);
  };

  // Keyboard shortcut listener for Cmd+N / Ctrl+N to open Record Expense Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onRecordExpense?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRecordExpense]);

  // Client-side search filtering over description and category
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return optimisticTransactions;
    const query = searchQuery.toLowerCase();
    return optimisticTransactions.filter((tx) => {
      const matchDesc = (tx.description || '').toLowerCase().includes(query);
      const matchCat = (tx.category?.name || '').toLowerCase().includes(query);
      const matchProject = (tx.project?.slug || '').toLowerCase().includes(query);
      const matchPayee = (tx.payee_or_source || '').toLowerCase().includes(query);
      return matchDesc || matchCat || matchProject || matchPayee;
    });
  }, [optimisticTransactions, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Dynamic titles and labels
  const timeframeTitle =
    currentTab === 'today'
      ? "Today's Spending"
      : currentTab === 'this_week'
      ? "This Week's Spending"
      : currentTab === 'monthly'
      ? "This Month's Spending"
      : 'All Transactions';

  const timeframePillLabel =
    currentTab === 'today'
      ? 'Today'
      : currentTab === 'this_week'
      ? 'This Week'
      : currentTab === 'monthly'
      ? 'October'
      : 'All Time';

  // KPI Strip Metrics Calculation
  const totalSpent = useMemo(() => {
    return optimisticTransactions
      .filter((t) => t.type === 'expense' || (t.type !== 'income' && t.amount < 0))
      .reduce((acc, t) => acc + Math.abs(parseFloat(String(t.amount || 0))), 0);
  }, [optimisticTransactions]);

  const currentDateStr = analytics?.currentDate || '2026-10-19';
  const dayOfMonth = parseInt(currentDateStr.split('-')[2] || '19', 10);
  const dailyAverage = totalSpent / Math.max(1, dayOfMonth);

  const topCategoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    for (const t of optimisticTransactions) {
      if (t.type === 'income') continue;
      const catName = t.category?.name || 'Personal & Misc';
      catMap[catName] =
        (catMap[catName] || 0) + Math.abs(parseFloat(String(t.amount || 0)));
    }
    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { name: 'None', amount: 0 };
    return { name: entries[0][0], amount: entries[0][1] };
  }, [optimisticTransactions]);

  const monthlyCap = analytics?.monthlyAllowance && analytics.monthlyAllowance > 0
    ? analytics.monthlyAllowance
    : 5000;
  const budgetUsagePercent = Math.min(100, (totalSpent / monthlyCap) * 100);

  const topCategoryBadge = getCategoryBadge(topCategoryData.name);

  return (
    <div className="flex flex-col gap-6 w-full">
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200/60 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* BEGIN: PageTitleAndActions */}
      <div
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        data-purpose="page-title-banner"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-zinc-100">
              {timeframeTitle}
            </h1>
            <span
              id="record-counter-badge"
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stone-200/60 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border border-stone-300/40 dark:border-zinc-700/40"
            >
              {filteredItems.length} records
            </span>
          </div>
          <p className="mt-1.5 text-sm text-stone-500 dark:text-zinc-400 tracking-normal font-normal">
            Student pocket money outlays, allowance records, and daily expense flow.
          </p>
        </div>

        {/* Actions Toolbar (Filters, Views, New Expense) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Tabs (Segmented Control) */}
          <div
            className="inline-flex p-1 bg-stone-200/50 dark:bg-zinc-800/60 rounded-xl border border-stone-200/70 dark:border-zinc-700/60"
            role="tablist"
          >
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'all', label: 'All Feed' },
            ].map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`table-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls="finances-ledger-table"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() =>
                    handleTabClick(
                      tab.id as 'today' | 'this_week' | 'monthly' | 'all'
                    )
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-2xs font-semibold'
                      : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* View Switcher (Table / Grid) */}
          {onViewModeChange && (
            <div className="inline-flex p-1 bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                title="Table View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-zinc-100'
                    : 'text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('cards')}
                title="Grid Cards View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-zinc-100'
                    : 'text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Notion-style Record Expense CTA */}
          {onRecordExpense && (
            <button
              type="button"
              onClick={onRecordExpense}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-98 rounded-xl shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>
      {/* END: PageTitleAndActions */}

      {/* BEGIN: KPI Strip (Subtle Notion Metadata Style) */}
      {showKpiStrip && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          data-purpose="quick-metrics"
        >
          {/* Card 1: Total Spent */}
          <div className="bg-white/80 dark:bg-zinc-900/80 border border-stone-200/70 dark:border-zinc-800/70 rounded-xl p-3.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 dark:text-zinc-500">
              Total Spent
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                id="kpi-total"
                className="text-base font-semibold font-mono text-stone-900 dark:text-zinc-100 tabular-nums"
              >
                {`-${currencySymbol}${totalSpent.toFixed(2)}`}
              </span>
              <span className="text-[11px] text-rose-500 font-medium">
                {timeframePillLabel}
              </span>
            </div>
          </div>

          {/* Card 2: Daily Average */}
          <div className="bg-white/80 dark:bg-zinc-900/80 border border-stone-200/70 dark:border-zinc-800/70 rounded-xl p-3.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 dark:text-zinc-500">
              Daily Average
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-semibold font-mono text-stone-900 dark:text-zinc-100 tabular-nums">
                {`${currencySymbol}${dailyAverage.toFixed(2)}`}
              </span>
              <span className="text-[11px] text-stone-400 dark:text-zinc-500">
                / day
              </span>
            </div>
          </div>

          {/* Card 3: Top Outlay Category */}
          <div className="bg-white/80 dark:bg-zinc-900/80 border border-stone-200/70 dark:border-zinc-800/70 rounded-xl p-3.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 dark:text-zinc-500">
              Top Outlay Category
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${topCategoryBadge.dot}`}
              />
              <span className="text-sm font-medium text-stone-800 dark:text-zinc-200 truncate">
                {topCategoryData.name}{' '}
                <span className="font-mono text-xs text-stone-500 dark:text-zinc-400">
                  ({currencySymbol}
                  {topCategoryData.amount.toFixed(0)})
                </span>
              </span>
            </div>
          </div>

          {/* Card 4: Monthly Budget Cap */}
          <div className="bg-white/80 dark:bg-zinc-900/80 border border-stone-200/70 dark:border-zinc-800/70 rounded-xl p-3.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 dark:text-zinc-500">
              Monthly Budget Cap
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm font-semibold font-mono text-stone-800 dark:text-zinc-200 tabular-nums">
                {budgetUsagePercent.toFixed(1)}%
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                {currencySymbol}
                {monthlyCap.toLocaleString()} max
              </span>
            </div>
          </div>
        </div>
      )}
      {/* END: KPI Strip */}

      {/* BEGIN: Search & Filter Inline Toolbar */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="relative w-full max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400 dark:text-zinc-500">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            id="table-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter description, category..."
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900/80 border border-stone-200/80 dark:border-zinc-800 rounded-lg text-xs placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:border-stone-400 text-stone-800 dark:text-zinc-100 transition-all"
          />
        </div>

        {/* Quick inline pill status */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400 dark:text-zinc-500">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Auto-synced</span>
        </div>
      </div>
      {/* END: Search & Filter Inline Toolbar */}

      {/* BEGIN: LedgerDataTableCard */}
      <div
        className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl shadow-subtle overflow-hidden"
        data-purpose="ledger-table-wrapper"
      >
        <div className="overflow-x-auto min-h-[460px]">
          <table
            className="w-full text-left border-collapse"
            id="spending-ledger-table"
          >
            {/* Table Header */}
            <thead>
              <tr className="border-b border-stone-200/70 dark:border-zinc-800/70 bg-stone-50/70 dark:bg-zinc-800/40 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-500 select-none">
                <th className="py-3 px-4 sm:px-6 w-[130px]" scope="col">
                  Date
                </th>
                <th className="py-3 px-4 sm:px-6 min-w-[200px]" scope="col">
                  Description
                </th>
                <th className="py-3 px-4 sm:px-6 w-[160px]" scope="col">
                  Category
                </th>
                <th className="py-3 px-4 sm:px-6 w-[120px]" scope="col">
                  Project
                </th>
                <th
                  className="py-3 px-4 sm:px-6 text-right w-[140px]"
                  scope="col"
                >
                  Amount
                </th>
                <th
                  className="py-3 px-4 sm:px-6 text-right w-[90px] pr-6"
                  scope="col"
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body with Dynamic Content & Framer Motion Physics */}
            <tbody
              className="divide-y divide-stone-100/90 dark:divide-zinc-800/60 text-sm"
              id="ledger-table-body"
            >
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-stone-400 dark:text-zinc-500"
                  >
                    <p className="font-medium text-sm text-stone-600 dark:text-zinc-300">
                      No transactions found
                    </p>
                    <p className="text-xs text-stone-400 dark:text-zinc-500 mt-1">
                      {searchQuery
                        ? 'Try adjusting your search filter'
                        : 'Record a new student expense to start tracking'}
                    </p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {paginatedTransactions.map((row) => {
                    const isIncome = row.type === 'income' || row.amount > 0;
                    const parsedAmount = Math.abs(
                      parseFloat(String(row.amount || 0))
                    );
                    const badge = getCategoryBadge(row.category?.name);

                    return (
                      <motion.tr
                        key={row.id}
                        layout
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="group transition-colors duration-150 hover:bg-stone-50/80 dark:hover:bg-zinc-800/40"
                      >
                        {/* Date */}
                        <td className="py-3 px-4 sm:px-6 font-mono text-xs text-stone-500 dark:text-zinc-400 whitespace-nowrap">
                          {row.date}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4 sm:px-6 font-medium text-stone-800 dark:text-zinc-100 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span>{row.description}</span>
                            {row.payee_or_source && (
                              <span className="text-[11px] text-stone-400 dark:text-zinc-500 font-normal">
                                {row.payee_or_source}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 sm:px-6 whitespace-nowrap">
                          {row.category ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${badge.pill}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}
                              />
                              <span>{row.category.name}</span>
                            </span>
                          ) : (
                            <span className="text-stone-300 dark:text-zinc-600 font-light">
                              —
                            </span>
                          )}
                        </td>

                        {/* Project */}
                        <td className="py-3 px-4 sm:px-6 text-stone-300 dark:text-zinc-600 font-light whitespace-nowrap">
                          {row.project ? (
                            <span className="font-mono text-xs text-stone-600 dark:text-zinc-400">
                              #{row.project.slug}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Amount */}
                        <td
                          className={`py-3 px-4 sm:px-6 text-right font-mono font-medium tabular-nums whitespace-nowrap ${
                            isIncome
                              ? 'text-emerald-600/90 dark:text-emerald-400'
                              : 'text-rose-600/90 dark:text-rose-400'
                          }`}
                        >
                          {`${isIncome ? '+' : '-'}${currencySymbol}${parsedAmount.toFixed(2)}`}
                        </td>

                        {/* Actions (Trash & Edit) */}
                        <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              type="button"
                              onClick={() => handleEditClick(row)}
                              title="Edit entry"
                              className="p-1 rounded-md text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(row.id)}
                              title="Delete entry"
                              className="p-1 rounded-md text-stone-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* BEGIN: TableFooterPagination */}
        <div
          className="px-4 sm:px-6 py-3.5 border-t border-stone-200/60 dark:border-zinc-800/60 bg-stone-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          data-purpose="table-pagination"
        >
          <p
            className="text-stone-500 dark:text-zinc-400 font-mono"
            id="pagination-status"
          >
            Showing{' '}
            <span className="font-semibold text-stone-700 dark:text-zinc-200">
              {filteredItems.length === 0 ? 0 : startIndex + 1}
            </span>
            –
            <span
              className="font-semibold text-stone-700 dark:text-zinc-200"
              id="current-visible-count"
            >
              {Math.min(startIndex + itemsPerPage, filteredItems.length)}
            </span>{' '}
            of{' '}
            <span
              className="font-semibold text-stone-700 dark:text-zinc-200"
              id="total-count-label"
            >
              {filteredItems.length}
            </span>{' '}
            entries
          </p>

          <div className="flex items-center gap-1.5 font-medium">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
              const isActive = currentPage === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium shadow-2xs'
                      : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-200/50 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {num}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
        {/* END: TableFooterPagination */}
      </div>
      {/* END: LedgerDataTableCard */}

      {/* Micro-hint banner */}
      <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-zinc-500 px-2">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-[10px] text-stone-500 dark:text-zinc-400">
            ⌘ + N
          </kbd>
          <span>to quickly log an expense</span>
        </div>
        <span>All edits synced locally</span>
      </div>

      {/* Standalone edit modal if mounted directly without external handler */}
      {internalEditingTx && (
        <TransactionEditModal
          isOpen={true}
          transaction={internalEditingTx}
          categories={categories}
          projects={projects}
          onClose={() => setInternalEditingTx(null)}
          onOptimisticUpdate={handleInternalOptimisticUpdate}
        />
      )}
    </div>
  );
}

export default LedgerTable;
