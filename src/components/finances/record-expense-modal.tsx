'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { createTransaction, type TransactionWithRelations } from '@/lib/actions/finances';
import type { Category } from '@/types/database.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { getTodayDate } from '@/lib/utils/date';
import { Plus, X, Loader2 } from 'lucide-react';
import { useModalA11y } from '@/hooks/use-modal-a11y';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  projects?: ProjectOption[];
  onSuccess?: () => void;
  onOptimisticCreate?: (newTx: TransactionWithRelations) => void;
  currencySymbol?: string;
}

export function RecordExpenseModal({
  isOpen,
  onClose,
  categories,
  projects = [],
  onSuccess,
  onOptimisticCreate,
  currencySymbol = '₹',
}: RecordExpenseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(isOpen, onClose, modalRef);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState('none');
  const [date, setDate] = useState(getTodayDate());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAmount('');
      setDate(getTodayDate());
      setProjectId('none');
      setError(null);
      if (categories.length > 0) {
        const defaultCat =
          categories.find(
            (c) =>
              c.name.toLowerCase().includes('grocery') ||
              c.name.toLowerCase().includes('juice') ||
              c.name.toLowerCase().includes('food')
          ) || categories[0];
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

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const selectedProject = projects.find((p) => p.id === projectId);

    const optimisticTx: TransactionWithRelations = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}`,
      user_id: '',
      project_id: projectId && projectId !== 'none' ? projectId : null,
      category_id: categoryId || null,
      amount: -Number(numAmount.toFixed(2)),
      type: 'expense',
      description: description.trim(),
      date: date || getTodayDate(),
      payee_or_source: null,
      created_at: new Date().toISOString(),
      category: selectedCategory
        ? { id: selectedCategory.id, name: selectedCategory.name, color: selectedCategory.color }
        : null,
      project: selectedProject
        ? { id: selectedProject.id, title: selectedProject.title, slug: selectedProject.slug }
        : null,
    };

    // Optimistic update: instantly surface the new row in the UI and close modal
    onOptimisticCreate?.(optimisticTx);
    onSuccess?.();
    onClose();

    // Trigger server action in background transition
    startTransition(async () => {
      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('amount', numAmount.toFixed(2));
      formData.append('type', 'expense');
      formData.append('date', date || getTodayDate());
      if (categoryId) {
        formData.append('categoryId', categoryId);
      }
      if (projectId && projectId !== 'none') {
        formData.append('projectId', projectId);
      }

      const res = await createTransaction(null, formData);
      if (!res.success) {
        console.error('Failed to create transaction on server:', res.error);
      }
    });
  };

  return (
    <div
      id="expense-modal"
      data-purpose="expense-modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/20 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        id="modal-card"
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-modal p-6 transform transition-transform duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-700 dark:text-zinc-300">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-100" id="modal-headline">
              Record New Expense
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 p-2.5 text-xs text-rose-700 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        {/* Expense Form */}
        <form id="expense-form" onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="form-desc"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1"
            >
              Description
            </label>
            <input
              id="form-desc"
              ref={inputRef}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cold Coffee, Metro Card Recharge"
              required
              className="w-full px-3 py-2 text-sm border border-stone-200 dark:border-zinc-700 dark:bg-zinc-800/80 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:border-stone-400 text-stone-800 dark:text-zinc-100 transition-all placeholder:text-stone-300 dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="form-amount"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1"
              >
                Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-stone-400 dark:text-zinc-500 font-mono">
                  {currencySymbol}
                </span>
                <input
                  id="form-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="120.00"
                  required
                  className="w-full pl-7 pr-3 py-2 text-sm font-mono border border-stone-200 dark:border-zinc-700 dark:bg-zinc-800/80 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:border-stone-400 text-stone-800 dark:text-zinc-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="form-date"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1"
              >
                Date
              </label>
              <input
                id="form-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-stone-200 dark:border-zinc-700 dark:bg-zinc-800/80 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all text-stone-700 dark:text-zinc-200"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="form-category"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1"
            >
              Category
            </label>
            <select
              id="form-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all text-stone-700 dark:text-zinc-200"
            >
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="junk-food">Junk Food</option>
                  <option value="juice">Juice</option>
                  <option value="vegetable">Vegetable</option>
                  <option value="grocery">Grocery</option>
                  <option value="commute">Commute</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="form-project"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 mb-1"
            >
              Project / Tag (Optional)
            </label>
            {projects && projects.length > 0 ? (
              <select
                id="form-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all text-stone-700 dark:text-zinc-200"
              >
                <option value="none">— No Project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.slug} ({p.title})
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="form-project"
                type="text"
                placeholder="e.g. College Outing, Hackathon"
                className="w-full px-3 py-2 text-sm border border-stone-200 dark:border-zinc-700 dark:bg-zinc-800/80 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all placeholder:text-stone-300 dark:placeholder:text-zinc-500 text-stone-800 dark:text-zinc-100"
              />
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
