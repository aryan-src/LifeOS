'use client';

import { useEffect, useRef } from 'react';
import { updateUserTimezone } from '@/lib/actions/profile';

interface TimezoneSyncProps {
  isTimezoneNull: boolean;
}

/**
 * Automatically syncs the user's browser timezone to public.profiles
 * once on first load if profiles.timezone is null.
 */
export function TimezoneSync({ isTimezoneNull }: TimezoneSyncProps) {
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isTimezoneNull || hasSynced.current) return;

    try {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (browserTimezone) {
        hasSynced.current = true;
        updateUserTimezone(browserTimezone).catch((err) => {
          console.warn('[TimezoneSync] Failed to persist detected timezone:', err);
        });
      }
    } catch (err) {
      console.warn('[TimezoneSync] Error detecting browser timezone:', err);
    }
  }, [isTimezoneNull]);

  return null;
}
