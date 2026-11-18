'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExpensesSummaryRow } from './expenses-summary-row';
import { ExpensesPaceChart } from './expenses-pace-chart';
import { WhereDidMoneyGoCard } from './where-did-money-go-card';
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
  computeExpensesSummary,
  formatMonthHeading,
  getSemanticCategoryColor,
} from '@/lib/finances/derived';
import { Pill } from '@/components/ui/pill';
import {
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  Table as TableIcon,
  Plus,
  Calendar,
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

  const format = (dt: Date) => {
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(dt.getDate()).padStart(2, '0');
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
    } else {
      showToast('Transaction removed from ledger', 'success');
    }
    return res;
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

  const monthlyBaseline =
    analytics.monthlyAllowance > 0 ? analytics.monthlyAllowance : 5000;

  const todayStr = analytics.currentDate || getTodayDate();
  const [currentYearStr, currentMonthStr] = todayStr.split('-');
  const totalDaysInMonth = useMemo(() => {
    const y = parseInt(currentYearStr || '2026', 10);
    const m = parseInt(currentMonthStr || '11', 10);
    return new Date(y, m, 0).getDate() || 30;
  }, [currentYearStr, currentMonthStr]);

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

  const filteredCategoryBreakdown = useMemo(() => {
    const catMap: Record<string, { value: number; count: number; color?: string }> = {};
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') continue;
      const catName = tx.category?.name || 'Personal & Misc';
      const catColor = tx.category?.color ?? undefined;
      if (!catMap[catName]) {
        catMap[catName] = { value: 0, count: 0, color: catColor };
      }
      catMap[catName].value += Math.abs(Number(tx.amount || 0));
      catMap[catName].count += 1;
    }
    const totalSpent = Object.values(catMap).reduce((sum, c) => sum + c.value, 0);
    return Object.entries(catMap)
      .map(([name, data], idx) => ({
        name,
        value: Number(data.value.toFixed(2)),
        count: data.count,
        color:
          data.color &&
          data.color.toLowerCase() !== '#f59e0b' &&
          data.color.toLowerCase() !== '#0f4c42'
            ? data.color
            : getSemanticCategoryColor(idx),
        percentage: totalSpent > 0 ? Math.round((data.value / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const derivedSummary = useMemo(
    () =>
      computeExpensesSummary({
        totalSpent: filteredSpent,
        monthlyLimit: filteredLimit,
        currentDate: todayStr,
        daysLeftOverride: activeTab === 'monthly' ? analytics.daysLeftInMonth : undefined,
        weeklyDays: analytics.weeklyDays || [],
      }),
    [filteredSpent, filteredLimit, todayStr, activeTab, analytics.daysLeftInMonth, analytics.weeklyDays]
  );

  const currencySymbol = analytics.currencySymbol || '₹';
  const monthHeading = formatMonthHeading(todayStr);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 pb-8">
      {/* Stitch Expenses Header */}
      <header
        className="flex flex-col justify-between gap-4 border-b border-outline-variant/40 pb-5 sm:flex-row sm:items-end"
        data-purpose="workspace-header"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Pill tone="neutral" dot={true}>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-secondary" aria-hidden="true" />
                {monthHeading}
              </span>
            </Pill>
          </div>
          <h1 className="font-serif text-page-title font-normal tracking-tight text-on-surface">
            Expenses
          </h1>
          <p className="font-sans text-body-sm text-on-surface-variant">
            Allowance-aware ledger, daily safe pace, and category distribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="toggle-charts-btn"
            onClick={() => setIsChartsVisible((prev) => !prev)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 font-sans text-body-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
              isChartsVisible
                ? 'border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                : 'border-primary bg-primary text-on-primary'
            }`}
          >
            <BarChart2 className="h-4 w-4" aria-hidden="true" />
            <span>{isChartsVisible ? 'Hide Charts' : 'Show Charts'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-secondary px-4 font-sans text-body-sm font-medium text-on-secondary shadow-xs transition-opacity hover:opacity-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add expense</span>
          </button>
        </div>
      </header>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-error/30 bg-error-container p-3.5 font-sans text-body-sm font-medium text-on-error-container">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="font-mono text-label-sm hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Collapsible Stitch Telemetry & Charts */}
      <AnimatePresence initial={false}>
        {isChartsVisible && (
          <motion.div
            key="finances-chart-section"
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-4"
          >
            <ExpensesSummaryRow
              summary={derivedSummary}
              currencySymbol={currencySymbol}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-7">
                <ExpensesPaceChart
                  weeklyDays={analytics.weeklyDays || []}
                  safeDailyPace={derivedSummary.safeDailyPace}
                  paceStatusText={derivedSummary.paceStatusText}
                  currencySymbol={currencySymbol}
                />
              </div>
              <div className="lg:col-span-5">
                <WhereDidMoneyGoCard
                  currencySymbol={currencySymbol}
                  totalSpent={filteredSpent}
                  categoryBreakdown={filteredCategoryBreakdown}
                  subtitle={`${monthHeading} categorical outflow`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ledger Table or Card Feed */}
      {viewMode === 'table' ? (
        <LedgerTable
          transactions={filteredTransactions}
          categories={categories}
          projects={projects}
          onDelete={handleDelete}
          onEdit={(tx) => setEditingTransaction(tx)}
          onOptimisticUpdate={handleOptimisticUpdate}
          currencySymbol={currencySymbol}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onRecordExpense={() => setIsRecordModalOpen(true)}
          analytics={analytics}
          showKpiStrip={false}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-headline-md font-semibold text-on-surface">
              Expense Feed
            </h2>
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              className="flex items-center gap-1.5 font-mono text-label-sm text-on-surface-variant transition-colors hover:text-on-surface cursor-pointer"
            >
              <TableIcon className="h-4 w-4" aria-hidden="true" />
              <span>Switch to Ledger Table</span>
            </button>
          </div>
          <StudentExpenseFeed
            transactions={filteredTransactions}
            activeTab={activeTab}
            currentDate={analytics.currentDate}
            onDelete={handleDelete}
            onEdit={(tx) => setEditingTransaction(tx)}
            currencySymbol={currencySymbol}
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
          showToast('Expense recorded to ledger', 'success');
        }}
        onOptimisticCreate={handleOptimisticCreate}
        currencySymbol={currencySymbol}
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

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest/95 px-4 py-3 font-sans text-body-sm font-medium text-on-surface shadow-ambient backdrop-blur-xl"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
