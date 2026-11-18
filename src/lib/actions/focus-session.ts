'use server';

import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import {
  DEV_BYPASS_MUTATION_ERROR,
  getAuthenticatedUser,
} from '@/lib/supabase/dev-auth';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import { validateFocusSessionPayload } from '@/lib/daily-loop/focus-timer-engine';
import { isValidUuid } from '@/lib/validations';
import type {
  FocusSessionErrorCode,
  PersistableFocusMode,
} from '@/lib/daily-loop/types';

export interface LogFocusSessionParams {
  /** Preferred exact duration in seconds (used by global focus timer) */
  durationSeconds?: number;
  /** Backwards-compatible duration in minutes */
  durationMinutes?: number;
  /** Optional planned session duration in seconds for ceiling validation */
  plannedDurationSeconds?: number;
  /** Client-generated UUID v4 used as UNIQUE idempotency key in public.focus_sessions */
  clientSessionId?: string;
  taskId?: string | null;
  projectId?: string | null;
  mode?: string;
  startedAt?: string;
  endedAt?: string;
  /** Backwards-compatible alias for endedAt */
  completedAt?: string;
}

export interface FocusSessionResult {
  recorded: boolean;
  clientSessionId: string;
  durationSeconds: number;
  durationMinutes: number;
  mode: PersistableFocusMode;
  taskId?: string | null;
  projectId?: string | null;
  message: string;
}

export interface LogFocusSessionResponse extends ActionResponse<FocusSessionResult> {
  success: boolean;
  code: 'ok' | FocusSessionErrorCode;
  message: string;
}

/**
 * Server Action: Records a completed focus session in public.focus_sessions.
 * - Sets user_id strictly from the authenticated Supabase session (never from client params).
 * - Enforces strict server validation (rejects break modes, non-positive duration,
 *   duration far above mode ceiling, future ended_at, and invalid task/project UUIDs).
 * - Uses ON CONFLICT (client_session_id) DO NOTHING (ignoreDuplicates: true) so retries
 *   and multi-tab races are idempotent and never create duplicates or error on conflict.
 * - Returns structured `{ success, code, message }` with distinct error codes and never swallows errors.
 */
