import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DeleteAccountModal, purgeLocalUserData } from '@/components/settings/delete-account-modal';
import { BentoSettings } from '@/components/settings/bento-settings';
import type { Profile } from '@/types/database.types';

vi.mock('@/lib/actions/profile', () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
  updateUserProfile: vi.fn().mockResolvedValue({ success: true }),
  signOutAction: vi.fn().mockResolvedValue(undefined),
  deleteAccountAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/actions/export', () => ({
  getFullAccountExport: vi.fn().mockResolvedValue({
    success: true,
    data: { notes: [], transactions: [], assignments: [], tasks: [], habits: [] },
  }),
}));

const mockProfile: Profile = {
  id: 'test-user-id',
  display_name: 'Maya Patel',
  theme_preference: 'dark',
  currency_symbol: '₹',
  monthly_allowance_target: 5000,
  daily_focus_goal_minutes: 240,
  timezone: 'Asia/Kolkata',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('DeleteAccountModal and Purge Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('purgeLocalUserData', () => {
    it('purges all lifeos_ prefixed keys, theme, and offline queues from localStorage', () => {
      const mockStorage: Record<string, string> = {
        lifeos_theme: 'monsoon-night',
        theme: 'dark',
        lifeos_dock_visible: 'true',
        lifeos_quick_capture_queue_v1: '[]',
        lifeos_focus_timer_v1: '{}',
        lifeos_display_name: 'Maya',
        unrelated_key: 'preserve_me',
      };

      const originalLocalStorage = global.localStorage;
      (global as unknown as { localStorage: unknown }).localStorage = {
        getItem: (k: string) => mockStorage[k] ?? null,
        setItem: (k: string, v: string) => {
          mockStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete mockStorage[k];
        },
        clear: () => {
          for (const k of Object.keys(mockStorage)) delete mockStorage[k];
        },
        get length() {
          return Object.keys(mockStorage).length;
        },
        key: (i: number) => Object.keys(mockStorage)[i] ?? null,
      };

      // Mock Object.keys(window.localStorage)
      const originalWindow = global.window;
      (global as unknown as { window: unknown }).window = {
        localStorage: global.localStorage,
      };

      purgeLocalUserData();

      expect(mockStorage.lifeos_theme).toBeUndefined();
      expect(mockStorage.theme).toBeUndefined();
      expect(mockStorage.lifeos_dock_visible).toBeUndefined();
      expect(mockStorage.lifeos_quick_capture_queue_v1).toBeUndefined();
      expect(mockStorage.lifeos_focus_timer_v1).toBeUndefined();
      expect(mockStorage.lifeos_display_name).toBeUndefined();
      expect(mockStorage.unrelated_key).toBe('preserve_me');

      global.localStorage = originalLocalStorage;
      global.window = originalWindow;
    });
  });

  describe('DeleteAccountModal Rendering', () => {
    it('renders nothing when closed', () => {
      const html = renderToString(
        <DeleteAccountModal
          open={false}
          onClose={() => undefined}
          userEmail="maya@university.edu"
          onDownloadBackup={async () => undefined}
        />
      );
      expect(html).toBe('');
    });

    it('renders Step 1 with warning, data breakdown list, and backup shortcut button when open', () => {
      const html = renderToString(
        <DeleteAccountModal
          open={true}
          onClose={() => undefined}
          userEmail="maya@university.edu"
          onDownloadBackup={async () => undefined}
          isBackingUp={false}
        />
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('Delete Account &amp; Data');
      expect(html).toContain('The following will be deleted:');
      expect(html).toContain('Coursework, assignments, and grade records');
      expect(html).toContain('Financial transactions, categories, and allowance settings');
      expect(html).toContain('Habits, streak counters, and daily reflection logs');
      expect(html).toContain('Download Backup');
      expect(html).toContain('Continue to Confirmation');
      expect(html).toContain('Cancel');
    });

    it('renders downloading state on the backup shortcut button when isBackingUp is true', () => {
      const html = renderToString(
        <DeleteAccountModal
          open={true}
          onClose={() => undefined}
          userEmail="maya@university.edu"
          onDownloadBackup={async () => undefined}
          isBackingUp={true}
        />
      );

      expect(html).toContain('Downloading...');
      expect(html).toContain('animate-spin');
    });
  });

  describe('BentoSettings Integration', () => {
    it('renders Sign Out and Delete account side by side in the Your Data card', () => {
      const html = renderToString(
        <BentoSettings initialProfile={mockProfile} userEmail="maya@university.edu" />
      );

      expect(html).toContain('Sign Out');
      expect(html).toContain('Delete account');
      expect(html).toContain('border-error/50');
      expect(html).toContain('text-error');
    });
  });
});
