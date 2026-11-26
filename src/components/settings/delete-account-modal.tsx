'use client';

import React, { useState } from 'react';
import { AlertTriangle, Download, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { deleteAccountAction } from '@/lib/actions/profile';

export interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  onDownloadBackup: () => Promise<void>;
  isBackingUp?: boolean;
}

/**
 * Purges all LifeOS browser storage keys upon permanent account deletion.
 */
export function purgeLocalUserData() {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove = [
      'lifeos_theme',
      'theme',
      'lifeos_quick_capture_queue_v1',
      'lifeos_quick_capture_synced_v1',
      'lifeos_quick_capture_inflight_v1',
      'lifeos_quick_capture_lock',
      'lifeos_focus_timer_v1',
      'lifeos_focus_date',
      'lifeos_focus_seconds_today',
      'lifeos_focus_sprints_today',
      'lifeos_dock_visible',
      'lifeos_display_name',
      'lifeos_desk_jotter',
      'lifeos_active_tab',
    ];
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
    const allKeys = Object.keys(window.localStorage);
    for (const key of allKeys) {
      if (key.startsWith('lifeos_')) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage quota / private browsing errors
  }
}

export function DeleteAccountModal({
  open,
  onClose,
  userEmail,
  onDownloadBackup,
  isBackingUp = false,
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Safe close handler: strictly blocks cancellation while delete is in flight
  const handleClose = () => {
    if (isDeleting) return;
    setStep(1);
    setConfirmationInput('');
    setDeleteError(null);
    setHasSubmitted(false);
    onClose();
  };

  const normalizedInput = confirmationInput.trim().toLowerCase();
  const normalizedEmail = userEmail.trim().toLowerCase();
  const isMatch =
    normalizedInput === 'delete' ||
    (normalizedEmail.length > 0 && normalizedInput === normalizedEmail);

  const handleDelete = async () => {
    if (!isMatch || isDeleting || hasSubmitted) return;

    setHasSubmitted(true);
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteAccountAction(confirmationInput);
      if (!res.success) {
        setDeleteError(res.error || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
        setHasSubmitted(false);
        return;
      }

      // Purge local storage and redirect to login with deleted notice
      purgeLocalUserData();
      window.location.href = '/login?notice=account-deleted';
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred during account deletion.';
      setDeleteError(message);
      setIsDeleting(false);
      setHasSubmitted(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      showCloseButton={!isDeleting}
      closeOnBackdrop={!isDeleting}
      maxWidth="md"
    >
      {step === 1 ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-error/10 text-error">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
                Delete Account & Data
              </h2>
              <p className="mt-1 font-sans text-body-sm text-outline">
                This action is permanent and cannot be undone. All your data will be permanently purged.
              </p>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 space-y-2">
            <div className="font-sans text-body-xs font-semibold text-on-surface uppercase tracking-wider">
              The following will be deleted:
            </div>
            <ul className="space-y-1.5 font-sans text-body-sm text-on-surface-variant list-disc pl-5">
              <li>Coursework, assignments, and grade records</li>
              <li>Tasks, projects, and capture items</li>
              <li>Financial transactions, categories, and allowance settings</li>
              <li>Habits, streak counters, and daily reflection logs</li>
              <li>Focus sessions, timers, and telemetry metrics</li>
              <li>Student profile, custom themes, and preferences</li>
            </ul>
          </div>

          {/* Backup Shortcut Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-4">
            <div>
              <div className="font-sans text-body-sm font-medium text-on-surface">
                Download a backup first?
              </div>
              <div className="font-sans text-body-xs text-outline">
                Save a full JSON snapshot of your data before deleting.
              </div>
            </div>
            <button
              type="button"
              onClick={onDownloadBackup}
              disabled={isBackingUp}
              className="inline-flex items-center gap-2 rounded-lg border border-secondary/40 bg-surface-container-lowest px-3 py-1.5 font-sans text-label-sm font-medium text-secondary hover:bg-secondary/10 transition-colors disabled:opacity-60 cursor-pointer shrink-0"
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Download Backup</span>
                </>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-2 font-sans text-body-sm font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl border border-error/50 bg-error px-4 py-2 font-sans text-body-sm font-medium text-on-error hover:bg-error/90 transition-colors cursor-pointer"
            >
              Continue to Confirmation
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-error/10 text-error">
              <Trash2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-sans text-headline-sm font-semibold text-on-surface">
                Confirm Account Deletion
              </h2>
              <p className="mt-1 font-sans text-body-sm text-outline">
                To proceed, type your account email (<strong className="font-semibold text-on-surface">{userEmail}</strong>) or <strong className="font-semibold text-on-surface">DELETE</strong> below.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {deleteError && (
            <div
              role="alert"
              className="rounded-xl border border-error/40 bg-error-container p-3 font-sans text-body-sm text-on-error-container"
            >
              {deleteError}
            </div>
          )}

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label
              htmlFor="confirmationInput"
              className="font-sans text-label-md font-medium text-on-surface block"
            >
              Confirmation
            </label>
            <input
              id="confirmationInput"
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              disabled={isDeleting}
              placeholder={`Type ${userEmail || 'DELETE'}`}
              autoFocus
              className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-2.5 font-sans text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-error/40 focus:border-error transition-all disabled:opacity-60"
            />
          </div>

          {/* Google Permissions Advisory Note */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3 font-sans text-body-xs text-outline leading-relaxed">
            Note: LifeOS access can also be permanently revoked from your Google Account permissions at{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary underline hover:opacity-80"
            >
              myaccount.google.com/permissions
            </a>.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 font-sans text-body-sm font-medium text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-2 font-sans text-body-sm font-medium text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!isMatch || isDeleting || hasSubmitted}
                className="inline-flex items-center gap-2 rounded-xl border border-error/50 bg-error px-4 py-2 font-sans text-body-sm font-medium text-on-error hover:bg-error/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Deleting everything...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span>Delete everything</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
