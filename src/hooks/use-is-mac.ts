'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true if the client device is macOS/iOS, false for Windows/Linux/Android.
 * Defaults to true during SSR to prevent layout flicker.
 */
export function useIsMac(): boolean {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent || '';
      const navWithUAD = navigator as Navigator & { userAgentData?: { platform?: string } };
      const platform = navWithUAD.userAgentData?.platform || navigator.platform || '';
      const mac = /Mac|iPhone|iPod|iPad/i.test(platform) || /Macintosh|Mac OS X/i.test(userAgent);
      setIsMac(mac);
    }
  }, []);

  return isMac;
}
