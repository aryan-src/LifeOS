'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
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
import {
  computeProjectsMetrics,
  type ProjectWithMetrics,
  type RawProjectTask,
  type RawProjectTransaction,
} from '@/lib/projects/compute';

export type { ProjectWithMetrics, RawProjectTask, RawProjectTransaction };

/**
 * Next.js Edge Data Cache (revalidate: 60) for project metrics.
 * Strictly partitioned by userId to guarantee multi-tenant isolation.
 */
const getCachedProjectsWithMetrics = (userId: string, accessToken: string) => {
  return unstable_cache(
    async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const client = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

      const { data: projects, error: projErr } = await client
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (projErr || !projects || projects.length === 0) {
        return [];
      }

      const projectIds = projects.map((p) => p.id);

      const [{ data: tasks }, { data: transactions }] = await Promise.all([
        client
          .from('tasks')
          .select('id, project_id, is_completed')
          .eq('user_id', userId)
          .in('project_id', projectIds),
        client
          .from('transactions')
          .select('id, project_id, amount, type')
          .eq('user_id', userId)
          .in('project_id', projectIds),
      ]);

      return computeProjectsMetrics(
        projects as Project[],
        (tasks || []) as RawProjectTask[],
        (transactions || []) as RawProjectTransaction[]
      );
    },
    ['user-projects-metrics', userId],
    {
      revalidate: 60,
      tags: [`user-${userId}-projects`, 'projects-metrics'],
    }
  )();
};

/**
 * Fetch projects with calculated metrics for the authenticated user.
 * CRITICAL: Uses NULLIF(total_tasks, 0) logic to prevent NaN / divide-by-zero errors.
 * Uses React request cache and Edge Data Cache (revalidate: 60) for instant paints.
 */
export const getProjectsWithMetrics = cache(async (): Promise<ProjectWithMetrics[]> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (accessToken && process.env.NEXT_RUNTIME && !process.env.VITEST) {
      try {
        const cached = await getCachedProjectsWithMetrics(user.id, accessToken);
        if (cached) return cached;
      } catch (cacheErr) {
        // Fall back to direct query if cache retrieval errors
      }
    }

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

    return computeProjectsMetrics(
      projects as Project[],
      (tasks || []) as RawProjectTask[],
      (transactions || []) as RawProjectTransaction[]
    );
  } catch (err) {
    console.error('Unhandled error in getProjectsWithMetrics:', err);
    return [];
  }
});

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
    try {
      revalidateTag('projects-metrics', 'max');
    } catch {
      // Invariant: outside Next.js request context (e.g. tests)
    }
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
    try {
      revalidateTag('projects-metrics', 'max');
    } catch {
      // Invariant: outside Next.js request context (e.g. tests)
    }
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
  try {
    revalidateTag('projects-metrics', 'max');
  } catch {
    // Invariant: outside Next.js request context (e.g. tests)
  }
  return { success: true };
}
