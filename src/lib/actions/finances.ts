'use server';

import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth/user';
import { getUserProfile } from '@/lib/actions/profile';
import { revalidatePath } from 'next/cache';
import type { Category, InsertTransaction, TransactionType } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import { getTodayDate, getTrailingDays } from '@/lib/utils/date';

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
  { name: 'Allowance', type: 'income', color: '#10b981' },
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
  'Books & Study Supplies',
  'Entertainment & Hanging Out',
  'Food & Canteen',
  'Gifts & Side Hustles',
  'Pocket Money / Allowance',
  'Subscriptions',
  'Transport & Commute',
];

/**
 * Fetch financial categories and auto-seed/sync the student categories if missing.
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  let { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', effectiveUserId)
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
        .eq('user_id', effectiveUserId)
        .in('name', OBSOLETE_CATEGORIES);
    }

    // Insert missing student categories
    if (missingCategories.length > 0) {
      await supabase
        .from('categories')
        .insert(
          missingCategories.map((c) => ({
            user_id: effectiveUserId,
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
      .eq('user_id', effectiveUserId)
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
}

/**
 * Fetch ledger transactions with related category & project details.
 * CRITICAL: Bounded to LIMIT 100 to prevent DOM choking and table paint destruction.
 * Strictly casts PostgreSQL numeric amount strings into JavaScript numbers.
 */
