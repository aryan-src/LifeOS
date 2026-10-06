'use client';

import React, { useActionState, useEffect, useRef } from 'react';
import { Plus, DollarSign, Calendar, Tag, Folder, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { createTransaction } from '@/lib/actions/finances';
import type { Category } from '@/types/database.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import type { ActionResponse } from '@/types/action.types';

interface TransactionCreateFormProps {
  categories: Category[];
  projects: ProjectOption[];
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

const initialState: ActionResponse = {
  success: false,
};

export function TransactionCreateForm({
  categories,
  projects,
  onSuccess,
  onError,
}: TransactionCreateFormProps) {
  const [state, formAction, isPending] = useActionState(createTransaction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = React.useState<'expense' | 'income'>('expense');

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setType('expense');
      onSuccess?.();
    } else if (state.error && onError) {
      onError(state.error);
    }
  }, [state, onSuccess, onError]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur shadow-xl space-y-4"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
        <h3 className="text-sm font-semibold text-white">Log Financial Transaction</h3>

        {/* Expense vs Income Type Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-0.5">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              type === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle size={13} />
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpCircle size={13} />
            Income
          </button>
        </div>
      </div>

      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300">Description</label>
          <input
            name="description"
            required
            placeholder="e.g. AWS Cloud NAT Gateway"
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-slate-300">Amount (₹)</label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-xs">
              ₹
            </span>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-7 pr-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Date (YYYY-MM-DD) */}
        <div>
          <label className="block text-xs font-medium text-slate-300">Date</label>
          <div className="relative mt-1">
            <input
              suppressHydrationWarning
              name="date"
              type="date"
              defaultValue={todayStr}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 [color-scheme:dark] focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-300">Category</label>
          <select
            name="categoryId"
            defaultValue="none"
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="none">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cross-Linking Foreign Key: Tag to Project */}
        <div>
          <label className="block text-xs font-medium text-slate-300">
            Tag to Project <span className="text-[10px] text-indigo-400">(Feeds Burn)</span>
          </label>
          <select
            name="projectId"
            defaultValue="none"
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="none">No Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.slug}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.error && (
        <p className="text-xs text-rose-400">{state.error}</p>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 transition"
        >
          <Plus size={14} />
          {isPending ? 'Logging...' : 'Record Transaction'}
        </button>
      </div>
    </form>
  );
}
