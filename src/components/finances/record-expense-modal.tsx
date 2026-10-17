'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { createTransaction } from '@/lib/actions/finances';
import type { Category } from '@/types/database.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { getTodayDate } from '@/lib/utils/date';
import { Loader2 } from 'lucide-react';
import { useModalA11y } from '@/hooks/use-modal-a11y';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  projects?: ProjectOption[];
  onSuccess?: () => void;
  currencySymbol?: string;
}

export function RecordExpenseModal({
  isOpen,
  onClose,
  categories,
  projects = [],
  onSuccess,
  currencySymbol = '₹',
}: RecordExpenseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen, onClose, modalRef);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState('none');
  const [date, setDate] = useState(getTodayDate());
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAmount('');
      setDate(getTodayDate());
      setType('expense');
      setError(null);
      if (categories.length > 0) {
        const defaultCat = categories.find((c) => c.name.toLowerCase().includes('grocery') || c.name.toLowerCase().includes('juice') || c.name.toLowerCase().includes('food')) || categories[0];
        setCategoryId(defaultCat?.id || '');
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Item description is required.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('amount', numAmount.toString());
      formData.append('type', type);
      formData.append('date', date || getTodayDate());
      if (categoryId) {
        formData.append('categoryId', categoryId);
      }
      if (projectId && projectId !== 'none') {
        formData.append('projectId', projectId);
      }

      const res = await createTransaction(null, formData);
      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(res.error || 'Failed to record expense.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/20 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className="bg-surface-container-lowest dark:bg-zinc-900 text-on-surface dark:text-zinc-100 p-space-lg rounded-xl shadow-xl max-w-md w-full border border-outline-variant/30 dark:border-zinc-800 relative flex flex-col gap-space-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-expense-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 id="record-expense-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface dark:text-zinc-100">
            Record Micro-Expense
          </h3>
          <button
            onClick={onClose}
            className="text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100 transition-colors p-1 rounded hover:bg-surface-container dark:hover:bg-zinc-800"
            type="button"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-error-container/40 dark:bg-rose-950/40 border border-error/30 dark:border-rose-800/50 p-2.5 text-xs text-error dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
          {/* Item Description */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-outline dark:text-zinc-400">Item Description</label>
            <input
              ref={inputRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-surface-container-low dark:bg-zinc-800/80 px-space-sm py-1.5 rounded font-body-sm text-body-sm text-on-surface dark:text-zinc-100 focus:outline-none focus:bg-surface-container-lowest dark:focus:bg-zinc-800 transition-colors border border-outline-variant/30 dark:border-zinc-700/80 focus:border-outline"
              placeholder="e.g. Printing assignment, Chai"
              required
              type="text"
            />
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-outline dark:text-zinc-400">Amount ({currencySymbol})</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-surface-container-low dark:bg-zinc-800/80 px-space-sm py-1.5 rounded font-body-sm text-body-sm text-on-surface dark:text-zinc-100 focus:outline-none focus:bg-surface-container-lowest dark:focus:bg-zinc-800 transition-colors border border-outline-variant/30 dark:border-zinc-700/80 focus:border-outline font-mono"
                placeholder="0.00"
                required
                step="any"
                type="number"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-outline dark:text-zinc-400">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="bg-surface-container-low dark:bg-zinc-800/80 px-space-sm py-1.5 rounded font-body-sm text-body-sm text-on-surface dark:text-zinc-100 focus:outline-none focus:bg-surface-container-lowest dark:focus:bg-zinc-800 transition-colors border border-outline-variant/30 dark:border-zinc-700/80 focus:border-outline"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type & Project Row */}
          <div className="grid grid-cols-2 gap-space-sm pt-1">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-outline dark:text-zinc-400">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'expense' | 'income')}
                className="bg-surface-container-low dark:bg-zinc-800/80 px-space-sm py-1.5 rounded font-body-sm text-body-sm text-on-surface dark:text-zinc-100 focus:outline-none focus:bg-surface-container-lowest dark:focus:bg-zinc-800 transition-colors border border-outline-variant/30 dark:border-zinc-700/80 focus:border-outline"
              >
                <option value="expense">Expense (-)</option>
                <option value="income">Allowance / Pocket Money (+)</option>
              </select>
            </div>
            {projects.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-outline dark:text-zinc-400">Link Project (Optional)</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="bg-surface-container-low dark:bg-zinc-800/80 px-space-sm py-1.5 rounded font-body-sm text-body-sm text-on-surface dark:text-zinc-100 focus:outline-none focus:bg-surface-container-lowest dark:focus:bg-zinc-800 transition-colors border border-outline-variant/30 dark:border-zinc-700/80 focus:border-outline"
                >
                  <option value="none">None</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.slug}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-space-sm pt-space-sm">
            <button
              onClick={onClose}
              type="button"
              className="px-space-md py-1.5 rounded font-body-sm text-body-sm text-on-surface-variant dark:text-zinc-400 hover:bg-surface-container dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1 px-space-md py-1.5 rounded bg-on-surface text-surface dark:bg-zinc-100 dark:text-zinc-900 font-body-sm text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isPending && <Loader2 size={14} className="animate-spin text-current" />}
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
