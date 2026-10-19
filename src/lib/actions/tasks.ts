'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { Task, InsertTask, UpdateTask } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import {
  createTaskSchema,
  toggleTaskSchema,
  updateTaskStatusSchema,
  updateTaskPrioritySchema,
  deleteTaskSchema,
  formatZodError,
} from '@/lib/validations';

export interface TaskWithProject extends Task {
  project?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

/**
 * Fetch tasks for the authenticated user, optionally with linked project data.
 * Safe query returning an array of tasks with zero unhandled exceptions.
 */
export async function getTasks(): Promise<TaskWithProject[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, title, slug)
      `)
      .eq('user_id', user.id)
      .order('is_completed', { ascending: true })
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data as unknown as TaskWithProject[];
  } catch (err) {
    console.error('Unhandled error in getTasks:', err);
    return [];
  }
}

/**
 * Create a new task with strict Zod validation.
 * Uses .maybeSingle() to safely handle single-row returns without coercion errors.
 */
export async function createTask(
  prevState: unknown,
  formData: FormData
): Promise<ActionResponse<Task>> {
  try {
    const parsed = createTaskSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      dueDate: formData.get('dueDate') || null,
      priority: formData.get('priority'),
      projectId: formData.get('projectId') || null,
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

    const newTask: InsertTask = {
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      due_date: parsed.data.dueDate || null,
      priority: parsed.data.priority,
      project_id: parsed.data.projectId || null,
      is_completed: false,
      sort_order: 0,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating task:', error);
      return { success: false, error: formatErrorMessage(error) };
    }

    const createdTask = data as Task | null;
    if (!createdTask) {
      return { success: false, error: 'Task was created but could not be retrieved.' };
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath('/');
    try {
      revalidateTag('projects-metrics', 'max');
    } catch {
      // Invariant: outside Next.js request context (e.g. tests)
    }
    return { success: true, data: createdTask };
  } catch (err) {
    console.error('Unhandled error in createTask:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

export interface TaskStatusResponse {
  id: string;
  is_completed: boolean;
  in_progress: boolean;
}

/**
 * Update task status (is_completed and/or in_progress).
 * Executed silently in the background with zero-latency optimistic UI support.
 * Uses .maybeSingle() to prevent "Cannot coerce the result to a single JSON object" crashes.
 */
export async function updateTaskStatus(
  taskId: string,
  updates: { is_completed?: boolean; in_progress?: boolean }
): Promise<ActionResponse<TaskStatusResponse>> {
  try {
    const parsed = updateTaskStatusSchema.safeParse({ taskId, ...updates });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const updateData: UpdateTask = {};
    if (typeof parsed.data.is_completed === 'boolean') {
      updateData.is_completed = parsed.data.is_completed;
      updateData.completed_at = parsed.data.is_completed ? new Date().toISOString() : null;
      if (parsed.data.is_completed) {
        updateData.in_progress = false;
      }
    }
    if (typeof parsed.data.in_progress === 'boolean') {
      updateData.in_progress = parsed.data.in_progress;
      if (parsed.data.in_progress) {
        updateData.is_completed = false;
        updateData.completed_at = null;
      }
    }

    let { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', parsed.data.taskId)
      .eq('user_id', user.id)
      .select('id, is_completed, in_progress')
      .maybeSingle();

    // Graceful fallback if database column hasn't migrated yet on remote
    if (error && error.message?.includes('in_progress')) {
      const fallbackUpdate: UpdateTask = {
        is_completed: updateData.is_completed,
        completed_at: updateData.completed_at,
      };
      const fallbackRes = await supabase
        .from('tasks')
        .update(fallbackUpdate)
        .eq('id', parsed.data.taskId)
        .eq('user_id', user.id)
        .select('id, is_completed')
        .maybeSingle();

      data = fallbackRes.data
        ? {
            ...fallbackRes.data,
            in_progress: (updateData.in_progress as boolean) ?? false,
          }
        : null;
      error = fallbackRes.error;
    }

    if (error) {
      console.error('Error updating task status:', error);
      return { success: false, error: formatErrorMessage(error) };
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath('/');
    try {
      revalidateTag('projects-metrics', 'max');
    } catch {
      // Invariant: outside Next.js request context (e.g. tests)
    }
    return {
      success: true,
      data: {
        id: data?.id || taskId,
        is_completed: data?.is_completed ?? ((updateData.is_completed as boolean) ?? false),
        in_progress: data?.in_progress ?? ((updateData.in_progress as boolean) ?? false),
      },
    };
  } catch (err) {
    console.error('Unhandled error in updateTaskStatus:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Toggle task completion state (backward compatible wrapper around updateTaskStatus).
 */
export async function toggleTask(
  taskId: string,
  targetCompletedState: boolean
): Promise<ActionResponse<{ id: string; is_completed: boolean; in_progress: boolean }>> {
  return updateTaskStatus(taskId, { is_completed: targetCompletedState });
}

/**
 * Update task priority (1 = Low, 2 = Medium, 3 = High, 4 = Urgent).
 */
export async function updateTaskPriority(
  taskId: string,
  priority: number
): Promise<ActionResponse> {
  try {
    const parsed = updateTaskPrioritySchema.safeParse({ taskId, priority });
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
      .from('tasks')
      .update({ priority: parsed.data.priority })
      .eq('id', parsed.data.taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating task priority:', error);
      return { success: false, error: formatErrorMessage(error) };
    }

    revalidatePath('/tasks');
    return { success: true };
  } catch (err) {
    console.error('Unhandled error in updateTaskPriority:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Delete task by ID.
 */
export async function deleteTask(taskId: string): Promise<ActionResponse> {
  try {
    const parsed = deleteTaskSchema.safeParse({ taskId });
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
      .from('tasks')
      .delete()
      .eq('id', parsed.data.taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: formatErrorMessage(error) };
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath('/');
    try {
      revalidateTag('projects-metrics', 'max');
    } catch {
      // Invariant: outside Next.js request context (e.g. tests)
    }
    return { success: true };
  } catch (err) {
    console.error('Unhandled error in deleteTask:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}
