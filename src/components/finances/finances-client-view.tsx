'use client';

import React, { useState } from 'react';
import { AllowanceHeroCard } from './allowance-hero-card';
import { QuickExpenseLogger } from './quick-expense-logger';
import { StudentExpenseFeed } from './student-expense-feed';
import { LedgerTable } from './ledger-table';
import { TransactionEditModal } from './transaction-edit-modal';
import { deleteTransaction, type TransactionWithRelations, type FinancialAnalytics } from '@/lib/actions/finances';
import type { Category } from '@/types/database.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { AlertTriangle, Sparkles, X, LayoutGrid, TableProperties, CheckCircle2 } from 'lucide-react';

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
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('monthly');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDelete = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const res = await deleteTransaction(id);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to delete transaction.');
      setTransactions(initialTransactions);
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
      // If no allowance logged yet, open the quick logger to add one
      setIsLoggerOpen(true);
    }
  };

  const handleOptimisticUpdate = (updatedTx: TransactionWithRelations) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
    showToast('Transaction updated successfully', 'success');
  };

  const handleError = (errorMsg: string) => {
    setTransactions(initialTransactions); // State rollback
    showToast(errorMsg, 'error');
  };

  return (
    <div className="space-y-8">
      {errorMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Pocket Money Card & Timeframe Switcher */}
      <AllowanceHeroCard
        analytics={analytics}
        activeTimeframe={activeTimeframe}
        onTimeframeChange={setActiveTimeframe}
        onEditAllowance={handleEditAllowance}
      />

      {/* Quick Logging Section & Activity Feed / Ledger */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
              {activeTimeframe === 'daily'
                ? "Today's Activity"
                : activeTimeframe === 'weekly'
                ? "This Week's Activity"
                : activeTimeframe === 'monthly'
                ? "This Month's Spending"
                : 'All Transactions'}
            </h3>
            <p className="font-label-sm text-label-sm text-outline">
              {activeTimeframe === 'daily'
                ? 'Check today’s expenses against your safe daily target'
                : 'Student pocket money outlays, allowance records, and expenses'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm self-start sm:self-auto">
            {/* Timeframe Filter Pills */}
            <div className="flex items-center p-0.5 bg-surface-container-high rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTimeframe('daily')}
                className={`px-space-sm py-1 rounded font-label-md text-label-md transition-colors ${
                  activeTimeframe === 'daily'
                    ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setActiveTimeframe('weekly')}
                className={`px-space-sm py-1 rounded font-label-md text-label-md transition-colors ${
                  activeTimeframe === 'weekly'
                    ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setActiveTimeframe('monthly')}
                className={`px-space-sm py-1 rounded font-label-md text-label-md transition-colors ${
                  activeTimeframe === 'monthly'
                    ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setActiveTimeframe('all')}
                className={`px-space-sm py-1 rounded font-label-md text-label-md transition-colors ${
                  activeTimeframe === 'all'
                    ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All Feed
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-surface-container-high rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Ledger Table"
              >
                <TableProperties size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'cards'
                    ? 'text-on-surface bg-surface-container-lowest shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Cards Feed"
              >
                <LayoutGrid size={15} />
              </button>
            </div>

            <button
              onClick={() => setIsLoggerOpen(!isLoggerOpen)}
              className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-on-surface text-surface font-body-sm text-body-sm font-medium hover:opacity-90 active:scale-[0.99] transition-all shadow-sm"
            >
              {isLoggerOpen ? (
                <>
                  <X size={15} />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Record Expense</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-Second Quick Logger Card */}
        {isLoggerOpen && (
          <QuickExpenseLogger
            categories={categories}
            projects={projects}
            onSuccess={() => setIsLoggerOpen(false)}
            onError={(err) => setErrorMessage(err)}
          />
        )}

        {/* View Selection: Ledger Table or Cards Feed */}
        {viewMode === 'table' ? (
          <LedgerTable
            transactions={transactions}
            categories={categories}
            projects={projects}
            onDelete={handleDelete}
            onEdit={(tx) => setEditingTransaction(tx)}
            onOptimisticUpdate={handleOptimisticUpdate}
            currencySymbol={analytics.currencySymbol || '₹'}
          />
        ) : (
          <StudentExpenseFeed
            transactions={transactions}
            activeTimeframe={activeTimeframe}
            currentDate={analytics.currentDate}
            onDelete={handleDelete}
            onEdit={(tx) => setEditingTransaction(tx)}
            currencySymbol={analytics.currencySymbol || '₹'}
          />
        )}
      </div>

      {/* Notion-Inspired Edit Transaction / Allowance Modal */}
      <TransactionEditModal
        isOpen={editingTransaction !== null}
        transaction={editingTransaction}
        categories={categories}
        projects={projects}
        onClose={() => setEditingTransaction(null)}
        onOptimisticUpdate={handleOptimisticUpdate}
        onError={handleError}
      />

      {/* Subtle Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-slate-700/80 bg-slate-900/95 px-4 py-3 text-xs font-medium text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 fade-in duration-200">
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
