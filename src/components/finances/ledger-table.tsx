'use client';

import React, { useOptimistic, useTransition, useState } from 'react';
import { Tag, Folder, Trash2, AlertTriangle, Pencil, MoreHorizontal } from 'lucide-react';
import type { TransactionWithRelations } from '@/lib/actions/finances';
import type { Category } from '@/types/database.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { formatCurrency } from '@/lib/utils/format';
import { TransactionEditModal } from './transaction-edit-modal';

interface LedgerTableProps {
  transactions: TransactionWithRelations[];
  categories?: Category[];
  projects?: ProjectOption[];
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onEdit?: (tx: TransactionWithRelations) => void;
  onOptimisticUpdate?: (updatedTx: TransactionWithRelations) => void;
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
}: LedgerTableProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [internalEditingTx, setInternalEditingTx] = useState<TransactionWithRelations | null>(null);
  const [, startTransition] = useTransition();

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

  if (optimisticTransactions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-800/80 p-12 text-center bg-slate-950/20">
        <p className="text-sm font-medium text-slate-400">No transactions recorded yet.</p>
        <p className="mt-1 text-xs text-slate-600">
          Add an entry above or use Quick Capture (e.g. &quot;₹50 canteen lunch #midterms&quot;).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead className="border-b border-surface-container-high bg-surface-container-low text-outline font-label-sm text-label-sm select-none">
              <tr>
                <th className="py-2.5 px-4 font-medium uppercase tracking-wider">Date</th>
                <th className="py-2.5 px-4 font-medium uppercase tracking-wider">Description</th>
                <th className="py-2.5 px-4 font-medium uppercase tracking-wider">Category</th>
                <th className="py-2.5 px-4 font-medium uppercase tracking-wider">Project</th>
                <th className="py-2.5 px-4 font-medium uppercase tracking-wider text-right">Amount</th>
                <th className="py-2.5 px-4 font-medium uppercase tracking-wider text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60 text-on-surface">
              {optimisticTransactions.map((tx) => {
                const isIncome = tx.type === 'income' || tx.amount > 0;
                const absAmount = Math.abs(tx.amount);

                return (
                  <tr
                    key={tx.id}
                    className="group hover:bg-surface-container-low/80 transition-colors"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 font-label-sm text-label-sm text-outline whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Description & Payee */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-on-surface">{tx.description}</span>
                        {tx.payee_or_source && (
                          <span className="font-label-sm text-label-sm text-outline">
                            {tx.payee_or_source}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category Pill */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.category ? (
                        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant font-medium">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: tx.category.color || '#64748b' }}
                          />
                          <span>{tx.category.name}</span>
                        </span>
                      ) : (
                        <span className="text-outline font-label-sm text-label-sm">Uncategorized</span>
                      )}
                    </td>

                    {/* Project Tag */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.project ? (
                        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-label-sm text-label-sm bg-surface-container text-on-surface">
                          <Folder size={11} className="text-outline" />
                          #{tx.project.slug}
                        </span>
                      ) : (
                        <span className="text-outline-variant font-label-sm text-label-sm">—</span>
                      )}
                    </td>

                    {/* Signed Amount */}
                    <td className="py-3 px-4 text-right font-label-md text-label-md font-semibold whitespace-nowrap">
                      <span
                        suppressHydrationWarning
                        className={
                          isIncome ? 'text-secondary' : 'text-on-tertiary-container'
                        }
                      >
                        {isIncome ? '+' : '-'}₹{formatCurrency(absAmount)}
                      </span>
                    </td>

                    {/* Minimalist Action Trigger: Subtle Pencil & Delete on Hover */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={() => handleEditClick(tx)}
                          className="rounded p-1 text-outline hover:bg-surface-container hover:text-on-surface transition"
                          title="Edit transaction"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(tx.id)}
                          className="rounded p-1 text-outline hover:bg-surface-container hover:text-error transition"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Internal Modal if mounted standalone without external controller */}
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
