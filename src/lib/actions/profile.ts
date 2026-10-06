'use server';

import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth/user';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Profile, UpdateProfile } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import { cache } from 'react';

/**
 * Request-level cached fetch for student profile preferences.
 * Deduplicates across RSC passes to eliminate redundant database calls.
 */
export const getUserProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', effectiveUserId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching student profile:', error);
  }

  if (profile) {
    return {
      ...profile,
      monthly_allowance_target: Number(profile.monthly_allowance_target),
    };
  }

  // Graceful fallback for new or unseeded profiles
  const { data: { user } } = await supabase.auth.getUser();
  const fallbackName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Student');

  return {
    id: effectiveUserId,
    display_name: fallbackName,
    theme_preference: 'stone',
    currency_symbol: '₹',
    monthly_allowance_target: 15000.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});

/**
 * Update student profile preferences with strict validation.
 */
export async function updateProfile(
  prevState: any,
  formData: FormData
): Promise<ActionResponse<Profile>> {
  const supabase = await createClient();
  const effectiveUserId = await getEffectiveUserId(supabase);

  const displayName = (formData.get('displayName') as string)?.trim() || 'Student';
  const currencySymbol = (formData.get('currencySymbol') as string)?.trim() || '₹';
  const themePreference = ((formData.get('themePreference') as string) || 'stone') as 'stone' | 'light' | 'dark';
  const allowanceRaw = formData.get('monthlyAllowanceTarget') as string;

  const parsedAllowance = parseFloat(allowanceRaw);
  const monthlyAllowanceTarget = isNaN(parsedAllowance) || parsedAllowance < 0 ? 15000.00 : parsedAllowance;

  const payload: UpdateProfile = {
    display_name: displayName,
    currency_symbol: currencySymbol,
    theme_preference: themePreference,
    monthly_allowance_target: monthlyAllowanceTarget,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: effectiveUserId,
      ...payload,
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: formatErrorMessage(error) };
  }

  revalidatePath('/settings');
  revalidatePath('/');
  revalidatePath('/finances');
  return {
    success: true,
    data: {
      ...data,
      monthly_allowance_target: Number(data.monthly_allowance_target),
    },
  };
}

/**
 * Sign out current session and redirect to /login.
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
