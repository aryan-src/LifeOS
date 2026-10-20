'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/actions/profile';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { Category, InsertTransaction, TransactionType } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import { getTodayDate, getTrailingDays } from '@/lib/utils/date';
import { computeFinancialAnalytics } from '@/lib/finances/compute';
import {
  createTransactionSchema,
  updateTransactionSchema,
  deleteTransactionSchema,
  formatZodError,
} from '@/lib/validations';

export interface TransactionWithRelations {
  id: string;
  user_id: string;
  project_id: string | null;
  category_id: string | null;
  amount: number; // Strictly cast from PostgreSQL string to JavaScript number
  type: TransactionType;
  description: string;
  date: string;
  payee_or_source: string | null;
  created_at: string;
  category?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  project?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export interface WeeklyDayData {
  dayLabel: string;
  date: string;
  spent: number;
  isToday: boolean;
}

export interface CategoryBreakdownItem {
  name: string;
  value: number;
  color: string;
  count: number;
  percentage: number;
}

export interface FinancialAnalytics {
  currentDate: string;
  currencySymbol: string;

  // Student Pocket Money & Allowance Focus
  monthlyAllowance: number;
  monthlySpent: number;
  remainingAllowance: number;
  allowanceUsagePercent: number;

  // Daily & Limit Tracking
  todaySpent: number;
  safeDailyBudget: number;
  daysLeftInMonth: number;

  // Weekly Tracking (Trailing 7 days)
  weekSpent: number;
  weeklyDays: WeeklyDayData[];

  // Category & Project Breakdown
  categoryBreakdown: CategoryBreakdownItem[];
  projectSpendTotal: number;

  // Cash Flow & Compatibility
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  cashflowComparison: { name: string; amount: number; fill: string }[];
}

const STUDENT_CATEGORIES: { name: string; type: 'income' | 'expense'; color: string }[] = [
  { name: 'Pocket Money', type: 'income', color: '#10b981' },
  { name: 'Allowance', type: 'income', color: '#10b981' },
  { name: 'Food & Canteen', type: 'expense', color: '#f97316' },
  { name: 'Transport', type: 'expense', color: '#3b82f6' },
  { name: 'Subscriptions', type: 'expense', color: '#ec4899' },
  { name: 'Books & Supplies', type: 'expense', color: '#8b5cf6' },
  { name: 'Grocery', type: 'expense', color: '#16a34a' },
  { name: 'Stationary', type: 'expense', color: '#8b5cf6' },
  { name: 'Junk Food', type: 'expense', color: '#f97316' },
  { name: 'Vegetable', type: 'expense', color: '#22c55e' },
  { name: 'Fruits', type: 'expense', color: '#ef4444' },
  { name: 'Juice', type: 'expense', color: '#eab308' },
  { name: 'Commute', type: 'expense', color: '#3b82f6' },
  { name: 'Subscription', type: 'expense', color: '#ec4899' },
  { name: 'Personal & Misc', type: 'expense', color: '#64748b' },
];

const OBSOLETE_CATEGORIES = [
  'Entertainment & Hanging Out',
  'Gifts & Side Hustles',
  'Pocket Money / Allowance',
  'Transport & Commute',
];

import { getFallbackFinancialAnalytics } from '@/lib/finances/defaults';

/**
 * Fetch financial categories and auto-seed/sync the student categories if missing.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    let { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    const existingNames = new Set((data || []).map((c) => c.name));
    const hasObsolete = (data || []).some((c) => OBSOLETE_CATEGORIES.includes(c.name));
    const missingCategories = STUDENT_CATEGORIES.filter((c) => !existingNames.has(c.name));

    if (hasObsolete || missingCategories.length > 0) {
      // Clean up obsolete categories
      if (hasObsolete) {
        await supabase
          .from('categories')
          .delete()
          .eq('user_id', user.id)
          .in('name', OBSOLETE_CATEGORIES);
      }

      // Insert missing student categories
      if (missingCategories.length > 0) {
        await supabase
          .from('categories')
          .insert(
            missingCategories.map((c) => ({
              user_id: user.id,
              name: c.name,
              type: c.type,
              color: c.color,
            }))
          );
      }

      // Re-query the updated clean category set
      const refreshed = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (refreshed.data) {
        data = refreshed.data;
      }
    }

    // Parse monthly_budget to number if present
    return (data || []).map((c) => ({
      ...c,
      monthly_budget: c.monthly_budget !== null ? Number(c.monthly_budget) : null,
    }));
  } catch (err) {
    console.error('Unhandled error in getCategories:', err);
    return [];
  }
}

/**
 * Fetch ledger transactions with related category & project details.
 * CRITICAL: Bounded to LIMIT 100 to prevent DOM choking and table paint destruction.
 * Strictly casts PostgreSQL numeric amount strings into JavaScript numbers.
 */
export async function getTransactions(): Promise<TransactionWithRelations[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(id, name, color),
        project:projects(id, title, slug)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      if (error) console.error('Error fetching transactions:', error);
      return [];
    }

    return (data as unknown as TransactionWithRelations[]).map((t) => ({
      ...t,
      amount: typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount)) || 0,
    }));
  } catch (err) {
    console.error('Unhandled error in getTransactions:', err);
    return [];
  }
}



/**
 * Edge-cached financial analytics aggregator.
 * Caches calculated KPIs on Vercel's edge network with revalidate: 60s per user tenant.
 */
