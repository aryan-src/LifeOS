'use server';

import { createClient } from '@/lib/supabase/server';

export interface ProjectOption {
  id: string;
  title: string;
  slug: string;
}

export async function getProjectOptions(): Promise<ProjectOption[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const { data, error } = await supabase
    .from('projects')
    .select('id, title, slug')
    .eq('user_id', effectiveUserId)
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching project options:', error);
    return [];
  }

  return data || [];
}
