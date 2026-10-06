'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  X,
  Pencil,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Folder,
  User,
  Check,
  AlertCircle,
  Tag,
  Hash,
} from 'lucide-react';
import { updateTransaction, type TransactionWithRelations } from '@/lib/actions/finances';
import type { Category } from '@/types/database.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import { getTodayDate } from '@/lib/utils/date';

interface TransactionEditModalProps {
  transaction: TransactionWithRelations | null;
  categories: Category[];
  projects: ProjectOption[];
  isOpen: boolean;
  onClose: () => void;
  onOptimisticUpdate?: (updatedTx: TransactionWithRelations) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
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

export function TransactionEditModal({
  transaction,
  categories,
  projects,
  isOpen,
  onClose,
  onOptimisticUpdate,
  onSuccess,
  onError,
}: TransactionEditModalProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('none');
  const [payeeOrSource, setPayeeOrSource] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill form state with existing transaction data
  useEffect(() => {
    if (transaction) {
      setType(transaction.type === 'income' ? 'income' : 'expense');
      setAmount(Math.abs(transaction.amount).toFixed(2));
      setDescription(transaction.description || '');
      setDate(transaction.date || getTodayDate());
      setCategoryId(transaction.category_id || (categories[0]?.id ?? ''));
      setProjectId(transaction.project_id || 'none');
      setPayeeOrSource(transaction.payee_or_source || '');
      setError(null);
    }
  }, [transaction, categories]);

  // Clean focus management: Auto-focus the Amount input instantly upon opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append('type', type);
    formData.append('amount', parsedAmount.toFixed(2));
    formData.append('description', description.trim());
    formData.append('date', date);
    formData.append('categoryId', categoryId || 'none');
    formData.append('projectId', projectId || 'none');
    formData.append('payeeOrSource', payeeOrSource.trim());

    // Compute optimistic transaction object for instant UI update
    const selectedCategory = categories.find((c) => c.id === categoryId) || null;
    const selectedProject = projects.find((p) => p.id === projectId) || null;
    const numericAmount = parseFloat(parsedAmount.toFixed(2));
    const finalSignedAmount = type === 'income' ? numericAmount : -numericAmount;

    const optimisticTx: TransactionWithRelations = {
      ...transaction,
      amount: finalSignedAmount,
      type,
      description: description.trim(),
      date,
      category_id: selectedCategory ? selectedCategory.id : null,
      category: selectedCategory,
      project_id: selectedProject ? selectedProject.id : null,
      project: selectedProject ? { id: selectedProject.id, title: selectedProject.title, slug: selectedProject.slug } : null,
      payee_or_source: payeeOrSource.trim() || null,
    };

    // Instant optimistic update in client state
    onOptimisticUpdate?.(optimisticTx);
    onClose();

    // Asynchronously dispatch server action
    startTransition(async () => {
      const res = await updateTransaction(transaction.id, formData);
      if (!res.success) {
        const errorMsg = res.error || 'Failed to update transaction.';
        onError?.(errorMsg);
      } else {
        onSuccess?.();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-slate-800/90 bg-slate-900/95 dark:bg-zinc-950/95 p-7 shadow-2xl backdrop-blur-xl text-slate-100 space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-transaction-heading"
      >
        {/* Minimalist Notion-Inspired Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Pencil size={15} />
            </div>
            <div>
              <h2 id="edit-transaction-heading" className="text-sm font-semibold tracking-tight text-white">
                Edit Transaction
              </h2>
              <p className="text-[11px] text-slate-400">
                Notion-style frictionless property editor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-slate-400">
              ESC
            </span>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Canvas Section: Type Pills & Prominent Amount */}
          <div className="space-y-4">
            {/* Minimalist Notion Type Toggle Pill */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                  type === 'expense'
                    ? 'border border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-sm'
                    : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ArrowDownRight size={13} className="text-rose-400" />
                <span>Expense</span>
              </button>

              <button
                type="button"
                onClick={() => setType('income')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                  type === 'income'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-sm'
                    : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ArrowUpRight size={13} className="text-emerald-400" />
                <span>Income / Pocket Money</span>
              </button>
            </div>

            {/* Airy Amount Input */}
            <div className="flex items-baseline gap-2 border-b border-slate-800 pb-2 focus-within:border-indigo-500 transition">
              <span className="text-3xl font-light text-slate-400 font-mono">₹</span>
              <input
                ref={amountInputRef}
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-3xl font-bold font-mono text-white placeholder:text-slate-600 outline-none"
              />
            </div>

            {/* Airy Description Title Input */}
            <div className="border-b border-slate-800 pb-2 focus-within:border-indigo-500 transition">
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this transaction for? (e.g. Canteen lunch, Semester books)"
                className="w-full bg-transparent text-sm font-medium text-white placeholder:text-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Notion Properties Grid (Airy & Spacious) */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4 space-y-3.5">
            {/* Property: Date */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400 w-36">
                <Calendar size={14} className="text-slate-500" />
                <span>Date</span>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Property: Category */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400 w-36">
                <Tag size={14} className="text-slate-500" />
                <span>Category</span>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {(CATEGORY_EMOJIS[cat.name] || '🏷️') + ' ' + cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Property: Project */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400 w-36">
                <Folder size={14} className="text-slate-500" />
                <span>Linked Project</span>
              </div>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="none">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.slug} ({p.title})
                  </option>
                ))}
              </select>
            </div>

            {/* Property: Payee or Source */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400 w-36">
                <User size={14} className="text-slate-500" />
                <span>{type === 'income' ? 'Source' : 'Paid To'}</span>
              </div>
              <input
                type="text"
                value={payeeOrSource}
                onChange={(e) => setPayeeOrSource(e.target.value)}
                placeholder={type === 'income' ? 'Mom & Dad, Scholarship' : 'Campus Canteen, Book Store'}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              <Check size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
