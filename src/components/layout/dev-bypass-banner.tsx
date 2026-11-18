import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { isDevAuthBypassEnabled } from '@/lib/supabase/dev-auth';

/**
 * Visible warning banner rendered in the app shell ONLY when local DEV_BYPASS_AUTH=true is active.
 * Hard-disabled in production builds (`isDevAuthBypassEnabled()` always returns false when NODE_ENV === 'production').
 */
export function DevBypassBanner() {
  if (!isDevAuthBypassEnabled()) {
    return null;
  }

  return (
    <div
      role="status"
      data-purpose="dev-bypass-banner"
      className="w-full bg-amber-50 dark:bg-amber-950/70 border-b border-amber-200/80 dark:border-amber-800/70 px-4 py-2 text-amber-900 dark:text-amber-200"
    >
      <div className="max-w-[1360px] mx-auto flex items-center justify-center gap-2 text-xs font-sans">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
        <span className="font-medium">
          Dev Auth Bypass active (DEV_BYPASS_AUTH=true):
        </span>
        <span className="text-amber-800 dark:text-amber-300">
          Login is skipped, reads return empty/default data, and Supabase writes are disabled.
        </span>
      </div>
    </div>
  );
}