export async function logFocusSession(
  params: LogFocusSessionParams
): Promise<LogFocusSessionResponse> {
  try {
    const nowMs = Date.now();
    const durationSeconds =
      typeof params.durationSeconds === 'number'
        ? Math.round(params.durationSeconds)
        : typeof params.durationMinutes === 'number'
        ? Math.round(params.durationMinutes * 60)
        : 0;

    if (durationSeconds < 60) {
      const msg = 'Session under 1m not logged';
      return {
        success: false,
        code: 'validation',
        message: msg,
        error: msg,
      };
    }

    if (params.taskId != null && !isValidUuid(params.taskId)) {
      const msg = 'Invalid task_id UUID.';
      return {
        success: false,
        code: 'validation',
        message: msg,
        error: msg,
      };
    }

    if (params.projectId != null && !isValidUuid(params.projectId)) {
      const msg = 'Invalid project_id UUID.';
      return {
        success: false,
        code: 'validation',
        message: msg,
        error: msg,
      };
    }

    const rawMode = (params.mode || 'pomodoro').toLowerCase().trim();
    const normalizedMode =
      rawMode === 'focus' || rawMode === 'sprint' || rawMode === 'pomodoro'
        ? 'pomodoro'
        : rawMode === 'deep-work' || rawMode === 'deep_work' || rawMode === 'deep'
        ? 'deep-work'
        : rawMode;

    const endedAt = params.endedAt || params.completedAt || new Date(nowMs).toISOString();
    const endedMs = Date.parse(endedAt);
    const startedAt =
      params.startedAt ||
      (Number.isFinite(endedMs)
        ? new Date(endedMs - Math.max(0, durationSeconds) * 1000).toISOString()
        : new Date(nowMs).toISOString());

    const clientSessionId = params.clientSessionId || randomUUID();

    // Strict server-side validation before touching auth/database
    const validation = validateFocusSessionPayload(
      {
        clientSessionId,
        mode: normalizedMode,
        durationSeconds,
        plannedDurationSeconds: params.plannedDurationSeconds,
        startedAt,
        endedAt,
      },
      nowMs
    );

    if (!validation.valid) {
      return {
        success: false,
        code: 'validation',
        message: validation.error,
        error: validation.error,
      };
    }

    const supabase = await createClient();
    let user: { id: string } | null = null;
    try {
      const auth = await getAuthenticatedUser(supabase);
      if (auth.isBypass || !auth.user) {
        return {
          success: false,
          code: 'dev_bypass',
          message: DEV_BYPASS_MUTATION_ERROR,
          error: DEV_BYPASS_MUTATION_ERROR,
        };
      }
      user = auth.user;
    } catch (authErr) {
      const msg =
        authErr instanceof Error && authErr.message
          ? authErr.message
          : 'Unauthorized';
      return {
        success: false,
        code: 'not_authenticated',
        message: msg,
        error: msg,
      };
    }

    // Idempotent insert into public.focus_sessions (ON CONFLICT (client_session_id) DO NOTHING)
    const { error: upsertError } = await supabase
      .from('focus_sessions')
      .upsert(
        {
          user_id: user.id, // Always derived from authenticated session
          client_session_id: clientSessionId,
          task_id: params.taskId ?? null,
          project_id: params.projectId ?? null,
          duration_seconds: durationSeconds,
          started_at: startedAt,
          ended_at: endedAt,
          mode: validation.mode,
        },
        {
          onConflict: 'client_session_id',
          ignoreDuplicates: true,
        }
      );

    if (upsertError) {
      const pgCode = upsertError.code || 'UNKNOWN';
      const dbMessage = `Supabase error (${pgCode}): ${upsertError.message}`;
      console.error('[FocusSession] Error persisting focus_sessions row:', upsertError);
      return {
        success: false,
        code: 'db_error',
        message: dbMessage,
        error: dbMessage,
      };
    }

    // Touch linked task/project activity timestamps when bound
    if (params.taskId) {
      await supabase
        .from('tasks')
        .update({ updated_at: endedAt })
        .eq('id', params.taskId)
        .eq('user_id', user.id);
    }

    if (params.projectId) {
      await supabase
        .from('projects')
        .update({ updated_at: endedAt })
        .eq('id', params.projectId)
        .eq('user_id', user.id);
    }

    revalidatePath('/tasks');
    revalidatePath('/dashboard');
    revalidatePath('/');

    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
    const successMessage = `Successfully logged ${durationMinutes}m focus session.`;

    return {
      success: true,
      code: 'ok',
      message: successMessage,
      data: {
        recorded: true,
        clientSessionId,
        durationSeconds,
        durationMinutes,
        mode: validation.mode,
        taskId: params.taskId ?? null,
        projectId: params.projectId ?? null,
        message: successMessage,
      },
    };
  } catch (err) {
    console.error('Unhandled error in logFocusSession:', err);
    const msg = formatErrorMessage(err);
    return {
      success: false,
      code: 'unknown',
      message: msg,
      error: msg,
    };
  }
}

/**
 * Helper to fetch binding candidates (uncompleted tasks and active projects)
 */
export async function getFocusBindingContext(): Promise<{
  tasks: Array<{ id: string; title: string }>;
  projects: Array<{ id: string; title: string; slug: string }>;
}> {
  try {
    const supabase = await createClient();
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) {
      return { tasks: [], projects: [] };
    }

    const [tasksRes, projectsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('priority', { ascending: false })
        .limit(30),
      supabase
        .from('projects')
        .select('id, title, slug')
        .eq('user_id', user.id)
        .order('title', { ascending: true })
        .limit(30),
    ]);

    return {
      tasks: tasksRes.data || [],
      projects: projectsRes.data || [],
    };
  } catch {
    return { tasks: [], projects: [] };
  }
}

export interface FocusSessionRow {
  id: string;
  client_session_id: string | null;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
  mode: string;
  task_id: string | null;
  project_id: string | null;
  task?: { id: string; title: string } | null;
  project?: { id: string; title: string } | null;
}

/**
 * Read-only server action for user-scoped focus_sessions (last 30 days, RLS respected).
 * Permitted exception to rule 1 for Focus History Recent Sessions table.
 */
export async function getRecentFocusSessions(days = 30): Promise<FocusSessionRow[]> {
  try {
    const supabase = await createClient();
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) {
      return [];
    }

    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('focus_sessions')
      .select(`
        id,
        client_session_id,
        duration_seconds,
        started_at,
        ended_at,
        mode,
        task_id,
        project_id,
        task:tasks(id, title),
        project:projects(id, title)
      `)
      .eq('user_id', user.id)
      .gte('ended_at', sinceIso)
      .order('ended_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[FocusSession] getRecentFocusSessions failed:', error);
      return [];
    }

    return (data as unknown as FocusSessionRow[]) || [];
  } catch (err) {
    console.error('[FocusSession] Unhandled getRecentFocusSessions error:', err);
    return [];
  }
}
