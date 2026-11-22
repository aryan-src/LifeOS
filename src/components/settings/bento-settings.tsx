'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  LogOut,
  Palette,
  Save,
  User,
  Wallet,
} from 'lucide-react';
import type { Profile } from '@/types/database.types';
import { updateProfile, signOutAction } from '@/lib/actions/profile';
import {
  saveTheme,
  applyThemeToDOM,
  normalizeThemeMode,
  type ThemeMode,
} from '@/lib/theme/use-theme';
import { useRadialThemeTransition } from '@/hooks/use-radial-theme-transition';
import { getFullAccountExport } from '@/lib/actions/export';
import {
  formatNoteAsMarkdown,
  formatTransactionsCsv,
  formatAssignmentsCsv,
  formatTasksCsv,
  formatHabitsCsv,
  createZipArchive,
} from '@/lib/export/formatters';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { PageTitle } from '@/components/ui/page-title';
import { ThemeModeSelector } from './theme-mode-selector';
import { ThemePullCord } from './theme-pull-cord';

interface BentoSettingsProps {
  initialProfile: Profile;
  userEmail?: string;
}

interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', label: 'INR (₹ — Indian Rupee)' },
  { code: 'USD', symbol: '$', label: 'USD ($ — US Dollar)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€ — Euro)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£ — British Pound)' },
];

const LINING_NUMS_STYLE: React.CSSProperties = {
  fontVariantNumeric: 'lining-nums tabular-nums',
};

function resolveCurrencyCode(symbol?: string | null): string {
  if (!symbol) return 'INR';
  const found = CURRENCY_OPTIONS.find((c) => c.symbol === symbol || c.code === symbol);
  return found ? found.code : 'INR';
}

function resolveCurrencySymbol(codeOrSymbol: string): string {
  const found = CURRENCY_OPTIONS.find(
    (c) => c.code === codeOrSymbol || c.symbol === codeOrSymbol
  );
  return found ? found.symbol : '₹';
}

function getInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return clean.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function BentoSettings({ initialProfile, userEmail }: BentoSettingsProps) {
  const [displayName, setDisplayName] = useState<string>(
    initialProfile.display_name?.trim() || ''
  );
  const [allowanceTarget, setAllowanceTarget] = useState<string>(
    initialProfile.monthly_allowance_target?.toString() || '5000'
  );
  const [currencyCode, setCurrencyCode] = useState<string>(() =>
    resolveCurrencyCode(initialProfile.currency_symbol)
  );
  const [currencySymbol, setCurrencySymbol] = useState<string>(() =>
    resolveCurrencySymbol(initialProfile.currency_symbol || '₹')
  );
  const [focusGoalMinutes, setFocusGoalMinutes] = useState<number>(() =>
    initialProfile.daily_focus_goal_minutes || 240
  );
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    normalizeThemeMode(initialProfile.theme_preference)
  );

  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState<'notes' | 'csv' | 'json' | null>(null);
  const { triggerThemeTransition } = useRadialThemeTransition();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedTheme = localStorage.getItem('lifeos_theme');
      if (savedTheme) {
        const normalized = normalizeThemeMode(savedTheme);
        setThemeMode(normalized);
        applyThemeToDOM(normalized);
      }
    } catch {
      // ignore storage errors
    }

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const nextTheme = customEvent.detail || localStorage.getItem('lifeos_theme');
      if (nextTheme) {
        setThemeMode(normalizeThemeMode(nextTheme));
      }
    };

    window.addEventListener('lifeos-theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('lifeos-theme-change', handleThemeChange);
    };
  }, []);

  const parsedAllowance = Math.max(0, parseFloat(allowanceTarget) || 0);
  const safePaceDaily = (parsedAllowance / 30).toFixed(2);
  const focusGoalHours = Math.max(
    1,
    Math.round((initialProfile.daily_focus_goal_minutes || 240) / 60)
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectTheme = (
    nextMode: ThemeMode,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    triggerThemeTransition(event || null, nextMode, (mode) => {
      const normalized = normalizeThemeMode(mode);
      setThemeMode(normalized);
      saveTheme(normalized);
      applyThemeToDOM(normalized);
    });
    showToast(`Theme switched to ${nextMode}`);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setCurrencyCode(code);
    setCurrencySymbol(resolveCurrencySymbol(code));
  };

  const handleSaveChanges = () => {
    setSaveError(null);
    const trimmedName = displayName.trim() || 'Student';
    const formData = new FormData();
    const dbThemePreference =
      themeMode === 'monsoon-garden' || (themeMode as string) === 'monsoon'
        ? 'light'
        : themeMode === 'monsoon-night'
        ? 'dark'
        : themeMode;
    formData.set('displayName', trimmedName);
    formData.set('currencySymbol', currencySymbol);
    formData.set('themePreference', dbThemePreference);
    formData.set('monthlyAllowanceTarget', String(parsedAllowance));
    formData.set('dailyFocusGoalMinutes', String(focusGoalMinutes));

    startTransition(async () => {
      const res = await updateProfile(null, formData);
      if (res.success) {
        try {
          localStorage.setItem('lifeos_display_name', trimmedName);
        } catch {
          // ignore
        }
        saveTheme(themeMode);
        applyThemeToDOM(themeMode);
        showToast('Preferences saved');
      } else {
        setSaveError(res.error || 'Could not save settings.');
      }
    });
  };

  const handleRealExport = async (kind: 'notes' | 'csv' | 'json') => {
    if (exportBusy) return;
    setExportBusy(kind);
    setSaveError(null);

    try {
      const res = await getFullAccountExport();
      if (!res.success || !res.data) {
        setSaveError(res.error || 'Export unavailable. Sign in to export your account data.');
        return;
      }

      const dateTag = new Date().toISOString().slice(0, 10);

      if (kind === 'json') {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: 'application/json',
        });
        triggerBrowserDownload(blob, `lifeos-export-${dateTag}.json`);
        showToast('Account JSON snapshot downloaded');
        return;
      }

      if (kind === 'notes') {
        const files = res.data.notes.map((note, idx) => ({
          name: `notes/${(note.title || `note-${idx + 1}`).replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.md`,
          content: formatNoteAsMarkdown(note),
        }));
        const zipBlob = createZipArchive(files);
        triggerBrowserDownload(zipBlob, `lifeos-notes-${dateTag}.zip`);
        showToast('Notes Markdown ZIP downloaded');
        return;
      }

      if (kind === 'csv') {
        const files = [
          { name: 'transactions.csv', content: formatTransactionsCsv(res.data.transactions) },
          { name: 'assignments.csv', content: formatAssignmentsCsv(res.data.assignments) },
          { name: 'tasks.csv', content: formatTasksCsv(res.data.tasks) },
          { name: 'habits.csv', content: formatHabitsCsv(res.data.habits) },
        ];
        const zipBlob = createZipArchive(files);
        triggerBrowserDownload(zipBlob, `lifeos-tables-${dateTag}.zip`);
        showToast('CSV tables archive downloaded');
      }
    } catch {
      setSaveError('Export failed. Please check your connection and try again.');
    } finally {
      setExportBusy(null);
    }
  };

  const initials = getInitials(displayName);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Settings Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-outline-variant/40 pb-5 sm:flex-row sm:items-end">
        <PageTitle>Settings</PageTitle>

        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={isPending}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary px-4 font-sans text-body-sm font-medium text-on-secondary shadow-xs transition-opacity hover:opacity-95 disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>{isPending ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </header>

      {saveError && (
        <div
          role="alert"
          className="rounded-xl border border-error/30 bg-error-container px-4 py-3 font-sans text-body-sm text-on-error-container"
        >
          {saveError}
        </div>
      )}

      {/* Main 12-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Card 1: Profile */}
        <div className="lg:col-span-7">
          <Card as="section" id="sectionProfile" padding="lg" surface="lowest" className="space-y-5 h-full">
            <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-low text-on-surface">
                <User className="h-4 w-4" aria-hidden="true" />
              </div>
              <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
                Profile
              </h2>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {initialProfile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={initialProfile.avatar_url}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full border border-outline-variant/40 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-headline-md font-semibold text-on-primary">
                  {initials}
                </div>
              )}

              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="settings-display-name"
                    className="block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant"
                  >
                    Display Name
                  </label>
                  <input
                    id="settings-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2 font-sans text-body-sm text-on-surface focus:border-secondary focus:bg-surface-container-lowest focus:outline-none"
                  />
                </div>

                {userEmail && (
                  <div className="space-y-1.5">
                    <span className="block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Account Email
                    </span>
                    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2 font-mono text-label-sm text-on-surface-variant truncate">
                      {userEmail}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 sm:col-span-2">
                  <span className="block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Timezone
                  </span>
                  <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2 font-mono text-label-sm text-on-surface">
                    {initialProfile.timezone || 'Synced automatically from browser'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Card 2: Goals */}
        <div className="lg:col-span-5">
          <Card as="section" id="sectionFinance" padding="lg" surface="lowest" className="space-y-5 h-full">
            <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-low text-secondary">
                <Wallet className="h-4 w-4" aria-hidden="true" />
              </div>
              <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
                Goals
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="settings-allowance"
                  className="block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant"
                >
                  Monthly Allowance Target
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-body-sm text-on-surface-variant">
                    {currencySymbol}
                  </span>
                  <input
                    id="settings-allowance"
                    type="number"
                    min={0}
                    step={50}
                    value={allowanceTarget}
                    onChange={(e) => setAllowanceTarget(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low py-2 pl-8 pr-3.5 font-mono text-body-sm text-on-surface focus:border-secondary focus:bg-surface-container-lowest focus:outline-none"
                    style={LINING_NUMS_STYLE}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="settings-currency"
                  className="block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant"
                >
                  Currency
                </label>
                <select
                  id="settings-currency"
                  value={currencyCode}
                  onChange={handleCurrencyChange}
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-3.5 py-2 font-sans text-body-sm text-on-surface focus:border-secondary focus:bg-surface-container-lowest focus:outline-none"
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Editable Daily Focus Goal */}
            <div className="space-y-2">
              <label className="block font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
                Daily focus goal
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { label: '2h', minutes: 120 },
                  { label: '3h', minutes: 180 },
                  { label: '4h', minutes: 240 },
                  { label: '6h', minutes: 360 },
                ].map((opt) => {
                  const isSelected = focusGoalMinutes === opt.minutes;
                  return (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => setFocusGoalMinutes(opt.minutes)}
                      className={`rounded-xl py-2 px-3 font-mono text-label-md font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-secondary text-on-secondary shadow-xs font-semibold'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
              <div>
                <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Calculated Safe Pace
                </span>
                <div
                  className="mt-1 font-mono text-stat-lg font-semibold text-secondary"
                  style={LINING_NUMS_STYLE}
                >
                  {currencySymbol}
                  {safePaceDaily} / day
                </div>
              </div>

              <div>
                <span className="font-mono text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Daily Focus Goal
                </span>
                <div
                  className="mt-1 font-mono text-stat-lg font-semibold text-on-surface"
                  style={LINING_NUMS_STYLE}
                >
                  {Math.round(focusGoalMinutes / 60)}h / day
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Card 3: Appearance (Full 12 Cols) */}
        <div className="lg:col-span-12">
          <Card as="section" id="sectionAppearance" padding="lg" surface="lowest" className="space-y-5">
            <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-low text-on-surface">
                <Palette className="h-4 w-4" aria-hidden="true" />
              </div>
              <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
                Appearance
              </h2>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 w-full space-y-3">
                <ThemeModeSelector value={themeMode} onChange={handleSelectTheme} />
              </div>
              <div className="shrink-0 flex justify-center">
                <ThemePullCord onThemeChange={(t) => setThemeMode(t)} />
              </div>
            </div>
          </Card>
        </div>

        {/* Card 4: Your data (Full 12 Cols) */}
        <div className="lg:col-span-12">
          <Card as="section" id="sectionData" padding="lg" surface="lowest" className="space-y-4">
            <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-low text-secondary">
                <Download className="h-4 w-4" aria-hidden="true" />
              </div>
              <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
                Your data
              </h2>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => void handleRealExport('notes')}
                disabled={exportBusy !== null}
                className="flex w-full items-center justify-between rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-left transition-colors hover:bg-surface-container disabled:opacity-60 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-secondary" aria-hidden="true" />
                  <div>
                    <div className="font-sans text-body-sm font-medium text-on-surface">
                      Notes Markdown Archive
                    </div>
                    <div className="font-mono text-[11px] text-on-surface-variant">
                      .zip of markdown notes
                    </div>
                  </div>
                </div>
                <span className="font-mono text-label-sm text-secondary">
                  {exportBusy === 'notes' ? 'Exporting...' : 'Download'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleRealExport('csv')}
                disabled={exportBusy !== null}
                className="flex w-full items-center justify-between rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-left transition-colors hover:bg-surface-container disabled:opacity-60 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-4 w-4 text-secondary" aria-hidden="true" />
                  <div>
                    <div className="font-sans text-body-sm font-medium text-on-surface">
                      Spreadsheet Tables
                    </div>
                    <div className="font-mono text-[11px] text-on-surface-variant">
                      Expenses, assignments, tasks, habits (.zip CSV)
                    </div>
                  </div>
                </div>
                <span className="font-mono text-label-sm text-secondary">
                  {exportBusy === 'csv' ? 'Exporting...' : 'Download'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleRealExport('json')}
                disabled={exportBusy !== null}
                className="flex w-full items-center justify-between rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-left transition-colors hover:bg-surface-container disabled:opacity-60 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileJson className="h-4 w-4 text-secondary" aria-hidden="true" />
                  <div>
                    <div className="font-sans text-body-sm font-medium text-on-surface">
                      Full Account Snapshot
                    </div>
                    <div className="font-mono text-[11px] text-on-surface-variant">
                      Complete structured JSON backup
                    </div>
                  </div>
                </div>
                <span className="font-mono text-label-sm text-secondary">
                  {exportBusy === 'json' ? 'Exporting...' : 'Download'}
                </span>
              </button>
            </div>

            <div className="border-t border-outline-variant/30 pt-4">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-2.5 font-sans text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container cursor-pointer"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </Card>
        </div>
      </div>

      {/* Save Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-24 right-6 z-50 flex items-center gap-2 rounded-xl border border-secondary/30 bg-surface-container-lowest px-4 py-3 font-sans text-body-sm font-medium text-on-surface shadow-ambient"
        >
          <CheckCircle2 className="h-4 w-4 text-secondary" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