const getCachedFinancialAnalytics = (userId: string, accessToken: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  return unstable_cache(
    async () => {
      const client = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        auth: { persistSession: false },
      });

      const [{ data: transactions }, { data: profile }] = await Promise.all([
        client
          .from('transactions')
          .select(`
            *,
            category:categories(id, name, color),
            project:projects(id, title, slug)
          `)
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(100),
        client
          .from('profiles')
          .select('monthly_allowance_target, currency_symbol')
          .eq('id', userId)
          .maybeSingle(),
      ]);

      const formattedTxs = ((transactions || []) as unknown as TransactionWithRelations[]).map((t) => ({
        ...t,
        amount: typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount)) || 0,
      }));

      return computeFinancialAnalytics(
        formattedTxs,
        Number(profile?.monthly_allowance_target || 0),
        profile?.currency_symbol || '₹'
      );
    },
    ['user-financial-kpis', userId],
    {
      revalidate: 60,
      tags: [`user-${userId}-finances`, 'finances-kpi'],
    }
  )();
};

/**
 * Compute aggregate financial analytics and chart series.
 * Optimized for Student Pocket Money tracking: Daily, Weekly, and Monthly breakdowns.
 * Uses React request cache and Edge Data Cache (revalidate: 60) for instant dashboard paints.
 */
export const getFinancialAnalytics = cache(async (): Promise<FinancialAnalytics> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return getFallbackFinancialAnalytics();

    // Check for session access token to run through edge-cached compute
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (accessToken && process.env.NEXT_RUNTIME && !process.env.VITEST) {
      try {
        const cached = await getCachedFinancialAnalytics(user.id, accessToken);
        if (cached) return cached;
      } catch (cacheErr) {
        // Fall back to direct query if cache retrieval errors
      }
    }

    const [transactions, profile] = await Promise.all([
      getTransactions(),
      getUserProfile(),
    ]);

    return computeFinancialAnalytics(
      transactions,
      Number(profile?.monthly_allowance_target || 0),
      profile?.currency_symbol || '₹'
    );
  } catch (error) {
    console.error('Unhandled error in getFinancialAnalytics, returning safe fallback:', error);
    return getFallbackFinancialAnalytics();
  }
});

/**
 * Create a new transaction with cross-linking foreign key support for projects and categories.
 */
export async function createTransaction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResponse> {
  const parsed = createTransactionSchema.safeParse({
    description: formData.get('description'),
    amount: formData.get('amount'),
    type: formData.get('type') || 'expense',
    date: formData.get('date') || null,
    categoryId: formData.get('categoryId') || null,
    projectId: formData.get('projectId') || null,
    payeeOrSource: formData.get('payeeOrSource') || null,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  // Expenses stored with signed negative amounts or positive based on type
  const parsedAmount = parsed.data.amount;
  const finalAmount = parsed.data.type === 'income' ? parsedAmount : -parsedAmount;
  const finalDate = parsed.data.date || getTodayDate();

  const newTx: InsertTransaction = {
    user_id: user.id,
    amount: finalAmount,
    type: parsed.data.type,
    description: parsed.data.description,
    date: finalDate,
    category_id: parsed.data.categoryId || null,
    project_id: parsed.data.projectId || null,
    payee_or_source: parsed.data.payeeOrSource || null,
  };

  const { error } = await supabase.from('transactions').insert(newTx);

  if (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/finances');
  revalidatePath('/projects');
  revalidatePath('/dashboard');
  revalidatePath('/');
    try {
      revalidateTag('finances-kpi', 'max');
      revalidateTag('projects-metrics', 'max');
    } catch {
      // Invariant: outside Next.js request context (e.g. tests)
    }
  return { success: true };
}

/**
 * Delete a transaction.
 */
export async function deleteTransaction(transactionId: string): Promise<ActionResponse> {
  const parsed = deleteTransactionSchema.safeParse({ transactionId });
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', parsed.data.transactionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/finances');
  revalidatePath('/projects');
  revalidatePath('/dashboard');
  revalidatePath('/');
    try {
      revalidateTag('finances-kpi', 'max');
      revalidateTag('projects-metrics', 'max');
    } catch {
      // Invariant: outside Next.js request context (e.g. tests)
    }
  return { success: true };
}

/**
 * Update an existing transaction with strict validation, precision preservation, and RLS enforcement.
 */
export async function updateTransaction(
  id: string,
  formData: FormData
): Promise<ActionResponse<TransactionWithRelations>> {
  const parsed = updateTransactionSchema.safeParse({
    id,
    description: formData.get('description'),
    amount: formData.get('amount'),
    type: formData.get('type') || 'expense',
    date: formData.get('date') || null,
    categoryId: formData.get('categoryId') || null,
    projectId: formData.get('projectId') || null,
    payeeOrSource: formData.get('payeeOrSource') || null,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  // Preserve PostgreSQL numeric(12, 2) precision using safe float parsing
  const preciseAmount = parseFloat(parsed.data.amount.toFixed(2));
  const finalAmount = parsed.data.type === 'income' ? preciseAmount : -preciseAmount;
  const finalDate = parsed.data.date || getTodayDate();

  const { data, error } = await supabase
    .from('transactions')
    .update({
      amount: finalAmount,
      type: parsed.data.type,
      description: parsed.data.description,
      date: finalDate,
      category_id: parsed.data.categoryId || null,
      project_id: parsed.data.projectId || null,
      payee_or_source: parsed.data.payeeOrSource || null,
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .select(`
      *,
      category:categories(*),
      project:projects(id, title, slug)
    `)
    .maybeSingle();

  if (error) {
    console.error('Error updating transaction:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  if (!data) {
    return { success: false, error: 'Transaction not found or unauthorized.' };
  }

  revalidatePath('/finances');
  revalidatePath('/projects');
  revalidatePath('/dashboard');
  revalidatePath('/');
    try {
      revalidateTag('finances-kpi', 'max');
      revalidateTag('projects-metrics', 'max');
    } catch {
      // Invariant: outside Next.js request context (e.g. tests)
    }

  return { success: true, data: data as TransactionWithRelations };
}
