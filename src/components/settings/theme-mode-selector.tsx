'use client';

import React from 'react';
import { CloudMoon, CloudRain, Monitor, Moon, Sun } from 'lucide-react';
import { normalizeThemeMode, type ThemeMode } from '@/lib/theme/use-theme';

export interface ThemeModeSelectorProps {
  value: string;
  onChange: (mode: ThemeMode, event?: React.MouseEvent<HTMLButtonElement>) => void;
}

const THEME_OPTIONS: Array<{
  id: ThemeMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  swatches: string[];
}> = [
  {
    id: 'monsoon-garden',
    label: 'Monsoon Garden',
    description: 'Light botanical palette with misty cream and deep forest ink',
    icon: <CloudRain className="h-4 w-4" aria-hidden="true" />,
    swatches: ['#F3F1E8', '#FBFAF4', '#1F5D4A', '#3E8E7E'],
  },
  {
    id: 'monsoon-night',
    label: 'Monsoon Night',
    description: 'Deep green-black obsidian canvas with sage and warm terracotta accents',
    icon: <CloudMoon className="h-4 w-4" aria-hidden="true" />,
    swatches: ['#0E1511', '#16211B', '#7FB896', '#D9805A'],
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Warm archival paper with deep forest accents',
    icon: <Sun className="h-4 w-4" aria-hidden="true" />,
    swatches: ['#FAF9F5', '#FFFFFF', '#1B1C1A', '#006C49'],
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Calm charcoal surface with crisp mint accents',
    icon: <Moon className="h-4 w-4" aria-hidden="true" />,
    swatches: ['#141312', '#0F0E0D', '#E6E1DF', '#4FDBC8'],
  },
  {
    id: 'system',
    label: 'System',
    description: 'Matches your operating system appearance automatically',
    icon: <Monitor className="h-4 w-4" aria-hidden="true" />,
    swatches: ['#FAF9F5', '#141312'],
  },
];

export function ThemeModeSelector({ value, onChange }: ThemeModeSelectorProps) {
  const activeMode = normalizeThemeMode(value);

  return (
    <div
      role="radiogroup"
      aria-label="Theme appearance"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
      data-purpose="theme-mode-selector"
    >
      {THEME_OPTIONS.map((option) => {
        const isSelected = activeMode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={(e) => onChange(option.id, e)}
            className={`flex flex-col items-start justify-between gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 ${
              isSelected
                ? 'border-secondary bg-secondary/10 ring-1 ring-secondary/30'
                : 'border-outline-variant/50 bg-surface-container-low/60 hover:bg-surface-container'
            }`}
          >
            <div className="w-full space-y-2">
              <div className="flex w-full items-center justify-between">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isSelected
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {option.icon}
                </span>
                {isSelected && (
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-secondary">
                    Active
                  </span>
                )}
              </div>
              <div>
                <div className="font-sans text-body-sm font-semibold text-on-surface">
                  {option.label}
                </div>
                <p className="mt-0.5 font-sans text-[12px] leading-snug text-on-surface-variant">
                  {option.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-2 border-t border-outline-variant/30 w-full" aria-hidden="true">
              {option.swatches.map((color, idx) => (
                <span
                  key={idx}
                  className="inline-block h-3 w-3 rounded-full border border-black/15 dark:border-white/15 shrink-0"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
