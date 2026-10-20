'use client';

import React, { useState, useEffect, useTransition } from 'react';
import type { Profile } from '@/types/database.types';
import { updateProfile } from '@/lib/actions/profile';
import { saveTheme, applyThemeToDOM } from '@/lib/theme/use-theme';
import { getFullAccountExport } from '@/lib/actions/export';
import {
  formatNoteAsMarkdown,
  formatTransactionsCsv,
  formatAssignmentsCsv,
  formatTasksCsv,
  formatHabitsCsv,
  createZipArchive,
} from '@/lib/export/formatters';

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
  { code: 'INR', symbol: '₹', label: 'INR (₹ - Indian Rupee)' },
  { code: 'USD', symbol: '$', label: 'USD ($ - United States Dollar)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€ - Euro)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£ - British Pound)' },
];

function resolveCurrencyCode(symbol?: string | null): string {
  if (!symbol) return 'INR';
  const found = CURRENCY_OPTIONS.find((c) => c.symbol === symbol || c.code === symbol);
  return found ? found.code : 'INR';
}

function resolveCurrencySymbol(codeOrSymbol: string): string {
  const found = CURRENCY_OPTIONS.find((c) => c.code === codeOrSymbol || c.symbol === codeOrSymbol);
  return found ? found.symbol : '₹';
}

interface ThemeCardData {
  id: string;
  title: string;
  desc: string;
  dots: string[];
  mockupBg: string;
  mockupBorder: string;
  mockupDot: string;
  mockupBars: string;
  activeBorder: string;
  activeBg: string;
  activeDot: string;
  activeTitleColor: string;
  activeDescColor: string;
}

const THEMES: ThemeCardData[] = [
  {
    id: 'default',
    title: 'Default',
    desc: 'Warm paper aesthetic inspired by editorial journals & Notion simplicity.',
    dots: ['#FAF9F6', '#FFFFFF', '#1C1917'],
    mockupBg: '#F4F1EA',
    mockupBorder: 'border-stone-200/80',
    mockupDot: '#1C1917',
    mockupBars: 'bg-stone-300',
    activeBorder: '#1C1917',
    activeBg: '#FAF8F5',
    activeDot: '#1C1917',
    activeTitleColor: '#191919',
    activeDescColor: '#78716C',
  },
  {
    id: 'crimson-dark',
    title: 'Crimson Dark',
    desc: 'Deep obsidian canvas accented by crimson red and high-contrast cream.',
    dots: ['#09090B', '#131217', '#DC2626'],
    mockupBg: '#131217',
    mockupBorder: 'border-zinc-800',
    mockupDot: '#DC2626',
    mockupBars: 'bg-zinc-700',
    activeBorder: '#DC2626',
    activeBg: '#1D1822',
    activeDot: '#DC2626',
    activeTitleColor: '#FAF7F2',
    activeDescColor: '#A1A1AA',
  },
  {
    id: 'crimson-light',
    title: 'Crimson Light',
    desc: 'Crisp ivory foundation enriched with vivid crimson strokes & dark ink.',
    dots: ['#FAF8F5', '#FFF5F5', '#DC2626'],
    mockupBg: '#FFF5F5',
    mockupBorder: 'border-rose-100',
    mockupDot: '#DC2626',
    mockupBars: 'bg-rose-200',
    activeBorder: '#DC2626',
    activeBg: '#FFF5F5',
    activeDot: '#DC2626',
    activeTitleColor: '#18181B',
    activeDescColor: '#71717A',
  },
  {
    id: 'system',
    title: 'System Native',
    desc: 'Clean monochrome OS sync with modern cobalt blue highlights.',
    dots: ['#F4F4F5', '#FFFFFF', '#2563EB'],
    mockupBg: '#F4F4F5',
    mockupBorder: 'border-gray-200',
    mockupDot: '#2563EB',
    mockupBars: 'bg-gray-300',
    activeBorder: '#2563EB',
    activeBg: '#EFF6FF',
    activeDot: '#2563EB',
    activeTitleColor: '#111827',
    activeDescColor: '#4B5563',
  },
];

function getInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return 'ST';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return clean.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function BentoSettings({ initialProfile, userEmail }: BentoSettingsProps) {
  // 1. Form state with live synchronization
  const [displayName, setDisplayName] = useState<string>(initialProfile.display_name || 'Aryan');
  const [academicCohort, setAcademicCohort] = useState<string>('Sophomore · CS Major');
  const [allowanceTarget, setAllowanceTarget] = useState<string>(
    initialProfile.monthly_allowance_target?.toString() || '5000'
  );
  const [currencyCode, setCurrencyCode] = useState<string>(() =>
    resolveCurrencyCode(initialProfile.currency_symbol)
  );
  const [currencySymbol, setCurrencySymbol] = useState<string>(() =>
    resolveCurrencySymbol(initialProfile.currency_symbol || '₹')
  );
  const [themePreference, setThemePreference] = useState<string>(() => {
    const raw = initialProfile.theme_preference || 'default';
    if (raw === 'crimson-cream') return 'crimson-dark';
    if (raw === 'stone') return 'default';
    return raw;
  });

  // Navigation chips state
  const [activeChip, setActiveChip] = useState<string>('all');

  // UI status & toast state
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('Last synced 2m ago');
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState<boolean>(false);

  // Export micro-interaction states
  const [exportState, setExportState] = useState<{
    notes: 'idle' | 'downloading' | 'ready';
    csv: 'idle' | 'downloading' | 'ready';
    json: 'idle' | 'downloading' | 'ready';
  }>({
    notes: 'idle',
    csv: 'idle',
    json: 'idle',
  });

  // Client-side initialization (localStorage sync)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('lifeos_theme');
    if (savedTheme) {
      const normalized = savedTheme === 'crimson-cream' ? 'crimson-dark' : savedTheme;
      setThemePreference(normalized);
      applyThemeToDOM(normalized);
    }
    const savedCohort = localStorage.getItem('lifeos_academic_cohort');
    if (savedCohort) {
      setAcademicCohort(savedCohort);
    }
  }, []);

  // Safe pace calculations
  const parsedAllowance = parseFloat(allowanceTarget) || 0;
  const safePaceDaily = (parsedAllowance / 30).toFixed(2);
  const gaugeFillPercentage = Math.min(
    100,
    Math.max(15, Math.round((parsedAllowance / 5000) * 65))
  );

  // Trigger floating micro-toast
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2800);
  };

  // Switch Theme
  const handleSelectTheme = (themeId: string) => {
    setThemePreference(themeId);
    saveTheme(themeId);
    applyThemeToDOM(themeId);
    const themeObj = THEMES.find((t) => t.id === themeId);
    showToast(`Atmosphere set to: ${themeObj?.title || themeId}`);
  };

  // Currency change
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setCurrencyCode(code);
    const sym = resolveCurrencySymbol(code);
    setCurrencySymbol(sym);
  };

  // Reset Display Name
  const handleResetDisplayName = () => {
    setDisplayName('Aryan');
  };

  // Reset defaults handler
  const handleResetDefaults = () => {
    setDisplayName('Aryan');
    setAcademicCohort('Sophomore · CS Major');
    setAllowanceTarget('5000');
    setCurrencyCode('INR');
    setCurrencySymbol('₹');
    handleSelectTheme('default');
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifeos_academic_cohort', 'Sophomore · CS Major');
    }
    setSyncStatus('Restored defaults');
    showToast('Reset to default workspace settings');
  };

  // Primary Save Changes CTA
  const handleSaveChanges = () => {
    const formData = new FormData();
    formData.append('displayName', displayName.trim() || 'Student');
    formData.append('currencySymbol', currencySymbol);
    formData.append('themePreference', themePreference);
    formData.append('monthlyAllowanceTarget', allowanceTarget);

    if (typeof window !== 'undefined') {
      localStorage.setItem('lifeos_academic_cohort', academicCohort);
    }

    startTransition(async () => {
      try {
        const res = await updateProfile(null, formData);
        if (res.success) {
          setIsSavedSuccessfully(true);
          setSyncStatus('Last synced just now');
          const currentThemeTitle =
            THEMES.find((t) => t.id === themePreference)?.title || themePreference;
          showToast(`Preferences synced: ${currentThemeTitle}`);

          setTimeout(() => {
            setIsSavedSuccessfully(false);
          }, 1800);
        } else {
          showToast(res.error || 'Failed to save preferences.');
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Error updating preferences.');
      }
    });
  };

  // Quick navigation chip jump
  const handleNavigateChip = (sectionId: string, chipKey: string) => {
    setActiveChip(chipKey);
    if (sectionId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Trigger browser file download helper
  const triggerBrowserDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Real Export Action 1: Markdown Obsidian Vault
  const handleExportNotes = async () => {
    try {
      setExportState((prev) => ({ ...prev, notes: 'downloading' }));
      const res = await getFullAccountExport();
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to retrieve notes.');
      }

      const notes = res.data.notes;
      if (notes.length === 0) {
        showToast('No notes found to export.');
        setExportState((prev) => ({ ...prev, notes: 'ready' }));
        setTimeout(() => setExportState((prev) => ({ ...prev, notes: 'idle' })), 1500);
        return;
      }

      const files = notes.map((note) => {
        const cleanTitle = (note.title || 'Untitled')
          .replace(/[\\/:*?"<>|]/g, '-')
          .slice(0, 50)
          .trim();
        return {
          name: `${cleanTitle}.md`,
          content: formatNoteAsMarkdown(note),
        };
      });

      const zipBlob = createZipArchive(files);
      triggerBrowserDownload(
        zipBlob,
        `lifeos-obsidian-notes-${new Date().toISOString().slice(0, 10)}.zip`
      );
      setExportState((prev) => ({ ...prev, notes: 'ready' }));
      showToast(`Exported ${notes.length} Obsidian notes (.md)`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Export failed.');
      setExportState((prev) => ({ ...prev, notes: 'idle' }));
    } finally {
      setTimeout(() => setExportState((prev) => ({ ...prev, notes: 'idle' })), 1500);
    }
  };

  // Real Export Action 2: CSV Tables
  const handleExportCsv = async () => {
    try {
      setExportState((prev) => ({ ...prev, csv: 'downloading' }));
      const res = await getFullAccountExport();
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to fetch database tables.');
      }

      const files = [
        {
          name: 'transactions.csv',
          content: formatTransactionsCsv(res.data.transactions),
        },
        {
          name: 'assignments.csv',
          content: formatAssignmentsCsv(res.data.assignments),
        },
        {
          name: 'tasks.csv',
          content: formatTasksCsv(res.data.tasks),
        },
        {
          name: 'habits.csv',
          content: formatHabitsCsv(res.data.habits),
        },
      ];

      const zipBlob = createZipArchive(files);
      triggerBrowserDownload(
        zipBlob,
        `lifeos-tables-csv-${new Date().toISOString().slice(0, 10)}.zip`
      );
      setExportState((prev) => ({ ...prev, csv: 'ready' }));
      showToast('Exported CSV tables archive (.csv)');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'CSV export failed.');
      setExportState((prev) => ({ ...prev, csv: 'idle' }));
    } finally {
      setTimeout(() => setExportState((prev) => ({ ...prev, csv: 'idle' })), 1500);
    }
  };

  // Real Export Action 3: Full JSON Relational Snapshot
  const handleExportJson = async () => {
    try {
      setExportState((prev) => ({ ...prev, json: 'downloading' }));
      const res = await getFullAccountExport();
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to generate relational dump.');
      }

      const jsonStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      triggerBrowserDownload(
        blob,
        `lifeos-account-snapshot-${new Date().toISOString().slice(0, 10)}.json`
      );
      setExportState((prev) => ({ ...prev, json: 'ready' }));
      showToast('Downloaded full schema snapshot (.json)');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'JSON snapshot failed.');
      setExportState((prev) => ({ ...prev, json: 'idle' }));
    } finally {
      setTimeout(() => setExportState((prev) => ({ ...prev, json: 'idle' })), 1500);
    }
  };

  // Purge local cache handler
  const handlePurgeCache = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch {}
    }
    showToast('Local application cache purged successfully.');
  };

  const studentInitials = getInitials(displayName);

  return (
    <div className="w-full flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-8 theme-transition">
      {/* Top Workspace Header Banner & Filter Navigation Chips */}
      <div
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b theme-transition"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div>
          <div
            className="inline-flex items-center gap-2 mb-2 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border theme-transition"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse theme-transition"
              style={{ backgroundColor: 'var(--color-accent)' }}
            />
            WORKSPACE PREFERENCES · MULTI-TENANT
          </div>
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-1.5 theme-transition"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Settings &amp; Personalization
          </h1>
          <p
            className="text-sm font-normal theme-transition"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Calibrate your student identity, daily liquidity constraints, aesthetic atmosphere, and
            portable data vault.
          </p>
        </div>

        {/* Filter / Quick Jump Chips */}
        <div
          className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border self-start md:self-auto theme-transition"
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            borderColor: 'var(--color-border)',
          }}
        >
          <button
            type="button"
            onClick={() => handleNavigateChip('all', 'all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition theme-transition cursor-pointer ${
              activeChip === 'all' ? 'shadow-sm' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor:
                activeChip === 'all' ? 'var(--color-bg-card)' : 'transparent',
              color:
                activeChip === 'all'
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
            }}
          >
            All Settings
          </button>
          <button
            type="button"
            onClick={() => handleNavigateChip('sectionProfile', 'profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition theme-transition hover:opacity-80 cursor-pointer ${
              activeChip === 'profile' ? 'shadow-sm font-semibold' : ''
            }`}
            style={{
              backgroundColor:
                activeChip === 'profile' ? 'var(--color-bg-card)' : 'transparent',
              color:
                activeChip === 'profile'
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
            }}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => handleNavigateChip('sectionFinance', 'finance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition theme-transition hover:opacity-80 cursor-pointer ${
              activeChip === 'finance' ? 'shadow-sm font-semibold' : ''
            }`}
            style={{
              backgroundColor:
                activeChip === 'finance' ? 'var(--color-bg-card)' : 'transparent',
              color:
                activeChip === 'finance'
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
            }}
          >
            Finance
          </button>
          <button
            type="button"
            onClick={() => handleNavigateChip('sectionAtmosphere', 'atmosphere')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition theme-transition hover:opacity-80 cursor-pointer ${
              activeChip === 'atmosphere' ? 'shadow-sm font-semibold' : ''
            }`}
            style={{
              backgroundColor:
                activeChip === 'atmosphere' ? 'var(--color-bg-card)' : 'transparent',
              color:
                activeChip === 'atmosphere'
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
            }}
          >
            Atmosphere
          </button>
          <button
            type="button"
            onClick={() => handleNavigateChip('sectionVault', 'vault')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition theme-transition hover:opacity-80 cursor-pointer ${
              activeChip === 'vault' ? 'shadow-sm font-semibold' : ''
            }`}
            style={{
              backgroundColor:
                activeChip === 'vault' ? 'var(--color-bg-card)' : 'transparent',
              color:
                activeChip === 'vault'
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
            }}
          >
            Data Vault
          </button>
        </div>
      </div>

      {/* Bento Grid Container (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ============================================== */}
        {/* ROW 1 - COL 1: Student Identity & Profile (Col-span-5) */}
        {/* ============================================== */}
        <section
          id="sectionProfile"
          className="lg:col-span-5 rounded-2xl p-6 sm:p-7 shadow-card border theme-transition flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border-card)',
          }}
        >
          <div>
            {/* Card Header with Badges */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border theme-transition"
                  style={{
                    backgroundColor: 'var(--color-icon-bg)',
                    borderColor: 'var(--color-icon-border)',
                    color: 'var(--color-icon-fg)',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
                <div>
                  <h2
                    className="text-base font-semibold tracking-tight theme-transition"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Student Profile
                  </h2>
                  <p
                    className="text-xs theme-transition"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Workspace identity &amp; presence
                  </p>
                </div>
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border theme-transition"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-accent)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
                Active Sync
              </span>
            </div>

            {/* Student Persona Showcase */}
            <div
              className="flex items-center gap-4 p-4 rounded-xl border mb-5 theme-transition"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm theme-transition select-none"
                  style={{
                    backgroundColor: 'var(--color-btn-primary-bg)',
                    color: 'var(--color-btn-primary-text)',
                  }}
                >
                  {studentInitials}
                </div>
                <span
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  title="Online Status"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-semibold truncate theme-transition"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {displayName.trim() || 'Student'}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide border theme-transition"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    PRO
                  </span>
                </div>
                <p
                  className="text-xs mt-0.5 font-medium truncate theme-transition"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {academicCohort || 'Sophomore · CS Major'}
                </p>
                <p
                  className="text-[11px] font-mono mt-1 opacity-75 truncate theme-transition"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  ID: #STU-2027-0941
                </p>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-xs font-semibold uppercase tracking-wider mb-2 theme-transition"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Display Name
                </label>
                <div className="relative">
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full text-sm font-medium rounded-xl px-4 py-2.5 theme-transition pr-14"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      border: '1px solid var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="e.g. Aryan"
                  />
                  <button
                    type="button"
                    onClick={handleResetDisplayName}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-mono theme-transition hover:opacity-75 cursor-pointer"
                    style={{ color: 'var(--color-text-muted)' }}
                    title="Auto-detect system name"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="academicCohort"
                  className="block text-xs font-semibold uppercase tracking-wider mb-2 theme-transition"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Academic Cohort &amp; Tag
                </label>
                <input
                  id="academicCohort"
                  type="text"
                  value={academicCohort}
                  onChange={(e) => setAcademicCohort(e.target.value)}
                  className="w-full text-sm rounded-xl px-4 py-2.5 theme-transition"
                  style={{
                    backgroundColor: 'var(--color-input-bg)',
                    border: '1px solid var(--color-input-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="e.g. Sophomore · CS Major"
                />
              </div>
            </div>
          </div>

          {/* Quick footnote */}
          <div
            className="mt-6 pt-4 border-t flex items-center justify-between text-xs theme-transition"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span>Avatar generated from local initials</span>
            <button
              type="button"
              onClick={() => showToast('Initial avatar generated from display name.')}
              className="font-medium hover:underline text-xs cursor-pointer"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Change Picture
            </button>
          </div>
        </section>

        {/* ============================================== */}
        {/* ROW 1 - COL 2: Financial Baseline & Liquidity Engine (Col-span-7) */}
        {/* ============================================== */}
        <section
          id="sectionFinance"
          className="lg:col-span-7 rounded-2xl p-6 sm:p-7 shadow-card border theme-transition flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border-card)',
          }}
        >
          <div>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border theme-transition"
                  style={{
                    backgroundColor: 'var(--color-icon-bg)',
                    borderColor: 'var(--color-icon-border)',
                    color: 'var(--color-icon-fg)',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
                <div>
                  <h2
                    className="text-base font-semibold tracking-tight theme-transition"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Financial Baseline &amp; Liquidity Engine
                  </h2>
                  <p
                    className="text-xs theme-transition"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Student allowance target and safe-burn rate parameters
                  </p>
                </div>
              </div>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium border theme-transition"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                30-Day Cycle
              </span>
            </div>

            {/* 2-Column Responsive Form Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              {/* Monthly Allowance Field */}
              <div>
                <label
                  htmlFor="allowance"
                  className="block text-xs font-semibold uppercase tracking-wider mb-2 theme-transition"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Monthly Allowance Target
                </label>
                <div className="relative">
                  <span
                    className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-semibold theme-transition select-none pointer-events-none"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {currencySymbol}
                  </span>
                  <input
                    id="allowance"
                    type="number"
                    step="100"
                    min="0"
                    value={allowanceTarget}
                    onChange={(e) => setAllowanceTarget(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm sm:text-base font-medium rounded-xl theme-transition"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      border: '1px solid var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>
                <p
                  className="text-[11px] mt-1.5 font-mono theme-transition"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Allocated per calendar month
                </p>
              </div>

              {/* Currency Symbol Selection Field */}
              <div>
                <label
                  htmlFor="currency"
                  className="block text-xs font-semibold uppercase tracking-wider mb-2 theme-transition"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Currency Symbol
                </label>
                <div className="relative">
                  <select
                    id="currency"
                    value={currencyCode}
                    onChange={handleCurrencyChange}
                    className="w-full text-sm font-medium rounded-xl px-4 py-2.5 pr-10 appearance-none cursor-pointer theme-transition"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      border: '1px solid var(--color-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {CURRENCY_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M19 9l-7 7-7-7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>
                <p
                  className="text-[11px] mt-1.5 font-mono theme-transition"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Applied across ledger, widgets &amp; pace telemetry
                </p>
              </div>
            </div>

            {/* Integrated Live Liquidity Gauge Widget */}
            <div
              className="p-4 rounded-xl border theme-transition"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold uppercase tracking-wider theme-transition"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Calculated Safe Pace
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border theme-transition"
                      style={{
                        backgroundColor: 'var(--color-bg-card)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      Optimal Guardrail
                    </span>
                  </div>
                  <div
                    className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5 theme-transition"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {currencySymbol}
                    {safePaceDaily}{' '}
                    <span
                      className="text-xs font-normal"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      / day
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span
                    className="text-[11px] font-mono uppercase"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    End of Month Projection
                  </span>
                  <p
                    className="text-xs font-semibold theme-transition"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Zero Buffer · 100% Utilized
                  </p>
                </div>
              </div>

              {/* Progress / Safe liquidity gauge bar */}
              <div className="w-full bg-stone-200/70 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${gaugeFillPercentage}%`,
                    backgroundColor: 'var(--color-accent)',
                  }}
                />
              </div>
              <div
                className="flex justify-between items-center text-[10px] font-mono mt-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span>Day 1 ({currencySymbol}0 spent)</span>
                <span
                  className="font-semibold"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Target: 30 days safe pace
                </span>
                <span>
                  Day 30 ({currencySymbol}
                  {parsedAllowance.toLocaleString()} ceiling)
                </span>
              </div>
            </div>
          </div>

          <div
            className="mt-4 pt-3 border-t flex items-center justify-between text-xs theme-transition"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span>Auto-adjusts dynamically as days elapse in cycle</span>
            <span className="font-mono text-[11px]">Formula: Pool ÷ Remaining Days</span>
          </div>
        </section>

        {/* ============================================== */}
        {/* ROW 2 - COL 1: Workspace Atmosphere (Col-span-7) */}
        {/* ============================================== */}
        <section
          id="sectionAtmosphere"
          className="lg:col-span-7 rounded-2xl p-6 sm:p-7 shadow-card border theme-transition flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border-card)',
          }}
        >
          <div>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border theme-transition"
                  style={{
                    backgroundColor: 'var(--color-icon-bg)',
                    borderColor: 'var(--color-icon-border)',
                    color: 'var(--color-icon-fg)',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M7 21a4 4 0 01-4-4 5 5 0 015-5c.6 0 1.2.1 1.7.3.3-2.4 2.3-4.3 4.8-4.3 2.8 0 5 2.2 5 5 0 .3 0 .7-.1 1 1.6.4 2.8 1.8 2.8 3.5a4 4 0 01-4 4H7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
                <div>
                  <h2
                    className="text-base font-semibold tracking-tight theme-transition"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Workspace Atmosphere
                  </h2>
                  <p
                    className="text-xs theme-transition"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Curated visual skins crafted for focus, high contrast, and calm
                  </p>
                </div>
              </div>
              <span
                className="text-xs font-mono font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                4 Presets
              </span>
            </div>

            {/* 4-Theme Interactive Showcase Grid */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              role="radiogroup"
              aria-label="Visual Theme Options"
            >
              {THEMES.map((theme) => {
                const isSelected =
                  themePreference === theme.id ||
                  (theme.id === 'default' &&
                    (themePreference === 'stone' || !themePreference || themePreference === 'default'));

                return (
                  <div
                    key={theme.id}
                    role="radio"
                    tabIndex={0}
                    aria-checked={isSelected ? 'true' : 'false'}
                    onClick={() => handleSelectTheme(theme.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectTheme(theme.id);
                      }
                    }}
                    className={`rounded-xl p-4 cursor-pointer relative theme-transition flex flex-col justify-between transition-all select-none ${
                      isSelected
                        ? 'border-2 shadow-sm ring-1'
                        : 'border hover:border-stone-400/50'
                    }`}
                    style={{
                      borderColor: isSelected ? theme.activeBorder : 'var(--color-border)',
                      backgroundColor: isSelected ? theme.activeBg : 'var(--color-bg-card)',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            {theme.dots.map((dotColor, idx) => (
                              <span
                                key={idx}
                                className="w-3.5 h-3.5 rounded-full border border-stone-300/40"
                                style={{ backgroundColor: dotColor }}
                              />
                            ))}
                          </div>
                          <span
                            className="font-semibold text-xs sm:text-sm"
                            style={{
                              color: isSelected
                                ? theme.activeTitleColor
                                : 'var(--color-text-primary)',
                            }}
                          >
                            {theme.title}
                          </span>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full border flex items-center justify-center transition-all"
                          style={{
                            borderColor: isSelected ? theme.activeBorder : 'var(--color-border)',
                          }}
                        >
                          {isSelected && (
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: theme.activeDot }}
                            />
                          )}
                        </div>
                      </div>
                      <p
                        className="text-xs leading-relaxed font-normal mb-3"
                        style={{
                          color: isSelected
                            ? theme.activeDescColor
                            : 'var(--color-text-secondary)',
                        }}
                      >
                        {theme.desc}
                      </p>
                    </div>

                    {/* Mini mockup strip */}
                    <div
                      className={`h-6 rounded-md p-1 flex items-center gap-1.5 pointer-events-none border ${theme.mockupBorder}`}
                      style={{ backgroundColor: theme.mockupBg }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: theme.mockupDot }}
                      />
                      <span className={`h-1.5 w-12 rounded ${theme.mockupBars}`} />
                      <span className={`h-1.5 w-6 rounded ml-auto ${theme.mockupBars}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="mt-5 pt-3 border-t flex items-center justify-between text-xs theme-transition"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span>Auto-saves instantly to client storage</span>
            <span className="font-mono text-[11px]">Hardware Accelerated</span>
          </div>
        </section>

        {/* ============================================== */}
        {/* ROW 2 - COL 2: Data Ownership & Vault (Col-span-5) */}
        {/* ============================================== */}
        <section
          id="sectionVault"
          className="lg:col-span-5 rounded-2xl p-6 sm:p-7 shadow-card border theme-transition flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border-card)',
          }}
        >
          <div>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border theme-transition"
                  style={{
                    backgroundColor: 'var(--color-icon-bg)',
                    borderColor: 'var(--color-icon-border)',
                    color: 'var(--color-icon-fg)',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
                <div>
                  <h2
                    className="text-base font-semibold tracking-tight theme-transition"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Data Ownership &amp; Vault
                  </h2>
                  <p
                    className="text-xs theme-transition"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Zero cloud lock-in · 100% portable files
                  </p>
                </div>
              </div>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono border theme-transition"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Local First
              </span>
            </div>

            <p
              className="text-xs leading-relaxed mb-4 theme-transition"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Your notes, study logs, and ledger items belong exclusively to you. Export instant
              snapshots directly to disk.
            </p>

            {/* Compact Export Stack with File Sizes */}
            <div className="space-y-2.5">
              {/* Markdown Item */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between theme-transition hover:border-stone-400/50"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    .md
                  </div>
                  <div className="truncate">
                    <p
                      className="text-xs font-semibold theme-transition truncate"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Obsidian Vault
                    </p>
                    <p
                      className="text-[11px] font-mono theme-transition"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      YAML frontmatter · ~2.4 MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportNotes}
                  disabled={exportState.notes === 'downloading'}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition active:scale-95 theme-transition shrink-0 cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>
                    {exportState.notes === 'downloading'
                      ? 'Downloading...'
                      : exportState.notes === 'ready'
                      ? 'Ready ✓'
                      : 'Export'}
                  </span>
                </button>
              </div>

              {/* CSV Item */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between theme-transition hover:border-stone-400/50"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    .csv
                  </div>
                  <div className="truncate">
                    <p
                      className="text-xs font-semibold theme-transition truncate"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Spreadsheet Tables
                    </p>
                    <p
                      className="text-[11px] font-mono theme-transition"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Ledgers &amp; habits · ~480 KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={exportState.csv === 'downloading'}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition active:scale-95 theme-transition shrink-0 cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>
                    {exportState.csv === 'downloading'
                      ? 'Downloading...'
                      : exportState.csv === 'ready'
                      ? 'Ready ✓'
                      : 'Export'}
                  </span>
                </button>
              </div>

              {/* JSON Snapshot */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between theme-transition hover:border-stone-400/50"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    .json
                  </div>
                  <div className="truncate">
                    <p
                      className="text-xs font-semibold theme-transition truncate"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Full Schema Snapshot
                    </p>
                    <p
                      className="text-[11px] font-mono theme-transition"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Relational dump · ~3.8 MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportJson}
                  disabled={exportState.json === 'downloading'}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition active:scale-95 theme-transition shrink-0 cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>
                    {exportState.json === 'downloading'
                      ? 'Downloading...'
                      : exportState.json === 'ready'
                      ? 'Ready ✓'
                      : 'Export'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div
            className="mt-4 pt-3 border-t flex items-center justify-between text-xs theme-transition"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span>GDPR &amp; Open Standard Compliant</span>
            <button
              type="button"
              onClick={handlePurgeCache}
              className="font-medium hover:underline text-xs cursor-pointer"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Purge Cache
            </button>
          </div>
        </section>
      </div>

      {/* ============================================== */}
      {/* Fixed Bottom Floating Save Bar */}
      {/* ============================================== */}
      <div className="fixed bottom-24 inset-x-0 flex justify-center z-40 pointer-events-none px-4">
        <div
          className="pointer-events-auto backdrop-blur-md rounded-2xl border px-4 py-2.5 shadow-floating flex items-center gap-4 theme-transition animate-fade-in"
          style={{
            backgroundColor: 'var(--color-dock-bg)',
            borderColor: 'var(--color-dock-border)',
          }}
        >
          <div
            className="flex items-center gap-2 text-xs font-mono select-none"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-accent)' }}
            />
            <span className="hidden sm:inline">{syncStatus}</span>
            <span className="sm:hidden font-mono text-[11px]">Synced</span>
          </div>
          <div className="h-4 w-px" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-stone-200/50 dark:hover:bg-zinc-800/50 transition theme-transition cursor-pointer"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isPending}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 inline-flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isSavedSuccessfully ? 'scale-125' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--color-accent)' }}
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
              </svg>
              <span>
                {isPending
                  ? 'Saving...'
                  : isSavedSuccessfully
                  ? 'Saved!'
                  : 'Save Changes'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================== */}
      {/* Slide-Down Micro-Toast Notification */}
      {/* ============================================== */}
      <div
        aria-live="polite"
        className={`fixed top-5 right-5 z-50 transition-all duration-300 ease-out transform ${
          toastVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-[-100px] opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-floating border theme-transition"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      </div>
    </div>
  );
}
