'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUserId } from '@/lib/auth/user';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Profile, UpdateProfile } from '@/types/database.types';
import type { ActionResponse } from '@/types/action.types';
import { formatErrorMessage } from '@/lib/utils/errors';
import { updateProfileSchema, formatZodError } from '@/lib/validations';
import { cache } from 'react';

/**
 * Request-level cached fetch for student profile preferences.
 * Deduplicates across RSC passes to eliminate redundant database calls.
 */
export const getUserProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const effectiveUserId = await requireUserId(supabase);

  const defaultProfile: Profile = {
    id: effectiveUserId,
    display_name: 'Student',
    theme_preference: 'stone',
    currency_symbol: '₹',
    monthly_allowance_target: 15000.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
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
        monthly_allowance_target: Number(profile.monthly_allowance_target || 15000),
      };
    }

    return defaultProfile;
  } catch (err) {
    console.error('Unhandled error in getUserProfile:', err);
    return defaultProfile;
  }
});

/**
 * Update student profile preferences with strict validation.
 */
export async function updateProfile(
  prevState: unknown,
  formData: FormData
): Promise<ActionResponse<Profile>> {
  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get('displayName'),
    currencySymbol: formData.get('currencySymbol'),
    themePreference: formData.get('themePreference'),
    monthlyAllowanceTarget: formData.get('monthlyAllowanceTarget'),
  });

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const supabase = await createClient();
  const effectiveUserId = await requireUserId(supabase);

  const displayName = parsed.data.displayName;
  const currencySymbol = parsed.data.currencySymbol;
  const themePreference = parsed.data.themePreference;
  const monthlyAllowanceTarget = parsed.data.monthlyAllowanceTarget;

  const payload: UpdateProfile = {
    display_name: displayName,
    currency_symbol: currencySymbol,
    theme_preference: themePreference,
    monthly_allowance_target: monthlyAllowanceTarget,
  };

  let { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: effectiveUserId,
      ...payload,
    })
    .select()
    .single();

  if (error && (themePreference === 'crimson-dark' || themePreference === 'crimson-light' || themePreference === 'crimson-cream' || themePreference === 'default')) {
    // If the remote check constraint has not been updated yet, store standard DB fallback
    const fallbackTheme = (themePreference === 'crimson-dark' || themePreference === 'crimson-cream') ? 'dark' : 'stone';
    const fallbackRes = await supabase
      .from('profiles')
      .upsert({
        id: effectiveUserId,
        ...payload,
        theme_preference: fallbackTheme,
      })
      .select()
      .single();

    if (!fallbackRes.error && fallbackRes.data) {
      error = null;
      data = { ...fallbackRes.data, theme_preference: themePreference };
    }
  }

  if (error || !data) {
    console.error('Error updating profile:', error);
    return { success: false, error: formatErrorMessage(error || 'Failed to update profile') };
  }

  const updatedProfile: Profile = {
    ...data,
    id: data.id || effectiveUserId,
    display_name: data.display_name ?? displayName,
    theme_preference: themePreference,
    currency_symbol: data.currency_symbol || currencySymbol,
    monthly_allowance_target: Number(data.monthly_allowance_target || monthlyAllowanceTarget),
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };

  revalidatePath('/settings');
  revalidatePath('/');
  revalidatePath('/finances');
  return {
    success: true,
    data: updatedProfile,
  };
}

/**
 * Sign out action - terminates Supabase session and redirects to /login.
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
