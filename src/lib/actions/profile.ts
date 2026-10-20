'use server';

import { createClient } from '@/lib/supabase/server';
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
  const defaultProfile: Profile = {
    id: 'unauthenticated',
    display_name: 'Student',
    theme_preference: 'stone',
    currency_symbol: '₹',
    monthly_allowance_target: 15000.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return defaultProfile;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
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

    return {
      ...defaultProfile,
      id: user.id,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Student',
    };
  } catch (err) {
    console.error('Unhandled error in getUserProfile:', err);
    return defaultProfile;
  }
});

/**
 * Update student profile preferences with strict validation.
 */
export async function updateProfile(
  prevStateOrFormData: unknown,
  maybeFormData?: FormData
): Promise<ActionResponse<Profile>> {
  const formData =
    maybeFormData instanceof FormData
      ? maybeFormData
      : prevStateOrFormData instanceof FormData
      ? prevStateOrFormData
      : new FormData();

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
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

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
      id: user.id,
      ...payload,
    })
    .select()
    .maybeSingle();

  if (
    error &&
    (themePreference === 'crimson-dark' ||
      themePreference === 'crimson-light' ||
      themePreference === 'crimson-cream' ||
      themePreference === 'default' ||
      themePreference === 'system')
  ) {
    // If the remote check constraint has not been updated yet, store standard DB fallback
    const fallbackTheme =
      themePreference === 'crimson-dark' || themePreference === 'crimson-cream'
        ? 'dark'
        : 'stone';
    const fallbackRes = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...payload,
        theme_preference: fallbackTheme,
      })
      .select()
      .maybeSingle();

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
    id: data.id || user.id,
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

export const updateUserProfile = updateProfile;

/**
 * Sign out action - terminates Supabase session and redirects to /login.
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
