'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { Plus, Sparkles, Tag, Folder, Calendar, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { createTransaction } from '@/lib/actions/finances';
import type { Category } from '@/types/database.types';
import type { ProjectOption } from '@/lib/actions/projects-options';
import type { ActionResponse } from '@/types/action.types';
import { getTodayDate } from '@/lib/utils/date';

interface QuickExpenseLoggerProps {
  categories: Category[];
  projects: ProjectOption[];
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

const STUDENT_CATEGORY_EMOJIS: Record<string, string> = {
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

const QUICK_DESCRIPTIONS = [
  'Junk Food',
  'Fresh Juice',
  'Bus / Metro Commute',
  'Stationary Supplies',
  'Vegetables & Fruits',
  'Personal Expense',
];

const initialState: ActionResponse = {
  success: false,
};

export function QuickExpenseLogger({
  categories,
  projects,
  onSuccess,
  onError,
}: QuickExpenseLoggerProps) {
  const [state, formAction, isPending] = useActionState(createTransaction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (categories.length > 0) {
      const defaultCat = categories.find((c) => c.name.includes('Food')) || categories[0];
      return defaultCat ? defaultCat.id : '';
    }
    return '';
  });
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setAmount('');
      setDescription('');
      setType('expense');
      onSuccess?.();
    } else if (state.error && onError) {
      onError(state.error);
    }
  }, [state, onSuccess, onError]);

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategoryId(cat.id);
    if (cat.type === 'income') {
      setType('income');
    } else {
      setType('expense');
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleQuickDesc = (desc: string) => {
    setDescription(desc);
  };

  const todayStr = getTodayDate();

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-indigo-500/20 bg-slate-900/90 p-5 backdrop-blur shadow-xl space-y-4 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Type Selector */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sparkles size={15} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">2-Second Quick Logger</h3>
            <p className="text-[11px] text-slate-400">Log daily student pocket expenses or allowance</p>
          </div>
        </div>

        {/* Expense vs Pocket Money Income Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-0.5">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              type === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold'
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
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpCircle size={13} />
            Allowance / Gift
          </button>
        </div>
      </div>

      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="categoryId" value={selectedCategoryId} />

      {/* 1-Tap Category Pills */}
      <div>
        <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
          Select Category
        </label>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const emoji = STUDENT_CATEGORY_EMOJIS[cat.name] || '🏷️';
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition border ${
                  isSelected
                    ? 'border-indigo-500/60 bg-indigo-500/20 text-indigo-200 font-semibold shadow-sm'
                    : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span>{emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount Input with Quick Preset Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-medium text-slate-400">Amount (₹)</label>
          {/* Quick preset amount chips */}
          <div className="flex items-center gap-1">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className="rounded-md border border-slate-800 bg-slate-950 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 hover:border-indigo-500/40 hover:text-indigo-300 transition"
              >
                ₹{val}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-mono text-sm">
            ₹
          </span>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Description with Quick Suggestions */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-medium text-slate-400">What was this for?</label>
          <div className="hidden sm:flex items-center gap-1">
            {QUICK_DESCRIPTIONS.slice(0, 3).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleQuickDesc(item)}
                className="rounded border border-slate-800/80 bg-slate-950/60 px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white transition"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <input
          name="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={type === 'expense' ? 'e.g. Canteen lunch, metro pass, notebook...' : 'e.g. Pocket money from parents, tutoring payment...'}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
        />
      </div>

      {/* Advanced toggle (Date & Project Tag) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[11px] text-slate-400 hover:text-indigo-400 transition flex items-center gap-1"
        >
          <span>{showAdvanced ? '− Hide options' : '+ Date & Project tag (optional)'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/60">
            {/* Date */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Calendar size={12} /> Date
              </label>
              <input
                suppressHydrationWarning
                name="date"
                type="date"
                defaultValue={todayStr}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 [color-scheme:dark] focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Optional Project Tag */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Folder size={12} /> Tag to Project <span className="text-[10px] text-indigo-400">(School/Hobby)</span>
              </label>
              <select
                name="projectId"
                defaultValue="none"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="none">No Project (Personal)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.slug} ({p.title})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {state.error && (
        <p className="text-xs text-rose-400">{state.error}</p>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition disabled:opacity-50 ${
            type === 'expense'
              ? 'bg-rose-600 shadow-rose-500/20 hover:bg-rose-500'
              : 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-500'
          }`}
        >
          <Plus size={14} />
          {isPending
            ? 'Saving...'
            : type === 'expense'
            ? 'Log Student Expense'
            : 'Add Pocket Money / Income'}
        </button>
      </div>
    </form>
  );
}
