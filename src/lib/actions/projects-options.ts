'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/dev-auth';

export interface ProjectOption {
  id: string;
  title: string;
  slug: string;
}

export async function getProjectOptions(): Promise<ProjectOption[]> {
  try {
    const supabase = await createClient();
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('id, title, slug')
      .eq('user_id', user.id)
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching project options:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unhandled error in getProjectOptions:', err);
    return [];
  }
}
