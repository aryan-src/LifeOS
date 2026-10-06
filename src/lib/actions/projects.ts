'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Project, InsertProject, ProjectStatus } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  // 1. Fetch projects
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', effectiveUserId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (projErr || !projects) {
    console.error('Error fetching projects:', projErr);
    return [];
  }

  // 2. Fetch associated tasks and transactions for metrics calculation
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) return [];

  const [{ data: tasks }, { data: transactions }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, project_id, is_completed')
      .in('project_id', projectIds),
    supabase
      .from('transactions')
      .select('id, project_id, amount, type')
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
      // Sum expenses
      if (tx.type === 'expense' || tx.amount < 0) {
        return acc + Math.abs(tx.amount);
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
}

/**
 * Update project Kanban status column.
 */
export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
): Promise<ActionResponse<{ id: string; status: ProjectStatus }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const { data, error } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId)
    .eq('user_id', effectiveUserId)
    .select('id, status')
    .single();

  if (error) {
    console.error('Error updating project status:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/projects');
  revalidatePath('/');
  return { success: true, data };
}

/**
 * Create a new project.
 */
export async function createProject(
  prevState: any,
  formData: FormData
): Promise<ActionResponse<Project>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const status = ((formData.get('status') as string) || 'active') as ProjectStatus;
  const priority = parseInt((formData.get('priority') as string) || '2', 10);
  const budget = parseFloat((formData.get('budget') as string) || '0');
  const targetDateRaw = (formData.get('targetDate') as string)?.trim();

  if (!title) {
    return { success: false, error: 'Project title is required.' };
  }

  // Base slug from title
  const slugBase = title
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
      .eq('user_id', effectiveUserId)
      .eq('slug', finalSlug)
      .maybeSingle();

    if (!existing) break;
    finalSlug = `${slugBase}-${counter}`;
    counter++;
  }

  let targetDate: string | null = null;
  if (targetDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(targetDateRaw)) {
    targetDate = targetDateRaw;
  }

  const newProject: InsertProject = {
    user_id: effectiveUserId,
    title,
    slug: finalSlug,
    description,
    status,
    priority,
    budget: isNaN(budget) ? 0 : budget,
    start_date: new Date().toISOString().split('T')[0],
    target_date: targetDate,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(newProject)
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/projects');
  revalidatePath('/');
  return { success: true, data: data as Project };
}

/**
 * Delete a project. Child tasks and transactions set project_id to NULL automatically.
 */
export async function deleteProject(projectId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', effectiveUserId);

  if (error) {
    console.error('Error deleting project:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/projects');
  revalidatePath('/tasks');
  revalidatePath('/finances');
  revalidatePath('/');
  return { success: true };
}
