'use client';

import React, { useState, useTransition, useMemo } from 'react';
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
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FinancesClientViewProps {
  initialTransactions: TransactionWithRelations[];
  analytics: FinancialAnalytics;
  categories: Category[];
  projects: ProjectOption[];
}

import { getTodayDate } from '@/lib/utils/date';

export type TimeFilterTab = 'today' | 'this_week' | 'monthly' | 'all';

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
    // Look for the most recent pocket money / allowance / income transaction
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

  // Recalculate spending metrics according to active filtered timeframe
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
    <div className="flex flex-col gap-space-xl w-full">
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-error/30 bg-error-container/30 p-4 text-error">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-error hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          TOP CONTEXT & HEADER WITH ACTION TOOLBAR
         ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg">
        <div className="flex flex-col gap-space-xs max-w-xl">
          <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm uppercase tracking-wider">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary" />
            <span>Semester Autumn 2026</span>
            <span>·</span>
            <span>Ledger Active</span>
          </div>
          <h1 className="font-display text-display text-on-surface font-semibold tracking-tight">
            Student Finances
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Pocket money, daily safe limits, and mindful student expense tracker.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <div
            role="tablist"
            aria-label="Filter finances by timeframe"
            className="flex items-center p-0.5 bg-surface-container-high rounded-lg shadow-xs"
          >
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'all', label: 'All Feed' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`header-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls="finances-ledger-table"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleTabChange(tab.id as TimeFilterTab)}
                  className={`px-space-sm py-1 rounded font-label-md text-label-md transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'text-on-surface bg-surface-container-lowest shadow-xs font-medium dark:bg-stone-800 dark:text-stone-100'
                      : 'text-on-surface-variant hover:text-on-surface font-normal hover:bg-surface-container/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            id="record-expense-btn"
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-on-surface text-surface font-body-sm text-body-sm font-medium hover:opacity-90 active:scale-[0.99] transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1 & SECTION 2: Hero Financial Card, Key Metrics & Analytical Charts
         ========================================================================= */}
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

      {/* =========================================================================
          SECTION 3: Monthly Spending Ledger Table or Cards Feed
         ========================================================================= */}
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
        />
      ) : (
        <div className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Expense Feed (Card View)
            </h2>
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              className="flex items-center gap-1 text-label-md text-secondary hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                table_rows
              </span>
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

      {/* =========================================================================
          INTERACTIVE MODALS
         ========================================================================= */}
      {/* Quick Record Micro-Expense Dialog */}
      <RecordExpenseModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        categories={categories}
        projects={projects}
        onSuccess={() => {
          showToast('Expense successfully recorded to ledger', 'success');
        }}
        currencySymbol={analytics.currencySymbol || '₹'}
      />

      {/* Edit Transaction / Allowance Modal */}
      <TransactionEditModal
        isOpen={editingTransaction !== null}
        transaction={editingTransaction}
        categories={categories}
        projects={projects}
        onClose={() => setEditingTransaction(null)}
        onOptimisticUpdate={handleOptimisticUpdate}
        onError={handleError}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-xs font-medium text-on-surface shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-2 fade-in duration-200">
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-secondary shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-error shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
