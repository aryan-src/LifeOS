'use server';

import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth/user';

export interface ProjectOption {
  id: string;
  title: string;
  slug: string;
}

export async function getProjectOptions(): Promise<ProjectOption[]> {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

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
