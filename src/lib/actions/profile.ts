'use server';

import { createClient } from '@/lib/supabase/server';
import {
  DEV_BYPASS_MUTATION_ERROR,
  getAuthenticatedUser,
  isDevAuthBypassEnabled,
} from '@/lib/supabase/dev-auth';
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
  const isDevBypass = isDevAuthBypassEnabled();

  const defaultProfile: Profile = {
    id: isDevBypass ? 'dev-local-user' : 'unauthenticated',
    display_name: isDevBypass ? 'Aryan' : 'Student',
    theme_preference: 'nordic',
    currency_symbol: '₹',
    monthly_allowance_target: 15000.00,
    timezone: null,
    daily_focus_goal_minutes: 240,
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

    const resolvedDisplayName: string =
      (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
      (typeof user.email === 'string' && user.email.includes('@')
        ? user.email.split('@')[0]
        : '') ||
      (isDevBypass ? 'Aryan' : 'Student');

    const resolvedAvatarUrl: string | null =
      (typeof user.user_metadata?.avatar_url === 'string' && user.user_metadata.avatar_url.trim()) ||
      (typeof user.user_metadata?.picture === 'string' && user.user_metadata.picture.trim()) ||
      null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      if (error.code === '42703' || error.code === '42P01') {
        console.warn(
          `[Profile] Non-fatal schema mismatch (code: ${error.code}): ${error.message}. Returning default profile with fallback timezone and daily_focus_goal_minutes.`
        );
      } else {
        console.error('Error fetching student profile:', error);
      }
    }

    if (profile) {
      return {
        ...profile,
        display_name: profile.display_name || resolvedDisplayName,
        avatar_url: profile.avatar_url ?? resolvedAvatarUrl,
        timezone: profile.timezone ?? null,
        daily_focus_goal_minutes: Number(profile.daily_focus_goal_minutes || 240),
        monthly_allowance_target: Number(profile.monthly_allowance_target || 15000),
      };
    }

    // First-time OAuth user whose profile row wasn't created yet: best-effort idempotent seed
    try {
      const seedRes = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            display_name: resolvedDisplayName,
            avatar_url: resolvedAvatarUrl,
            theme_preference: 'stone',
            currency_symbol: '₹',
            monthly_allowance_target: 15000.0,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

      if (seedRes.error && seedRes.error.code === '42703') {
        await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              display_name: resolvedDisplayName,
              theme_preference: 'stone',
              currency_symbol: '₹',
              monthly_allowance_target: 15000.0,
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );
      }
    } catch {
      // Non-fatal: still return populated in-memory profile so first load never crashes
    }

    return {
      ...defaultProfile,
      id: user.id,
      display_name: resolvedDisplayName,
      avatar_url: resolvedAvatarUrl,
    };
  } catch (err) {
    if (!isDevBypass) {
      console.error('Unhandled error in getUserProfile:', err);
    }
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

  const rawGoal =
    formData.get('dailyFocusGoalMinutes') ||
    formData.get('daily_focus_goal_minutes') ||
    formData.get('focusGoalMinutes');

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get('displayName'),
    currencySymbol: formData.get('currencySymbol'),
    themePreference: formData.get('themePreference'),
    monthlyAllowanceTarget: formData.get('monthlyAllowanceTarget'),
    dailyFocusGoalMinutes: rawGoal ? Number(rawGoal) : undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { user, isBypass } = await getAuthenticatedUser(supabase);
  const themePreference: UpdateProfile['theme_preference'] =
    (parsed.data.themePreference as UpdateProfile['theme_preference']) || 'monsoon-garden';

  if (isBypass || !user) {
    return {
      success: true,
      data: {
        id: 'dev-local-user',
        display_name: parsed.data.displayName || 'Aryan',
        currency_symbol: parsed.data.currencySymbol || '₹',
        theme_preference: themePreference,
        monthly_allowance_target: Number(parsed.data.monthlyAllowanceTarget || 15000),
        daily_focus_goal_minutes: Number(parsed.data.dailyFocusGoalMinutes || 240),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  const displayName = parsed.data.displayName;
  const currencySymbol = parsed.data.currencySymbol;
  const monthlyAllowanceTarget = parsed.data.monthlyAllowanceTarget;

  const payload: UpdateProfile = {
    display_name: displayName,
    currency_symbol: currencySymbol,
    theme_preference: themePreference,
    monthly_allowance_target: monthlyAllowanceTarget,
    ...(parsed.data.dailyFocusGoalMinutes
      ? { daily_focus_goal_minutes: parsed.data.dailyFocusGoalMinutes }
      : {}),
  };

  let { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      ...payload,
    })
    .select()
    .maybeSingle();

  if (error && (error as { code?: string }).code === '42703' && payload.daily_focus_goal_minutes) {
    const { daily_focus_goal_minutes: _omitted, ...safePayload } = payload;
    const retryRes = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...safePayload,
      })
      .select()
      .maybeSingle();
    if (!retryRes.error && retryRes.data) {
      error = null;
      data = { ...retryRes.data, daily_focus_goal_minutes: payload.daily_focus_goal_minutes };
    }
  }

  if (
    error &&
    (themePreference === 'spatial-glass' ||
      themePreference === 'risograph' ||
      themePreference === 'nordic' ||
      themePreference === 'tui' ||
      themePreference === 'tactile' ||
      themePreference === 'crimson-dark' ||
      themePreference === 'crimson-light' ||
      themePreference === 'crimson-cream' ||
      themePreference === 'default' ||
      themePreference === 'system')
  ) {
    // If the remote check constraint has not been updated yet, store standard DB fallback
    const fallbackTheme =
      themePreference === 'tui' || themePreference === 'crimson-dark' || themePreference === 'crimson-cream'
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
    theme_preference: data.theme_preference || themePreference,
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
 * Updates the user's timezone on public.profiles.
 * Called automatically on first load when profiles.timezone is null.
 * Handles Postgres error 42703 (undefined column) gracefully as non-fatal.
 */
export async function updateUserTimezone(
  timezone: string
): Promise<ActionResponse<{ timezone: string }>> {
  try {
    if (!timezone || typeof timezone !== 'string') {
      return { success: false, error: 'Timezone string is required' };
    }

    const supabase = await createClient();
    const { user, isBypass } = await getAuthenticatedUser(supabase);
    if (isBypass || !user) {
      return { success: false, error: DEV_BYPASS_MUTATION_ERROR };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ timezone })
      .eq('id', user.id);

    if (error) {
      if (error.code === '42703' || error.code === '42P01') {
        console.warn(
          `[Profile] Non-fatal schema warning updating timezone (code: ${error.code}): ${error.message}`
        );
        return { success: true, data: { timezone } };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true, data: { timezone } };
  } catch (err) {
    return { success: false, error: formatErrorMessage(err) };
  }
}

/**
 * Sign out action - terminates Supabase session and redirects to /login.
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