export async function getTransactions(): Promise<TransactionWithRelations[]> {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(id, name, color),
      project:projects(id, title, slug)
    `)
    .eq('user_id', effectiveUserId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return (data || []).map((t: any) => ({
    ...t,
    amount: parseFloat(t.amount) || 0, // Explicitly parsed into float
  }));
}

/**
 * Compute aggregate financial analytics and chart series.
 * Optimized for Student Pocket Money tracking: Daily, Weekly, and Monthly breakdowns.
 * Strictly applies Number(value.toFixed(2)) to final sums to prevent binary floating-point bugs.
 */
export async function getFinancialAnalytics(): Promise<FinancialAnalytics> {
  const [transactions, profile] = await Promise.all([
    getTransactions(),
    getUserProfile(),
  ]);

  const currencySymbol = profile.currency_symbol || '₹';

  // Current date boundary calculations (Timezone safe YYYY-MM-DD strings in IST)
  const todayStr = getTodayDate();
  const [currentYear, currentMonthNum, currentDayNum] = todayStr.split('-').map(Number);
  const currentYearMonth = todayStr.substring(0, 7); // e.g. "2026-10"

  // Days in current month and days remaining (including today)
  const totalDaysInMonth = new Date(currentYear, currentMonthNum, 0).getDate();
  const daysLeftInMonth = Math.max(1, totalDaysInMonth - currentDayNum + 1);

  // Trailing 7 days structure for weekly tracker in IST
  const rawWeeklyDays = getTrailingDays(7);
  const weeklyDays: WeeklyDayData[] = rawWeeklyDays.map((d) => ({
    ...d,
    spent: 0,
  }));
  const weeklyDayMap = new Map<string, WeeklyDayData>();
  for (const item of weeklyDays) {
    weeklyDayMap.set(item.date, item);
  }

  let totalInflow = 0;
  let totalOutflow = 0;
  let monthlyAllowance = 0;
  let monthlySpent = 0;
  let todaySpent = 0;
  let weekSpent = 0;
  let projectSpendTotal = 0;

  const categoryMap = new Map<string, { value: number; color: string; count: number }>();

  for (const t of transactions) {
    const amt = Math.abs(t.amount);
    const isIncome = t.type === 'income' || t.amount > 0;
    const isCurrentMonth = t.date.startsWith(currentYearMonth);

    if (isIncome) {
      totalInflow += amt;
      if (isCurrentMonth) {
        monthlyAllowance += amt;
      }
    } else {
      totalOutflow += amt;
      if (isCurrentMonth) {
        monthlySpent += amt;
      }

      if (t.date === todayStr) {
        todaySpent += amt;
      }

      const weekDay = weeklyDayMap.get(t.date);
      if (weekDay) {
        weekDay.spent = Number((weekDay.spent + amt).toFixed(2));
        weekSpent += amt;
      }

      if (t.project_id) {
        projectSpendTotal += amt;
      }

      const catName = t.category?.name || 'Personal & Misc';
      const catColor = t.category?.color || '#a855f7';
      const existing = categoryMap.get(catName);
      if (existing) {
        existing.value += amt;
        existing.count += 1;
      } else {
        categoryMap.set(catName, { value: amt, color: catColor, count: 1 });
      }
    }
  }

  // Use profile's custom monthly allowance target if no allowance income logged this month yet
  if (monthlyAllowance === 0) {
    if (profile.monthly_allowance_target > 0) {
      monthlyAllowance = profile.monthly_allowance_target;
    } else if (totalInflow > 0) {
      monthlyAllowance = totalInflow;
    } else {
      monthlyAllowance = 15000.00;
    }
  }

  if (monthlySpent === 0 && totalOutflow > 0) {
    monthlySpent = totalOutflow;
  }

  const remainingAllowance = Number((monthlyAllowance - monthlySpent).toFixed(2));
  const allowanceUsagePercent =
    monthlyAllowance > 0
      ? Math.min(100, Math.round((monthlySpent / monthlyAllowance) * 100))
      : monthlySpent > 0
      ? 100
      : 0;

  // Safe daily budget target recommendation
  const safeDailyBudget =
    remainingAllowance > 0
      ? Number((remainingAllowance / daysLeftInMonth).toFixed(2))
      : 0;

  const categoryBreakdown: CategoryBreakdownItem[] = Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      name,
      value: Number(data.value.toFixed(2)),
      color: data.color,
      count: data.count,
      percentage: monthlySpent > 0 ? Math.round((data.value / monthlySpent) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const netCashflow = Number((totalInflow - totalOutflow).toFixed(2));

  const cashflowComparison = [
    { name: 'Pocket Money (In)', amount: Number(monthlyAllowance.toFixed(2)), fill: '#10b981' },
    { name: 'Spent (Out)', amount: Number(monthlySpent.toFixed(2)), fill: '#f43f5e' },
  ];

  return {
    currentDate: todayStr,
    currencySymbol,
    monthlyAllowance: Number(monthlyAllowance.toFixed(2)),
    monthlySpent: Number(monthlySpent.toFixed(2)),
    remainingAllowance,
    allowanceUsagePercent,
    todaySpent: Number(todaySpent.toFixed(2)),
    safeDailyBudget,
    daysLeftInMonth,
    weekSpent: Number(weekSpent.toFixed(2)),
    weeklyDays,
    categoryBreakdown,
    projectSpendTotal: Number(projectSpendTotal.toFixed(2)),
    totalInflow: Number(totalInflow.toFixed(2)),
    totalOutflow: Number(totalOutflow.toFixed(2)),
    netCashflow,
    cashflowComparison,
  };
}

/**
 * Create a new transaction with cross-linking foreign key support for projects and categories.
 */
export async function createTransaction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  const description = (formData.get('description') as string)?.trim();
  const amountRaw = formData.get('amount') as string;
  const type = ((formData.get('type') as string) || 'expense') as TransactionType;
  const dateRaw = (formData.get('date') as string)?.trim();
  const categoryIdRaw = (formData.get('categoryId') as string)?.trim();
  const projectIdRaw = (formData.get('projectId') as string)?.trim();
  const payeeOrSource = (formData.get('payeeOrSource') as string)?.trim() || null;

  if (!description) {
    return { success: false, error: 'Description is required.' };
  }

  const parsedAmount = parseFloat(amountRaw);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return { success: false, error: 'Please enter a valid positive amount.' };
  }

  // Expenses stored with signed negative amounts or positive based on type
  const finalAmount = type === 'income' ? parsedAmount : -parsedAmount;

  let finalDate = getTodayDate();
  if (dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    finalDate = dateRaw;
  }

  const categoryId = categoryIdRaw && categoryIdRaw !== 'none' ? categoryIdRaw : null;
  const projectId = projectIdRaw && projectIdRaw !== 'none' ? projectIdRaw : null;

  const newTx: InsertTransaction = {
    user_id: effectiveUserId,
    amount: finalAmount,
    type,
    description,
    date: finalDate,
    category_id: categoryId,
    project_id: projectId, // Feeds into Phase 4 project burn calculations
    payee_or_source: payeeOrSource,
  };

  const { error } = await supabase.from('transactions').insert(newTx);

  if (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/finances');
  revalidatePath('/projects');
  revalidatePath('/');
  return { success: true };
}

/**
 * Delete a transaction.
 */
export async function deleteTransaction(transactionId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', effectiveUserId);

  if (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/finances');
  revalidatePath('/projects');
  revalidatePath('/');
  return { success: true };
}

/**
 * Update an existing transaction with strict validation, precision preservation, and RLS enforcement.
 */
export async function updateTransaction(
  id: string,
  formData: FormData
): Promise<ActionResponse<TransactionWithRelations>> {
  if (!id) {
    return { success: false, error: 'Transaction ID is required.' };
  }

  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  const description = (formData.get('description') as string)?.trim();
  const amountRaw = formData.get('amount') as string;
  const type = ((formData.get('type') as string) || 'expense') as TransactionType;
  const dateRaw = (formData.get('date') as string)?.trim();
  const categoryIdRaw = (formData.get('categoryId') as string)?.trim();
  const projectIdRaw = (formData.get('projectId') as string)?.trim();
  const payeeOrSource = (formData.get('payeeOrSource') as string)?.trim() || null;

  if (!description) {
    return { success: false, error: 'Description is required.' };
  }

  const parsedAmount = parseFloat(amountRaw);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return { success: false, error: 'Please enter a valid positive amount.' };
  }

  // Preserve PostgreSQL numeric(12, 2) precision using safe float parsing
  const preciseAmount = parseFloat(parsedAmount.toFixed(2));
  const finalAmount = type === 'income' ? preciseAmount : -preciseAmount;

  let finalDate = getTodayDate();
  if (dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    finalDate = dateRaw;
  }

  // Handle foreign key updates cleanly if the user changes category_id or links/unlinks project_id
  const categoryId = categoryIdRaw && categoryIdRaw !== 'none' && categoryIdRaw !== '' ? categoryIdRaw : null;
  const projectId = projectIdRaw && projectIdRaw !== 'none' && projectIdRaw !== '' ? projectIdRaw : null;

  const { data, error } = await supabase
    .from('transactions')
    .update({
      amount: finalAmount,
      type,
      description,
      date: finalDate,
      category_id: categoryId,
      project_id: projectId,
      payee_or_source: payeeOrSource,
    })
    .eq('id', id)
    .eq('user_id', effectiveUserId)
    .select(`
      *,
      category:categories(*),
      project:projects(id, title, slug)
    `)
    .single();

  if (error) {
    console.error('Error updating transaction:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  if (!data) {
    return { success: false, error: 'Transaction not found or unauthorized.' };
  }

  revalidatePath('/finances');
  revalidatePath('/projects');
  revalidatePath('/');

  return { success: true, data: data as TransactionWithRelations };
}
