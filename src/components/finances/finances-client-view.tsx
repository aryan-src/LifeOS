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

export function FinancesClientView({
  initialTransactions,
  analytics,
  categories,
  projects,
}: FinancesClientViewProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState<
    'all' | 'daily' | 'weekly' | 'monthly'
  >('monthly');
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

  const handleTimeframeChange = (
    timeframe: 'all' | 'daily' | 'weekly' | 'monthly'
  ) => {
    startTransition(() => {
      setActiveTimeframe(timeframe);
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

  // Filter transactions according to selected timeframe
  const filteredTransactions = useMemo(() => {
    if (activeTimeframe === 'all') return transactions;
    const today = analytics.currentDate;
    if (activeTimeframe === 'daily') {
      const dailyList = transactions.filter((t) => t.date === today);
      return dailyList.length > 0 ? dailyList : transactions;
    }
    if (activeTimeframe === 'weekly') {
      const trailing7 = new Set(analytics.weeklyDays.map((d) => d.date));
      const weeklyList = transactions.filter((t) => trailing7.has(t.date));
      return weeklyList.length > 0 ? weeklyList : transactions;
    }
    if (activeTimeframe === 'monthly') {
      const currentYearMonth = today ? today.substring(0, 7) : '2026-10';
      const monthlyList = transactions.filter((t) =>
        t.date.startsWith(currentYearMonth)
      );
      return monthlyList.length > 0 ? monthlyList : transactions;
    }
    return transactions;
  }, [transactions, activeTimeframe, analytics.currentDate, analytics.weeklyDays]);

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
          <div className="flex items-center p-0.5 bg-surface-container-high rounded-lg shadow-sm">
            <button
              type="button"
              onClick={() => handleTimeframeChange('daily')}
              className={`px-space-sm py-1 rounded font-label-md text-label-md transition-colors cursor-pointer ${
                activeTimeframe === 'daily'
                  ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleTimeframeChange('weekly')}
              className={`px-space-sm py-1 rounded font-label-md text-label-md transition-colors cursor-pointer ${
                activeTimeframe === 'weekly'
                  ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => handleTimeframeChange('monthly')}
              className={`px-space-sm py-1 rounded font-label-md text-label-md transition-colors cursor-pointer ${
                activeTimeframe === 'monthly'
                  ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => handleTimeframeChange('all')}
              className={`px-space-sm py-1 rounded font-label-md text-label-md transition-colors cursor-pointer ${
                activeTimeframe === 'all'
                  ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Feed
            </button>
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
          activeTimeframe={activeTimeframe}
          onTimeframeChange={handleTimeframeChange}
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
            activeTimeframe={activeTimeframe}
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
