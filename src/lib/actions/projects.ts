'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Project, InsertProject, ProjectStatus } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import { getTodayDate } from '@/lib/utils/date';
import {
  createProjectSchema,
  updateProjectStatusSchema,
  deleteProjectSchema,
  formatZodError,
} from '@/lib/validations';

export interface ProjectWithMetrics extends Project {
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  total_spend: number;
}

/**
 * Fetch projects with calculated metrics for the authenticated user.
 * CRITICAL: Uses NULLIF(total_tasks, 0) logic to prevent NaN / divide-by-zero errors.
 */
export async function getProjectsWithMetrics(): Promise<ProjectWithMetrics[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // 1. Fetch projects
    const { data: projects, error: projErr } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (projErr || !projects || projects.length === 0) {
      if (projErr) console.error('Error fetching projects:', projErr);
      return [];
    }

    // 2. Fetch associated tasks and transactions for metrics calculation
    const projectIds = projects.map((p) => p.id);

    const [{ data: tasks }, { data: transactions }] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, project_id, is_completed')
        .eq('user_id', user.id)
        .in('project_id', projectIds),
      supabase
        .from('transactions')
        .select('id, project_id, amount, type')
        .eq('user_id', user.id)
        .in('project_id', projectIds),
    ]);

    // Aggregate metrics per project with divide-by-zero safeguards
    return projects.map((project) => {
      const projTasks = tasks?.filter((t) => t.project_id === project.id) || [];
      const totalTasks = projTasks.length;
      const completedTasks = projTasks.filter((t) => t.is_completed).length;

      // NULLIF(totalTasks, 0) safeguard:
      const completionPercentage =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const projTransactions = transactions?.filter((tx) => tx.project_id === project.id) || [];
      const totalSpend = projTransactions.reduce((acc, tx) => {
        const rawAmt = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount));
        const amt = isNaN(rawAmt) ? 0 : rawAmt;
        if (tx.type === 'expense' || amt < 0) {
          return acc + Math.abs(amt);
        }
        return acc;
      }, 0);

      return {
        ...project,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        completion_percentage: completionPercentage,
        total_spend: totalSpend,
      };
    });
  } catch (err) {
    console.error('Unhandled error in getProjectsWithMetrics:', err);
    return [];
  }
}

/**
 * Update project Kanban status column.
 */
export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
): Promise<ActionResponse<{ id: string; status: ProjectStatus }>> {
  try {
    const parsed = updateProjectStatusSchema.safeParse({ projectId, status });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('projects')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.projectId)
      .eq('user_id', user.id)
      .select('id, status')
      .maybeSingle();

    if (error) {
      console.error('Error updating project status:', error);
      return { success: false, error: formatErrorMessage(error) };
    }

    revalidatePath('/projects');
    revalidatePath('/dashboard');
    revalidatePath('/');
    return {
      success: true,
      data: data || { id: projectId, status },
    };
  } catch (err) {
    console.error('Unhandled error in updateProjectStatus:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Create a new project with Zod validation.
 */
export async function createProject(
  prevState: unknown,
  formData: FormData
): Promise<ActionResponse<Project>> {
  try {
    const parsed = createProjectSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      status: formData.get('status') || 'active',
      priority: formData.get('priority') || '2',
      budget: formData.get('budget') || '0',
      targetDate: formData.get('targetDate') || null,
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

    // Base slug from title
    const slugBase = parsed.data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'project';

    // Check unique slug for user
    let finalSlug = slugBase;
    let counter = 1;
    while (true) {
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('slug', finalSlug)
        .maybeSingle();

      if (!existing) break;
      finalSlug = `${slugBase}-${counter}`;
      counter++;
    }

    const newProject: InsertProject = {
      user_id: user.id,
      title: parsed.data.title,
      slug: finalSlug,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      budget: parsed.data.budget,
      start_date: getTodayDate(),
      target_date: parsed.data.targetDate || null,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('Error creating project:', error);
      return { success: false, error: formatErrorMessage(error || 'Failed to create project') };
    }

    revalidatePath('/projects');
    revalidatePath('/tasks');
    revalidatePath('/finances');
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true, data: data as Project };
  } catch (err) {
    console.error('Unhandled error in createProject:', err);
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Delete a project. Child tasks and transactions set project_id to NULL automatically.
 */
export async function deleteProject(projectId: string): Promise<ActionResponse> {
  const parsed = deleteProjectSchema.safeParse({ projectId });
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
    .from('projects')
    .delete()
    .eq('id', parsed.data.projectId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting project:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/projects');
  revalidatePath('/tasks');
  revalidatePath('/finances');
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}
