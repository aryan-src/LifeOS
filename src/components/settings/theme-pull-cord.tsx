'use client';

import React, { useEffect, useState } from 'react';
import PullCord from '@/components/kokonutui/pull-cord';
import { useTheme, type ThemeMode } from '@/lib/theme/use-theme';
import { cn } from '@/lib/utils';

export interface ThemePullCordProps {
  className?: string;
  onThemeChange?: (theme: ThemeMode) => void;
}

export function ThemePullCord({ className, onThemeChange }: ThemePullCordProps) {
  const [mounted, setMounted] = useState(false);
  const { isDark, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'relative rounded-3xl border border-outline-variant/40 bg-surface-container-low/60',
          className
        )}
        style={{ width: 288, height: 360 }}
        aria-hidden="true"
      />
    );
  }

  const handleCheckedChange = (checked: boolean) => {
    const nextTheme: ThemeMode = checked ? 'light' : 'dark';
    setTheme(nextTheme);
    onThemeChange?.(nextTheme);
  };

  return (
    <PullCord
      checked={!isDark}
      onCheckedChange={handleCheckedChange}
      label="Theme"
      className={className}
    />
  );
}

export default ThemePullCord;
