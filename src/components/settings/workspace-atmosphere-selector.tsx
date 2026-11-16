'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { updateProfile } from '@/lib/actions/profile';
import { saveTheme, applyThemeToDOM } from '@/lib/theme/use-theme';
import type { Profile } from '@/types/database.types';

export interface ThemeOption {
  id: 'spatial-glass' | 'risograph' | 'nordic' | 'tui' | 'tactile';
  title: string;
  tagline: string;
  description: string;
  badge: string;
  activeRingColor: string;
  accentColor: string;
  swatches: string[];
  // Card Visual Preview Styling
  previewCardClass: string;
  previewBgClass: string;
  previewBorderClass: string;
  previewTextClass: string;
  previewTitleFontClass: string;
  previewMockup: React.ReactNode;
}

export const WORKSPACE_THEMES: ThemeOption[] = [
  {
    id: 'spatial-glass',
    title: 'Spatial Glassmorphism',
    tagline: 'Ambient Mesh & Frosted Specular Layers',
    description: 'Ambient gradient mesh backgrounds with translucent specular glass borders and soft ambient drop shadows.',
    badge: 'Spatial UI',
    activeRingColor: '#6366F1',
    accentColor: '#6366F1',
    swatches: ['#0C0E14', 'rgba(255,255,255,0.4)', '#6366F1'],
    previewCardClass: 'bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900/50 backdrop-blur-xl border-white/40 shadow-[0_8px_32px_0_rgba(99,102,241,0.15)] text-slate-100',
    previewBgClass: 'bg-indigo-950/30',
    previewBorderClass: 'border-white/40',
    previewTextClass: 'text-slate-300',
    previewTitleFontClass: 'font-sans font-semibold tracking-tight text-white',
    previewMockup: (
      <div className="relative w-full h-14 rounded-lg bg-white/10 backdrop-blur-md border border-white/30 p-2 flex flex-col justify-between overflow-hidden shadow-inner">
        <div className="absolute -right-4 -top-4 w-12 h-12 rounded-full bg-indigo-500/30 blur-lg pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="text-[10px] font-mono tracking-tight text-indigo-200">glass.mesh</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/15 text-white/90 border border-white/20">blur-xl</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-12 rounded-full bg-white/40" />
          <div className="h-1.5 w-6 rounded-full bg-white/20" />
        </div>
      </div>
    ),
  },
  {
    id: 'risograph',
    title: 'Risograph Editorial',
    tagline: 'Warm Raw Linen & Duotone Inks',
    description: 'Warm raw linen canvas, rich duotone ink accents (#1E293B & #E11D48), and bold editorial serif typography.',
    badge: 'Editorial Press',
    activeRingColor: '#E11D48',
    accentColor: '#E11D48',
    swatches: ['#F7F4EE', '#1E293B', '#E11D48'],
    previewCardClass: 'bg-[#F7F4EE] border-[#1E293B]/20 shadow-[0_2px_8px_rgba(30,41,59,0.06)] text-[#1E293B]',
    previewBgClass: 'bg-[#F7F4EE]',
    previewBorderClass: 'border-[#1E293B]/20',
    previewTextClass: 'text-[#475569]',
    previewTitleFontClass: 'font-serif font-bold tracking-tight text-[#1E293B] text-base',
    previewMockup: (
      <div className="relative w-full h-14 rounded-md bg-[#FFFDF8] border border-[#1E293B]/20 p-2 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
            <span className="font-serif italic text-[11px] font-semibold text-[#1E293B]">Vol. 04</span>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#E11D48] font-bold">RISO INK</span>
        </div>
        <div className="flex items-center gap-1.5 border-t border-[#1E293B]/10 pt-1.5">
          <div className="h-1.5 w-14 rounded-none bg-[#1E293B]" />
          <div className="h-1.5 w-8 rounded-none bg-[#E11D48]/70" />
        </div>
      </div>
    ),
  },
  {
    id: 'nordic',
    title: 'Nordic Ceramic & Linen',
    tagline: 'Soft Oat Canvas & Desaturated Sage',
    description: 'Soft oat canvas with ivory ceramic cards, desaturated moss sage (#4A6B5D), and extra-rounded contours.',
    badge: 'Stoneware Calm',
    activeRingColor: '#4A6B5D',
    accentColor: '#4A6B5D',
    swatches: ['#F3F0E8', '#FAF8F5', '#4A6B5D'],
    previewCardClass: 'bg-[#F3F0E8] border-stone-300/40 rounded-3xl shadow-[0_4px_16px_rgba(74,107,93,0.06)] text-stone-800',
    previewBgClass: 'bg-[#F3F0E8]',
    previewBorderClass: 'border-stone-300/40',
    previewTextClass: 'text-stone-600',
    previewTitleFontClass: 'font-sans font-medium text-stone-900 tracking-normal',
    previewMockup: (
      <div className="relative w-full h-14 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 p-2 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4A6B5D]" />
            <span className="text-[10px] font-medium text-stone-700">Ceramic Ivory</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#4A6B5D]/10 text-[#4A6B5D] font-medium">rounded-3xl</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-10 rounded-full bg-[#4A6B5D]" />
          <div className="h-1.5 w-10 rounded-full bg-stone-300" />
        </div>
      </div>
    ),
  },
  {
    id: 'tui',
    title: 'TUI / Terminal',
    tagline: 'Deep Matte Slate & Emerald Phosphor',
    description: 'Deep matte slate canvas (#0C0D10) with monochromatic surface cards (zinc-900/40) and crisp terminal green (#10B981).',
    badge: 'CLI Matrix',
    activeRingColor: '#10B981',
    accentColor: '#10B981',
    swatches: ['#0C0D10', '#13151B', '#10B981'],
    previewCardClass: 'bg-[#0C0D10] border-[#1E222B] shadow-inner text-emerald-400 rounded-md',
    previewBgClass: 'bg-[#0C0D10]',
    previewBorderClass: 'border-[#1E222B]',
    previewTextClass: 'text-zinc-400',
    previewTitleFontClass: 'font-mono font-semibold text-emerald-400 tracking-wider text-xs uppercase',
    previewMockup: (
      <div className="relative w-full h-14 rounded bg-[#13151B] border border-[#1E222B] p-2 flex flex-col justify-between font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_6px_#10B981]" />
            <span className="text-[10px] text-[#10B981] font-mono tracking-tight">&gt; lifeos --tui</span>
          </div>
          <span className="text-[8px] px-1 bg-emerald-950 text-[#10B981] border border-emerald-800/40 rounded-none font-mono">1px GRID</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-mono">
          <span className="text-emerald-500/80">$</span>
          <span>sys.render(slate_10)</span>
          <span className="inline-block w-1.5 h-2 bg-[#10B981] animate-pulse ml-auto" />
        </div>
      </div>
    ),
  },
  {
    id: 'tactile',
    title: 'Tactile Functionalism',
    tagline: 'Appliance-White & Recessed Hardware',
    description: 'Matte appliance-white (#F8F8F8) with physically recessed hardware toggles and signal-orange hardware dot accents.',
    badge: 'Braun / Dieter',
    activeRingColor: '#FF5722',
    accentColor: '#FF5722',
    swatches: ['#F8F8F8', '#E4E4E7', '#FF5722'],
    previewCardClass: 'bg-[#F8F8F8] border-stone-300 text-neutral-900 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
    previewBgClass: 'bg-[#F8F8F8]',
    previewBorderClass: 'border-stone-300',
    previewTextClass: 'text-neutral-600',
    previewTitleFontClass: 'font-sans font-bold text-neutral-950 tracking-tight',
    previewMockup: (
      <div className="relative w-full h-14 rounded-lg bg-[#FFFFFF] border border-[#D4D4D8] p-2 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5722] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_1px_2px_rgba(255,87,34,0.4)]" />
            <span className="text-[10px] font-bold text-neutral-800 tracking-tight">TOGGLE 01</span>
          </div>
          <div className="w-8 h-3.5 rounded-full bg-[#F4F4F5] border border-[#D4D4D8] shadow-[inset_0_2px_3px_rgba(0,0,0,0.12)] p-0.5 flex items-center justify-end">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5722] shadow-sm" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-10 rounded bg-neutral-300 shadow-[inset_0_1px_1px_rgba(0,0,0,0.1)]" />
          <div className="h-1.5 w-6 rounded bg-[#FF5722]/80" />
        </div>
      </div>
    ),
  },
];

