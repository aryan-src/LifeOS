'use server';

import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth/user';
import { revalidatePath } from 'next/cache';
import type { Task, InsertTask } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';

export interface TaskWithProject extends Task {
  project?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

/**
 * Fetch tasks for the authenticated user, optionally with linked project data.
 */
export async function getTasks(): Promise<TaskWithProject[]> {
  try {
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId(supabase);

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, title, slug)
      `)
      .eq('user_id', effectiveUserId)
      .order('is_completed', { ascending: true })
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error || !data) {
      if (error) console.error('Error fetching tasks:', error);
      return [];
    }

    return (data as any) || [];
  } catch (err) {
    console.error('Unhandled error in getTasks:', err);
    return [];
  }
}

/**
 * Create a new task.
 * Note: due_date is handled strictly as an absolute ISO date string (YYYY-MM-DD)
 * to avoid timezone drift between client browser and PostgreSQL date column.
 */
export async function createTask(
  prevState: any,
  formData: FormData
): Promise<ActionResponse<Task>> {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const dueDateRaw = (formData.get('dueDate') as string)?.trim();
  const priorityRaw = formData.get('priority');
  const projectIdRaw = (formData.get('projectId') as string)?.trim();

  if (!title) {
    return { success: false, error: 'Task title is required.' };
  }

  // Validate YYYY-MM-DD date string format strictly without creating Date() object
  let dueDate: string | null = null;
  if (dueDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dueDateRaw)) {
    dueDate = dueDateRaw;
  }

  const priority = priorityRaw ? Math.min(Math.max(parseInt(priorityRaw.toString(), 10), 1), 4) : 2;
  const projectId = projectIdRaw && projectIdRaw !== 'none' ? projectIdRaw : null;

  const newTask: InsertTask = {
    user_id: effectiveUserId,
    title,
    description,
    due_date: dueDate,
    priority,
    project_id: projectId,
    is_completed: false,
    sort_order: 0,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(newTask)
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/tasks');
  revalidatePath('/');
  return { success: true, data: data as Task };
}

/**
 * Toggle task completion state.
 * Returns standardized ActionResponse envelope.
 */
export async function toggleTask(
  taskId: string,
  targetCompletedState: boolean
): Promise<ActionResponse<{ id: string; is_completed: boolean }>> {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  const completedAt = targetCompletedState ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from('tasks')
    .update({
      is_completed: targetCompletedState,
      completed_at: completedAt,
    })
    .eq('id', taskId)
    .eq('user_id', effectiveUserId)
    .select('id, is_completed')
    .single();

  if (error) {
    console.error('Error toggling task:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/tasks');
  revalidatePath('/');
  return { success: true, data };
}

/**
 * Update task priority (1 = Low, 2 = Medium, 3 = High, 4 = Urgent).
 */
export async function updateTaskPriority(
  taskId: string,
  priority: number
): Promise<ActionResponse> {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  const validPriority = Math.min(Math.max(priority, 1), 4);

  const { error } = await supabase
    .from('tasks')
    .update({ priority: validPriority })
    .eq('id', taskId)
    .eq('user_id', effectiveUserId);

  if (error) {
    console.error('Error updating task priority:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/tasks');
  return { success: true };
}

/**
 * Delete task by ID.
 */
export async function deleteTask(taskId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', effectiveUserId);

  if (error) {
    console.error('Error deleting task:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/tasks');
  revalidatePath('/');
  return { success: true };
}
