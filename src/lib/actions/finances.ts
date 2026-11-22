'use server';

import { createClient } from '@/lib/supabase/server';
import {
  DEV_BYPASS_MUTATION_ERROR,
  getAuthenticatedUser,
} from '@/lib/supabase/dev-auth';
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

import { getFallbackFinancialAnalytics } from '@/lib/finances/defaults';

/**
 * Fetch financial categories for the authenticated user without auto-seeding.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) return [];

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
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
 * Create a custom financial category for the authenticated user.
 * Requires active authentication, trims and enforces length limits,
 * guards against duplicates for the same user/type, and enforces RLS isolation.
 */
export async function createCategory(
  name: string,
  type: 'income' | 'expense' = 'expense',
  color?: string
): Promise<ActionResponse<Category>> {
  try {
    const cleanName = (name || '').trim();
    if (!cleanName) {
      return { success: false, error: 'Category name is required' };
    }

    if (cleanName.length > 50) {
      return { success: false, error: 'Category name must be 50 characters or fewer' };
    }

    const supabase = await createClient();
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) {
      return { success: false, error: DEV_BYPASS_MUTATION_ERROR };
    }

    // Check for duplicate category name under the same user and transaction type
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', type)
      .ilike('name', cleanName)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'A category with this name already exists' };
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: cleanName,
        type,
        color: color || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A category with this name already exists' };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/finances');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: {
        ...data,
        monthly_budget: data.monthly_budget !== null ? Number(data.monthly_budget) : null,
      },
    };
  } catch (err) {
    return { success: false, error: formatErrorMessage(err) };
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
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) return [];

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
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) return getFallbackFinancialAnalytics();

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
): Promise<ActionResponse<{ id?: string }>> {
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
  const { user, isBypass } = await getAuthenticatedUser(supabase);
  if (isBypass || !user) {
    return { success: false, error: DEV_BYPASS_MUTATION_ERROR };
  }

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

  const { data: insertedTx, error } = await supabase
    .from('transactions')
    .insert(newTx)
    .select('id')
    .maybeSingle();

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
  return { success: true, data: { id: insertedTx?.id } };
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
  const { user, isBypass } = await getAuthenticatedUser(supabase);
  if (isBypass || !user) {
    return { success: false, error: DEV_BYPASS_MUTATION_ERROR };
  }

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
  const { user, isBypass } = await getAuthenticatedUser(supabase);
  if (isBypass || !user) {
    return { success: false, error: DEV_BYPASS_MUTATION_ERROR };
  }

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
