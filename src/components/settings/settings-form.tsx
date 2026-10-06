'use client';

import React, { useState, useTransition } from 'react';
import type { Profile } from '@/types/database.types';
import { updateProfile, signOutAction } from '@/lib/actions/profile';
import {
  User,
  Coins,
  Palette,
  Wallet,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface SettingsFormProps {
  initialProfile: Profile;
  userEmail?: string;
}

const CURRENCIES = [
  { symbol: '₹', label: 'INR (₹ - Indian Rupee)' },
  { symbol: '$', label: 'USD ($ - US Dollar)' },
  { symbol: '€', label: 'EUR (€ - Euro)' },
  { symbol: '£', label: 'GBP (£ - British Pound)' },
];

const THEMES = [
  { id: 'stone', label: 'Warm Stone', description: 'Notion-inspired warm paper aesthetic' },
  { id: 'light', label: 'Pure Paper', description: 'Minimalist high-contrast light mode' },
  { id: 'dark', label: 'Obsidian', description: 'Deep slate for low-light focus' },
];

export function SettingsForm({ initialProfile, userEmail }: SettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialProfile.display_name || '');
  const [currencySymbol, setCurrencySymbol] = useState(initialProfile.currency_symbol || '₹');
  const [themePreference, setThemePreference] = useState(initialProfile.theme_preference || 'stone');
  const [allowanceTarget, setAllowanceTarget] = useState(
    initialProfile.monthly_allowance_target?.toString() || '15000'
  );

  const [isPending, startTransition] = useTransition();
  const [isSigningOut, startSignOutTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('displayName', displayName);
    formData.append('currencySymbol', currencySymbol);
    formData.append('themePreference', themePreference);
    formData.append('monthlyAllowanceTarget', allowanceTarget);

    startTransition(async () => {
      const res = await updateProfile(null, formData);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Workspace preferences updated successfully.' });
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to update preferences.' });
      }
    });
  };

  const handleSignOut = () => {
    startSignOutTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl">
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-secondary/10 border-secondary/30 text-on-surface'
              : 'bg-red-500/10 border-red-500/30 text-red-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-body-sm text-body-sm font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Personalization Section */}
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
            <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Student Profile
              </h2>
              <p className="font-body-sm text-body-sm text-outline">
                How your workspace addresses you across dashboard views and greetings.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="displayName" className="font-label-md text-label-md font-medium text-on-surface">
              Display Name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Aryan"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-outline/40 transition-all"
            />
          </div>
        </section>

        {/* Financial Preferences Section */}
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
            <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Financial Baseline
              </h2>
              <p className="font-body-sm text-body-sm text-outline">
                Configure your monthly student allowance pool and currency denomination.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="allowanceTarget" className="font-label-md text-label-md font-medium text-on-surface">
                Monthly Allowance Target
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-label-md text-outline font-semibold">
                  {currencySymbol}
                </span>
                <input
                  id="allowanceTarget"
                  name="allowanceTarget"
                  type="number"
                  step="100"
                  min="0"
                  value={allowanceTarget}
                  onChange={(e) => setAllowanceTarget(e.target.value)}
                  placeholder="15000"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-outline/40 transition-all"
                />
              </div>
              <span className="font-label-sm text-label-sm text-outline">
                Used to compute your safe daily spending pace and liquidity bar.
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="currencySymbol" className="font-label-md text-label-md font-medium text-on-surface">
                Currency Symbol
              </label>
              <select
                id="currencySymbol"
                name="currencySymbol"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-outline/40 transition-all"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.symbol} value={curr.symbol}>
                    {curr.label}
                  </option>
                ))}
              </select>
              <span className="font-label-sm text-label-sm text-outline">
                Formatted across dashboard widgets, financial telemetry, and ledgers.
              </span>
            </div>
          </div>
        </section>

        {/* Theme Preferences Section */}
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
            <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 text-outline" />
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Workspace Atmosphere
              </h2>
              <p className="font-body-sm text-body-sm text-outline">
                Choose the visual tone that maximizes your clarity and calm.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEMES.map((theme) => {
              const isSelected = themePreference === theme.id;
              return (
                <button
                  type="button"
                  key={theme.id}
                  onClick={() => setThemePreference(theme.id as 'stone' | 'light' | 'dark')}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-primary bg-surface-container-high/60 ring-1 ring-primary/30'
                      : 'border-outline-variant/20 bg-surface-container-low/40 hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                      {theme.label}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="font-label-sm text-label-sm text-outline leading-relaxed">
                    {theme.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-body-sm text-body-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Account Security & Sign Out Section */}
      <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-outline" />
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Account & Session
            </h2>
            <p className="font-body-sm text-body-sm text-outline">
              Managed via Google OAuth with server-side cookie authentication.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low/40 border border-outline-variant/20">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
              Signed in as
            </span>
            <span className="font-body-md text-body-md font-medium text-on-surface truncate">
              {userEmail || 'Active Student User'}
            </span>
            <span className="font-label-sm text-label-sm text-outline truncate">
              User ID: {initialProfile.id}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-600 hover:bg-red-500/10 hover:border-red-500/40 font-body-sm text-body-sm font-medium transition-all shrink-0 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