export interface WorkspaceAtmosphereSelectorProps {
  initialTheme?: string | null;
  profile?: Profile | null;
  onThemeChanged?: (themeId: string) => void;
  className?: string;
}

export function WorkspaceAtmosphereSelector({
  initialTheme = 'nordic',
  profile,
  onThemeChanged,
  className = '',
}: WorkspaceAtmosphereSelectorProps) {
  // Normalize incoming theme
  const normalizeTheme = (raw?: string | null): ThemeOption['id'] => {
    if (!raw) return 'nordic';
    if (raw === 'spatial-glass') return 'spatial-glass';
    if (raw === 'risograph' || raw === 'crimson-dark' || raw === 'crimson-cream' || raw === 'crimson-light') {
      return 'risograph';
    }
    if (raw === 'tui' || raw === 'dark') return 'tui';
    if (raw === 'tactile') return 'tactile';
    return 'nordic';
  };

  const [activeTheme, setActiveTheme] = useState<ThemeOption['id']>(() => normalizeTheme(initialTheme));
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync client state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('lifeos_theme');
    if (stored) {
      const normalized = normalizeTheme(stored);
      setActiveTheme(normalized);
      applyThemeToDOM(normalized);
    } else if (initialTheme) {
      const normalized = normalizeTheme(initialTheme);
      setActiveTheme(normalized);
      applyThemeToDOM(normalized);
    }
  }, [initialTheme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const handleSelectTheme = (themeId: ThemeOption['id']) => {
    // 1. Instant optimistic DOM update & localStorage sync
    setActiveTheme(themeId);
    applyThemeToDOM(themeId);
    saveTheme(themeId);

    const themeObj = WORKSPACE_THEMES.find((t) => t.id === themeId);
    showToast(`Atmosphere switched to: ${themeObj?.title || themeId}`);
    onThemeChanged?.(themeId);

    // 2. Persist to Supabase public.profiles (theme_preference)
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('themePreference', themeId);
        if (profile?.display_name) {
          formData.append('displayName', profile.display_name);
        }
        if (profile?.currency_symbol) {
          formData.append('currencySymbol', profile.currency_symbol);
        }
        if (profile?.monthly_allowance_target) {
          formData.append('monthlyAllowanceTarget', String(profile.monthly_allowance_target));
        }

        const res = await updateProfile(null, formData);
        if (!res.success) {
          console.warn('Note: Profile theme sync fallback applied:', res.error);
        }
      } catch (err) {
        console.error('Failed to sync theme preference to profile:', err);
      }
    });
  };

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed top-14 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900/90 dark:bg-zinc-100/95 text-stone-50 dark:text-zinc-900 text-xs font-medium shadow-lg backdrop-blur-md pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5-Card Responsive Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        role="radiogroup"
        aria-label="Workspace Atmosphere Presets"
      >
        {WORKSPACE_THEMES.map((theme) => {
          const isSelected = activeTheme === theme.id;

          return (
            <motion.div
              key={theme.id}
              role="radio"
              tabIndex={0}
              aria-checked={isSelected}
              onClick={() => handleSelectTheme(theme.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectTheme(theme.id);
                }
              }}
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`relative cursor-pointer select-none rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 border ${theme.previewCardClass} ${
                isSelected
                  ? 'ring-2 shadow-md'
                  : 'hover:shadow-sm opacity-90 hover:opacity-100'
              }`}
              style={{
                borderColor: isSelected ? theme.activeRingColor : undefined,
              }}
            >
              {/* Active-state indicator ring via Framer Motion */}
              {isSelected && (
                <motion.div
                  layoutId="active-theme-ring"
                  className="absolute -inset-1 rounded-[1.125rem] border-2 pointer-events-none"
                  style={{ borderColor: theme.activeRingColor }}
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}

              {/* Top Row: Palette Swatches & Selection Radio Pill */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex -space-x-1.5 items-center">
                    {theme.swatches.map((color, idx) => (
                      <span
                        key={idx}
                        className="w-4 h-4 rounded-full border border-black/15 shadow-xs"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 opacity-75">
                      {theme.badge}
                    </span>
                    <div
                      className="w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0"
                      style={{
                        borderColor: isSelected ? theme.accentColor : 'rgba(120,120,120,0.4)',
                        backgroundColor: isSelected ? theme.accentColor : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="active-radio-check"
                          className="w-1.5 h-1.5 rounded-full bg-white"
                          transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Theme Title with authentic typography preview */}
                <h3 className={`text-sm mb-1 leading-snug ${theme.previewTitleFontClass}`}>
                  {theme.title}
                </h3>

                {/* Subtitle / Tagline */}
                <p className={`text-[11px] leading-relaxed mb-3 line-clamp-2 ${theme.previewTextClass}`}>
                  {theme.tagline}
                </p>
              </div>

              {/* Theme Mockup Visual Preview Strip */}
              <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                {theme.previewMockup}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Info Strip */}
      <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Updates <code className="font-mono text-[11px] bg-stone-100 dark:bg-zinc-800 px-1 py-0.5 rounded">data-theme</code> root and syncs to Postgres profile</span>
        </span>
        <span className="font-mono text-[11px] text-stone-400 dark:text-zinc-500">
          5 Atmosphere Presets Active {isPending && '· Syncing...'}
        </span>
      </div>
    </div>
  );
}
