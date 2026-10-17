'use client';

import React from 'react';
import { useIsMac } from '@/hooks/use-is-mac';

interface KbdShortcutProps {
  keyChar?: string;
  className?: string;
  format?: 'symbol' | 'text';
}

/**
 * OS-Aware keyboard shortcut pill.
 * Renders ⌘K on macOS and Ctrl K on Windows/Linux.
 */
export function KbdShortcut({ keyChar = 'K', className, format = 'symbol' }: KbdShortcutProps) {
  const isMac = useIsMac();
  const modifier = isMac ? (format === 'text' ? 'Cmd' : '⌘') : 'Ctrl';

  return (
    <kbd className={className || 'font-mono text-xs px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'}>
      {modifier}{keyChar ? (format === 'text' || !isMac ? `+${keyChar}` : keyChar) : ''}
    </kbd>
  );
}
