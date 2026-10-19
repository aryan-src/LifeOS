'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AllowanceHeroCard } from './allowance-hero-card';
import { LedgerTable } from './ledger-table';
import { StudentExpenseFeed } from './student-expense-feed';
import { RecordExpenseModal } from './record-expense-modal';
import { TransactionEditModal } from './transaction-edit-modal';
import {
  deleteTransaction,
  type TransactionWithRelations,
  type FinancialAnalytics,
} from '@/lib/actions/finances';
import type { Category } from '@/types/database.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import {
  AlertTriangle,
  CheckCircle2,
  Home,
  BarChart2,
  Table as TableIcon,
} from 'lucide-react';
import { getTodayDate } from '@/lib/utils/date';

export type TimeFilterTab = 'today' | 'this_week' | 'monthly' | 'all';

export interface FinancesClientViewProps {
  initialTransactions: TransactionWithRelations[];
  analytics: FinancialAnalytics;
  categories: Category[];
  projects: ProjectOption[];
}

function getWeekRange(dateStr: string): { startOfWeek: string; endOfWeek: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayOfMonth}`;
  };

  return {
    startOfWeek: format(monday),
    endOfWeek: format(sunday),
  };
}

export function FinancesClientView({
  initialTransactions,
  analytics,
  categories,
  projects,
}: FinancesClientViewProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isChartsVisible, setIsChartsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<TimeFilterTab>('monthly');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithRelations | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [, startTransition] = useTransition();

  React.useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const handleTabChange = (tab: TimeFilterTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  const handleViewModeChange = (mode: 'cards' | 'table') => {
    startTransition(() => {
      setViewMode(mode);
    });
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDelete = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const res = await deleteTransaction(id);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to delete transaction.');
      setTransactions(initialTransactions);
    } else {
      showToast('Transaction removed from ledger', 'success');
    }
    return res;
  };

  const handleEditAllowance = () => {
    const allowanceTx = transactions.find(
      (t) =>
        t.type === 'income' ||
        t.category?.name.toLowerCase().includes('pocket money') ||
        t.category?.name.toLowerCase().includes('allowance')
    );

    if (allowanceTx) {
      setEditingTransaction(allowanceTx);
    } else {
      setIsRecordModalOpen(true);
    }
  };

  const handleOptimisticUpdate = (updatedTx: TransactionWithRelations) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
    showToast('Transaction updated successfully', 'success');
  };

  const handleOptimisticCreate = (newTx: TransactionWithRelations) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleError = (errorMsg: string) => {
    setTransactions(initialTransactions);
    showToast(errorMsg, 'error');
  };

  // Base monthly budget (fallback to 5000 if not configured)
  const monthlyBaseline =
    analytics.monthlyAllowance > 0 ? analytics.monthlyAllowance : 5000;

  // Days in current month cycle
  const todayStr = analytics.currentDate || getTodayDate();
  const [currentYearStr, currentMonthStr] = todayStr.split('-');
  const totalDaysInMonth = useMemo(() => {
    const y = parseInt(currentYearStr || '2026', 10);
    const m = parseInt(currentMonthStr || '10', 10);
    return new Date(y, m, 0).getDate() || 30;
  }, [currentYearStr, currentMonthStr]);

  // Recorded cycles count across transaction history for "all"
  const recordedCyclesCount = useMemo(() => {
    const months = new Set<string>();
    months.add(todayStr.substring(0, 7));
    for (const t of transactions) {
      if (t.date) {
        months.add(t.date.substring(0, 7));
      }
    }
    return Math.max(1, months.size);
  }, [transactions, todayStr]);

  // Scaled budget limit relative to active tab scope
  const filteredLimit = useMemo(() => {
    switch (activeTab) {
      case 'today':
        return Number((monthlyBaseline / totalDaysInMonth).toFixed(2));
      case 'this_week':
        return Number((monthlyBaseline / 4).toFixed(2));
      case 'monthly':
        return monthlyBaseline;
      case 'all':
        return monthlyBaseline * recordedCyclesCount;
      default:
        return monthlyBaseline;
    }
  }, [activeTab, monthlyBaseline, totalDaysInMonth, recordedCyclesCount]);

  // Deterministic timeframe-based filtering
  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') return transactions;

    if (activeTab === 'today') {
      return transactions.filter((t) => t.date === todayStr);
    }

    if (activeTab === 'this_week') {
      const { startOfWeek, endOfWeek } = getWeekRange(todayStr);
      const trailing7Set = new Set(
        analytics.weeklyDays?.map((d) => d.date) || []
      );
      return transactions.filter(
        (t) =>
          (t.date >= startOfWeek && t.date <= endOfWeek) ||
          trailing7Set.has(t.date)
      );
    }

    if (activeTab === 'monthly') {
      const currentYearMonth = todayStr.substring(0, 7);
      return transactions.filter((t) => t.date.startsWith(currentYearMonth));
    }

    return transactions;
  }, [transactions, activeTab, todayStr, analytics.weeklyDays]);

  const filteredSpent = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense' || (t.type !== 'income' && t.amount < 0))
      .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
  }, [filteredTransactions]);

  const filteredRemaining = useMemo(() => {
    return filteredLimit - filteredSpent;
  }, [filteredLimit, filteredSpent]);

  const filteredCategoryBreakdown = useMemo(() => {
    const catMap: Record<
      string,
      { value: number; count: number; color?: string }
    > = {};
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') continue;
      const catName = tx.category?.name || 'Personal & Misc';
      const catColor = tx.category?.color || '#a855f7';
      if (!catMap[catName]) {
        catMap[catName] = { value: 0, count: 0, color: catColor };
      }
      catMap[catName].value += Math.abs(Number(tx.amount || 0));
      catMap[catName].count += 1;
    }
    const totalSpent = Object.values(catMap).reduce(
      (sum, c) => sum + c.value,
      0
    );
    return Object.entries(catMap)
      .map(([name, data]) => ({
        name,
        value: Number(data.value.toFixed(2)),
        count: data.count,
        color: data.color || '#a855f7',
        percentage:
          totalSpent > 0 ? Math.round((data.value / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1240px] mx-auto">
      {/* Top Navigation Breadcrumb / Workspace Header */}
      <header
        className="flex items-center justify-between pb-4 border-b border-stone-200/60 dark:border-zinc-800/60"
        data-purpose="workspace-header"
      >
        <div className="flex items-center space-x-2 text-xs font-medium text-stone-400 dark:text-zinc-500">
          <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer">
            <Home className="w-3.5 h-3.5" />
            LifeOS
          </span>
          <span>/</span>
          <span className="text-stone-500 dark:text-zinc-400">Personal Vault</span>
          <span>/</span>
          <span className="text-stone-900 dark:text-zinc-100 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950" />
            Ledger
          </span>
        </div>

        {/* Quick Utilities: Functional Chart Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="toggle-charts-btn"
            onClick={() => setIsChartsVisible((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all cursor-pointer ${
              isChartsVisible
                ? 'bg-stone-900 text-white border-stone-900 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 border-stone-200/80 dark:border-zinc-800 shadow-2xs'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{isChartsVisible ? 'Hide Charts' : 'Show Charts'}</span>
          </button>
        </div>
      </header>

      {/* Global Error Banner if any */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200/60 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30 p-3.5 text-xs text-rose-700 dark:text-rose-400 font-medium">
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

      {/* Collapsible Analytics Hero Card (Charts & Safe Daily Limit) */}
      <AnimatePresence initial={false}>
        {isChartsVisible && (
          <motion.div
            key="finances-chart-section"
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <AllowanceHeroCard
              analytics={analytics}
              onEditAllowance={handleEditAllowance}
              activeTab={activeTab}
              filteredSpent={filteredSpent}
              filteredRemaining={filteredRemaining}
              filteredLimit={filteredLimit}
              filteredCategoryBreakdown={filteredCategoryBreakdown}
              filteredTransactionsCount={filteredTransactions.length}
              recordedCyclesCount={recordedCyclesCount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Ledger Table or Grid Feed - Rendered unconditionally so it is fully visible by default */}
      {viewMode === 'table' ? (
        <LedgerTable
          transactions={filteredTransactions}
          categories={categories}
          projects={projects}
          onDelete={handleDelete}
          onEdit={(tx) => setEditingTransaction(tx)}
          onOptimisticUpdate={handleOptimisticUpdate}
          currencySymbol={analytics.currencySymbol || '₹'}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onRecordExpense={() => setIsRecordModalOpen(true)}
          analytics={analytics}
          showKpiStrip={isChartsVisible}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-stone-900 dark:text-zinc-100">
              Expense Feed (Card View)
            </h2>
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              className="flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <TableIcon className="w-4 h-4" />
              <span>Switch to Ledger Table</span>
            </button>
          </div>
          <StudentExpenseFeed
            transactions={filteredTransactions}
            activeTab={activeTab}
            currentDate={analytics.currentDate}
            onDelete={handleDelete}
            onEdit={(tx) => setEditingTransaction(tx)}
            currencySymbol={analytics.currencySymbol || '₹'}
          />
        </div>
      )}

      {/* Record Expense Modal */}
      <RecordExpenseModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        categories={categories}
        projects={projects}
        onSuccess={() => {
          showToast('Expense successfully recorded to ledger', 'success');
        }}
        onOptimisticCreate={handleOptimisticCreate}
        currencySymbol={analytics.currencySymbol || '₹'}
      />

      {/* Edit Transaction Modal */}
      <TransactionEditModal
        isOpen={editingTransaction !== null}
        transaction={editingTransaction}
        categories={categories}
        projects={projects}
        onClose={() => setEditingTransaction(null)}
        onOptimisticUpdate={handleOptimisticUpdate}
        onError={handleError}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-stone-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 px-4 py-3 text-xs font-medium text-stone-900 dark:text-zinc-100 shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-2 fade-in duration-200">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
