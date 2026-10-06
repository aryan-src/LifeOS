'use client';

import React, { useOptimistic, useTransition, useState, useMemo } from 'react';
import { Tag, Folder, Trash2, AlertTriangle, Search, Filter, ArrowDownRight, ArrowUpRight, Pencil } from 'lucide-react';
import type { TransactionWithRelations } from '@/lib/actions/finances';
import { formatCurrency } from '@/lib/utils/format';

interface StudentExpenseFeedProps {
  transactions: TransactionWithRelations[];
  activeTimeframe: 'all' | 'daily' | 'weekly' | 'monthly';
  currentDate?: string;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onEdit?: (tx: TransactionWithRelations) => void;
  currencySymbol?: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Stationary': '📚',
  'Junk Food': '🍕',
  'Vegetable': '🥦',
  'Fruits': '🍎',
  'Juice': '🧃',
  'Personal & Misc': '☕',
  'Allowance': '💵',
  'Commute': '🚌',
  'Subscription': '🎧',
};

export function StudentExpenseFeed({
  transactions: initialTransactions,
  activeTimeframe,
  currentDate,
  onDelete,
  onEdit,
  currencySymbol = '₹',
}: StudentExpenseFeedProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [, startTransition] = useTransition();

  // React 19 native useOptimistic: zero-latency deletion from the DOM
  const [optimisticTransactions, setOptimisticTransactions] = useOptimistic(
    initialTransactions,
    (state, deletedId: string) => state.filter((tx) => tx.id !== deletedId)
  );

  const handleDeleteClick = (id: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      setOptimisticTransactions(id);
      const res = await onDelete(id);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete transaction. Reverted.');
      }
    });
  };

  // Deterministic date boundary based on server-synchronized currentDate
  const todayStr = useMemo(() => {
    return currentDate || new Date().toISOString().split('T')[0];
  }, [currentDate]);

  const yesterdayStr = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const prev = new Date(Date.UTC(y, m - 1, d - 1));
    return prev.toISOString().split('T')[0];
  }, [todayStr]);

  const currentYearMonth = useMemo(() => todayStr.substring(0, 7), [todayStr]);

  // Trailing 7 days date strings set (UTC safe)
  const trailing7DaysSet = useMemo(() => {
    const set = new Set<string>();
    const [y, m, d] = todayStr.split('-').map(Number);
    for (let i = 0; i < 7; i++) {
      const prevDate = new Date(Date.UTC(y, m - 1, d - i));
      set.add(prevDate.toISOString().split('T')[0]);
    }
    return set;
  }, [todayStr]);

  // Filter transactions by timeframe, search, and category
  const filteredTransactions = useMemo(() => {
    return optimisticTransactions.filter((tx) => {
      // Timeframe filter
      if (activeTimeframe === 'daily' && tx.date !== todayStr) {
        return false;
      }
      if (activeTimeframe === 'weekly' && !trailing7DaysSet.has(tx.date)) {
        return false;
      }
      if (activeTimeframe === 'monthly' && !tx.date.startsWith(currentYearMonth)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesPayee = tx.payee_or_source?.toLowerCase().includes(query) || false;
        const matchesProject = tx.project?.slug.toLowerCase().includes(query) || false;
        const matchesCategory = tx.category?.name.toLowerCase().includes(query) || false;
        if (!matchesDesc && !matchesPayee && !matchesProject && !matchesCategory) {
          return false;
        }
      }

      // Category filter
      if (selectedCategoryFilter !== 'all') {
        if (tx.category?.name !== selectedCategoryFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    optimisticTransactions,
    activeTimeframe,
    todayStr,
    trailing7DaysSet,
    currentYearMonth,
    searchQuery,
    selectedCategoryFilter,
  ]);

  // Extract unique category names for filter dropdown
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const t of optimisticTransactions) {
      if (t.category?.name) {
        cats.add(t.category.name);
      }
    }
    return Array.from(cats);
  }, [optimisticTransactions]);

  // Group transactions by date label ("Today", "Yesterday", or Date)
  const groupedTransactions = useMemo(() => {
    const groups: { label: string; date: string; items: TransactionWithRelations[]; total: number }[] = [];
    const map = new Map<string, { label: string; date: string; items: TransactionWithRelations[]; total: number }>();

    for (const tx of filteredTransactions) {
      let label = tx.date;
      if (tx.date === todayStr) {
        label = 'Today';
      } else if (tx.date === yesterdayStr) {
        label = 'Yesterday';
      }

      let group = map.get(label);
      if (!group) {
        group = { label, date: tx.date, items: [], total: 0 };
        map.set(label, group);
        groups.push(group);
      }

      group.items.push(tx);
      // Net change for the day
      if (tx.type === 'income') {
        group.total += Math.abs(tx.amount);
      } else {
        group.total -= Math.abs(tx.amount);
      }
    }

    return groups;
  }, [filteredTransactions, todayStr, yesterdayStr]);

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses, canteen meals, project tags..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <p className="text-sm font-medium text-slate-300">No transactions found</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {activeTimeframe === 'daily'
              ? "You haven't logged any expenses for today yet. Use the Quick Logger above to record today's canteen lunch or coffee!"
              : 'Try clearing filters or search to view more records.'}
          </p>
        </div>
      ) : (
        /* Grouped Card-Based Stream */
        <div className="space-y-6">
          {groupedTransactions.map((group) => (
            <div key={group.label} className="space-y-2.5">
              {/* Group Date Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {group.label}
                  </h4>
                  {group.label !== group.date && (
                    <span className="text-[10px] text-slate-500 font-mono">({group.date})</span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {group.items.length} {group.items.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              {/* Transactions in Group */}
              <div className="divide-y divide-slate-800/60 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden">
                {group.items.map((tx) => {
                  const isIncome = tx.type === 'income' || tx.amount > 0;
                  const absAmount = Math.abs(tx.amount);
                  const catName = tx.category?.name || 'Personal & Misc';
                  const emoji = CATEGORY_EMOJIS[catName] || '🏷️';

                  return (
                    <div
                      key={tx.id}
                      className="group flex items-center justify-between p-3.5 hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Left: Icon & Description */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-inner"
                          style={{
                            backgroundColor: `${tx.category?.color || '#6366f1'}15`,
                            border: `1px solid ${tx.category?.color || '#6366f1'}30`,
                          }}
                        >
                          <span>{emoji}</span>
                        </div>

                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-white truncate">
                              {tx.description}
                            </span>

                            {/* Project Tag */}
                            {tx.project && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
                                <Folder size={10} />
                                #{tx.project.slug}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span style={{ color: tx.category?.color || '#94a3b8' }}>
                              {catName}
                            </span>
                            {tx.payee_or_source && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500">{tx.payee_or_source}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Delete Button */}
                      <div className="flex items-center gap-3 shrink-0 pl-4">
                        <div className="text-right">
                          <span
                            suppressHydrationWarning
                            className={`text-sm font-bold font-mono ${
                              isIncome ? 'text-emerald-400' : 'text-slate-100'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{currencySymbol}{formatCurrency(absAmount)}
                          </span>
                        </div>

                        {/* Action Buttons: Edit & Delete */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(tx)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition"
                              title="Edit entry"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(tx.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400 transition"
                            title="Delete entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
