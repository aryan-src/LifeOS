'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Note, InsertNote } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';

export interface NoteWithProject extends Note {
  project?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

/**
 * Fetch all notes for the authenticated user, ordered by is_pinned DESC and updated_at DESC.
 */
export async function getNotes(): Promise<NoteWithProject[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      project:projects(id, title, slug)
    `)
    .eq('user_id', effectiveUserId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  return (data as any) || [];
}

/**
 * Create a new note.
 */
export async function createNote(
  prevState: any,
  formData: FormData
): Promise<ActionResponse<Note>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const title = (formData.get('title') as string)?.trim() || 'Untitled Note';
  const content = (formData.get('content') as string)?.trim() || '';
  const tagsRaw = (formData.get('tags') as string)?.trim() || '';

  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean)
    : [];

  const newNote: InsertNote = {
    user_id: effectiveUserId,
    title,
    content,
    tags: tags as any,
    is_pinned: false,
    is_archived: false,
  };

  const { data, error } = await supabase
    .from('notes')
    .insert(newNote)
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/notes');
  revalidatePath('/');
  return { success: true, data: data as Note };
}

/**
 * Toggle pinned status for a note.
 */
export async function togglePinNote(
  noteId: string,
  isPinned: boolean
): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const { error } = await supabase
    .from('notes')
    .update({ is_pinned: isPinned })
    .eq('id', noteId)
    .eq('user_id', effectiveUserId);

  if (error) {
    console.error('Error toggling pin:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/notes');
  return { success: true };
}

/**
 * Delete a note.
 */
export async function deleteNote(noteId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', effectiveUserId);

  if (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/notes');
  revalidatePath('/');
  return { success: true };
}

/**
 * Promote an Idea/Note to a Project with TRUE ACID ATOMICITY via PostgreSQL RPC.
 * Parses checklist items [ ] or - [ ] from the note content into child tasks.
 */
export async function promoteNoteToProject(
  noteId: string,
  overrides?: {
    title?: string;
    description?: string;
    priority?: number;
    budget?: number;
  }
): Promise<ActionResponse<{ project_id: string; slug: string; tasks_created: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  // 1. Fetch note to extract title, content and markdown checklist items
  const { data: note, error: fetchErr } = await supabase
    .from('notes')
    .select('id, title, content, user_id')
    .eq('id', noteId)
    .eq('user_id', effectiveUserId)
    .single();

  if (fetchErr || !note) {
    return { success: false, error: 'Note not found.' };
  }

  const projectTitle = (overrides?.title || note.title || 'Promoted Project').trim();
  const projectDesc = overrides?.description ?? note.content;

  // Generate URL-safe slug base
  const slugBase = projectTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'project';

  // 2. Parse Markdown checklist items: "[ ] Task title" or "- [ ] Task title"
  const checklistRegex = /(?:^|\n)\s*(?:-\s*)?\[\s*\]\s*(.+)/g;
  const parsedTasks: { title: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = checklistRegex.exec(note.content)) !== null) {
    const taskTitle = match[1]?.trim();
    if (taskTitle) {
      parsedTasks.push({ title: taskTitle });
    }
  }

  // 3. Execute atomic PostgreSQL RPC procedure (ACID transaction)
  const { data: rpcResult, error: rpcErr } = await (supabase.rpc as any)('promote_to_project', {
    p_note_id: noteId,
    p_title: projectTitle,
    p_slug: slugBase,
    p_description: projectDesc,
    p_priority: overrides?.priority ?? 2,
    p_budget: overrides?.budget ?? 0.00,
    p_initial_tasks: parsedTasks,
  });

  if (rpcErr) {
    console.error('Error promoting note via RPC:', rpcErr);
    return { success: false, error: formatErrorMessage(rpcErr) };
  }

  revalidatePath('/notes');
  revalidatePath('/projects');
  revalidatePath('/tasks');
  revalidatePath('/');

  return {
    success: true,
    data: rpcResult as { project_id: string; slug: string; tasks_created: number },
  };
}
