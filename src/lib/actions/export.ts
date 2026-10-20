'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types/action.types';
import type { NoteExportItem, TransactionExportItem, AssignmentExportItem, TaskExportItem, HabitExportItem } from '@/lib/export/formatters';

export interface FullAccountExportData {
  exportedAt: string;
  notes: NoteExportItem[];
  projects: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  }>;
  tasks: TaskExportItem[];
  transactions: TransactionExportItem[];
  categories: Array<{
    id: string;
    name: string;
    color: string;
    type: string;
  }>;
  assignments: AssignmentExportItem[];
  habits: HabitExportItem[];
  habit_logs: Array<{
    id: string;
    habit_id: string;
    date: string;
    is_completed: boolean;
  }>;
}

/**
 * Server action to fetch a complete snapshot of all records belonging to the authenticated user.
 * Protected by Row-Level Security and requireUserId().
 */
export async function getFullAccountExport(): Promise<ActionResponse<FullAccountExportData>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');
    const userId = user.id;

    const [
      notesRes,
      projectsRes,
      tasksRes,
      transactionsRes,
      categoriesRes,
      assignmentsRes,
      habitsRes,
      habitLogsRes,
    ] = await Promise.all([
      supabase
        .from('notes')
        .select('id, title, content, created_at, updated_at, project:projects(id, title, slug)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('projects')
        .select('id, title, slug, status, description, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('tasks')
        .select('id, title, is_completed, priority, due_date, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('id, date, amount, type, description, category:categories(name)')
        .eq('user_id', userId)
        .order('date', { ascending: false }),
      supabase
        .from('categories')
        .select('id, name, color, type')
        .eq('user_id', userId),
      supabase
        .from('assignments')
        .select('id, title, subject, due_date, status, marks_achieved, total_marks, project:projects(title)')
        .eq('user_id', userId)
        .order('due_date', { ascending: true }),
      supabase
        .from('habits')
        .select('id, title, description, created_at')
        .eq('user_id', userId),
      supabase
        .from('habit_logs')
        .select('id, habit_id, date, is_completed')
        .eq('user_id', userId),
    ]);

    const exportData: FullAccountExportData = {
      exportedAt: new Date().toISOString(),
      notes: (notesRes.data || []) as unknown as NoteExportItem[],
      projects: (projectsRes.data || []) as unknown as FullAccountExportData['projects'],
      tasks: (tasksRes.data || []) as unknown as TaskExportItem[],
      transactions: (transactionsRes.data || []) as unknown as TransactionExportItem[],
      categories: (categoriesRes.data || []) as unknown as FullAccountExportData['categories'],
      assignments: (assignmentsRes.data || []) as unknown as AssignmentExportItem[],
      habits: (habitsRes.data || []) as unknown as HabitExportItem[],
      habit_logs: (habitLogsRes.data || []) as unknown as FullAccountExportData['habit_logs'],
    };

    return {
      success: true,
      data: exportData,
    };
  } catch (err) {
    console.error('Error generating account export:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve account export data.',
    };
  }
}
