'use client';

import React, { useOptimistic, useTransition, useState } from 'react';
import type { TransactionWithRelations } from '@/lib/actions/finances';
import type { Category } from '@/types/database.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { formatCurrency } from '@/lib/utils/format';
import { TransactionEditModal } from './transaction-edit-modal';
import { AlertTriangle } from 'lucide-react';

interface LedgerTableProps {
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
  onTimeframeChange?: (tf: any) => void;
  viewMode?: 'table' | 'cards';
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  onRecordExpense?: () => void;
}

type OptimisticAction =
  | { type: 'delete'; id: string }
  | { type: 'update'; updatedTx: TransactionWithRelations };

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
}: LedgerTableProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [internalEditingTx, setInternalEditingTx] = useState<TransactionWithRelations | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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
        tab === 'today' ? 'daily' : tab === 'this_week' ? 'weekly' : tab === 'monthly' ? 'monthly' : 'all'
      );
    }
  };

  // React 19 native useOptimistic: zero-latency deletion & row updates from the DOM
  const [optimisticTransactions, setOptimisticTransactions] = useOptimistic(
    initialTransactions,
    (state, action: OptimisticAction) => {
      if (action.type === 'delete') {
        return state.filter((tx) => tx.id !== action.id);
      }
      if (action.type === 'update') {
        return state.map((tx) => (tx.id === action.updatedTx.id ? action.updatedTx : tx));
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

  const handleInternalOptimisticUpdate = (updatedTx: TransactionWithRelations) => {
    setOptimisticTransactions({ type: 'update', updatedTx });
    onOptimisticUpdate?.(updatedTx);
  };

  const totalPages = Math.max(1, Math.ceil(optimisticTransactions.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = optimisticTransactions.slice(startIndex, startIndex + itemsPerPage);

  const timeframeTitle =
    currentTab === 'today'
      ? "Today's Activity"
      : currentTab === 'this_week'
      ? "This Week's Activity"
      : currentTab === 'monthly'
      ? "This Month's Spending"
      : 'All Transactions';

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg border border-outline-variant/30">
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-error/30 bg-error-container/30 p-3 text-error text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-error hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Table Section Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-space-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              {timeframeTitle}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-mono">
              {optimisticTransactions.length} records
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-outline">
            Student pocket money outlays, allowance records, and expenses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Timeframe Filter Switcher with Accessible Tab Roles */}
          {(onTabChange || onTimeframeChange) && (
            <div
              role="tablist"
              aria-label="Filter ledger records by timeframe"
              className="flex items-center p-0.5 bg-surface-container-high rounded-lg shadow-xs"
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
                    onClick={() => handleTabClick(tab.id as 'today' | 'this_week' | 'monthly' | 'all')}
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
          )}

          {/* View Mode Toggle: Table vs Cards */}
          {onViewModeChange && (
            <div className="flex items-center p-0.5 bg-surface-container rounded-lg border border-outline-variant/30">
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-outline hover:text-on-surface'
                }`}
                title="Table view"
              >
                <span className="material-symbols-outlined text-[18px]">table_rows</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('cards')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-outline hover:text-on-surface'
                }`}
                title="Grid view"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
            </div>
          )}

          {/* Record Expense Button */}
          {onRecordExpense && (
            <button
              type="button"
              onClick={onRecordExpense}
              className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-on-surface text-surface font-body-sm text-body-sm font-medium hover:opacity-90 active:scale-[0.99] transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Ledger Table */}
      {optimisticTransactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 p-12 text-center bg-surface-container-low/50">
          <p className="text-body-md text-on-surface-variant font-medium">No expenses recorded for this period</p>
          <p className="mt-1 text-label-sm text-outline">
            Click &ldquo;Record Expense&rdquo; above or use Quick Capture (⌘K) to add one.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-space-lg px-space-lg">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-outline-variant/30 text-outline font-label-sm text-label-sm uppercase tracking-wider">
                <tr>
                  <th className="pb-space-sm font-medium">Date</th>
                  <th className="pb-space-sm font-medium">Description</th>
                  <th className="pb-space-sm font-medium">Category</th>
                  <th className="pb-space-sm font-medium">Project</th>
                  <th className="pb-space-sm font-medium text-right">Amount</th>
                  <th className="pb-space-sm font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm">
                {paginatedTransactions.map((tx) => {
                  const isIncome = tx.type === 'income' || tx.amount > 0;
                  const absAmount = Math.abs(tx.amount);
                  const catColor = tx.category?.color || (isIncome ? '#3c6847' : '#cb6654');

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-space-sm font-mono text-outline font-label-sm text-label-sm whitespace-nowrap">
                        {tx.date}
                      </td>

                      {/* Description */}
                      <td className="py-space-sm font-medium text-on-surface">
                        <div className="flex flex-col">
                          <span>{tx.description}</span>
                          {tx.payee_or_source && (
                            <span className="text-[11px] text-outline font-normal">
                              {tx.payee_or_source}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-space-sm whitespace-nowrap">
                        {tx.category ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-medium ${
                              isIncome
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-surface-container-high text-on-tertiary-container'
                            }`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: catColor }}
                            />
                            <span>{tx.category.name}</span>
                          </span>
                        ) : (
                          <span className="text-outline font-label-sm text-label-sm">—</span>
                        )}
                      </td>

                      {/* Project */}
                      <td className="py-space-sm text-outline whitespace-nowrap">
                        {tx.project ? (
                          <span className="font-mono text-[12px] text-on-surface-variant">
                            #{tx.project.slug}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Signed Amount */}
                      <td
                        className={`py-space-sm text-right font-mono font-semibold whitespace-nowrap ${
                          isIncome ? 'text-secondary' : 'text-on-tertiary-container'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {currencySymbol}
                        {formatCurrency(absAmount)}
                      </td>

                      {/* Actions: Edit & Delete buttons */}
                      <td className="py-space-sm text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleEditClick(tx)}
                            className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors cursor-pointer"
                            title="Edit transaction"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(tx.id)}
                            className="p-1 rounded hover:bg-surface-container text-outline hover:text-error transition-colors cursor-pointer"
                            title="Delete entry"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="flex items-center justify-between pt-space-xs border-t border-outline-variant/30 text-outline font-label-sm text-label-sm">
            <span className="font-mono">
              Showing {Math.min(startIndex + 1, optimisticTransactions.length)}–
              {Math.min(startIndex + itemsPerPage, optimisticTransactions.length)} of{' '}
              {optimisticTransactions.length} entries
            </span>
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="hover:text-on-surface disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-medium">
                {currentPage}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="hover:text-on-surface disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Internal Modal if mounted standalone */}
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
