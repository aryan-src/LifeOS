/**
 * Offline Quick-Capture Queue Manager
 * Persists queued captures in localStorage when offline or network drops,
 * and flushes them in FIFO order upon network reconnection without duplicates.
 */

import type { ActionResponse } from '@/types/action.types';

export const QUEUE_STORAGE_KEY = 'lifeos_offline_capture_queue';
export const SYNCED_STORAGE_KEY = 'lifeos_synced_capture_ids';
export const QUEUE_LOCK_NAME = 'lifeos_offline_capture_queue_lock';
export const LOCK_STORAGE_KEY = 'lifeos_offline_capture_lock';
export const INFLIGHT_STORAGE_KEY = 'lifeos_offline_inflight_ids';

const LOCK_TIMEOUT_MS = 10000;

export interface QueuedCaptureItem {
  id: string;
  rawInput: string;
  createdAt: string;
}

/**
 * Returns true if the browser is currently reported as offline.
 */
export function isBrowserOffline(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return !navigator.onLine;
}

/**
 * Format count as plain text: "N waiting to sync"
 */
export function formatWaitingToSync(count: number): string {
  if (count <= 0) return '';
  return `${count} waiting to sync`;
}

/**
 * Retrieves all currently queued quick-capture items from localStorage.
 */
export function getQueuedCaptures(): QueuedCaptureItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedCaptureItem[]) : [];
  } catch (err) {
    console.error('Failed to parse offline capture queue:', err);
    return [];
  }
}

/**
 * Retrieves set of IDs that have already been saved to prevent duplicates on replay.
 */
export function getSyncedCaptureIds(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SYNCED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/**
 * Marks a capture ID as synced.
 */
export function markCaptureAsSynced(id: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const set = getSyncedCaptureIds();
    set.add(id);
    localStorage.setItem(SYNCED_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

/**
 * Retrieves set of IDs currently in-flight across tabs.
 */
export function getInFlightCaptureIds(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(INFLIGHT_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/**
 * Marks a capture ID as currently in-flight across tabs.
 */
export function markCaptureAsInFlight(id: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const set = getInFlightCaptureIds();
    set.add(id);
    localStorage.setItem(INFLIGHT_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

/**
 * Unmarks a capture ID from in-flight status.
 */
export function unmarkCaptureAsInFlight(id: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const set = getInFlightCaptureIds();
    set.delete(id);
    localStorage.setItem(INFLIGHT_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

/**
 * Tries to acquire a cross-tab lock in localStorage.
 * Used as a fallback when the browser Web Locks API (navigator.locks) is not available.
 */
export function tryAcquireStorageLock(lockId: string): boolean {
  if (typeof localStorage === 'undefined') return true;
  try {
    const now = Date.now();
    const raw = localStorage.getItem(LOCK_STORAGE_KEY);
    if (raw) {
      try {
        const existing = JSON.parse(raw);
        if (
          existing &&
          typeof existing.expiresAt === 'number' &&
          existing.expiresAt > now &&
          existing.id !== lockId
        ) {
          return false;
        }
      } catch {
        // Corrupted JSON, proceed to overwrite
      }
    }
    localStorage.setItem(
      LOCK_STORAGE_KEY,
      JSON.stringify({ id: lockId, expiresAt: now + LOCK_TIMEOUT_MS })
    );
    const verify = localStorage.getItem(LOCK_STORAGE_KEY);
    if (verify) {
      const parsed = JSON.parse(verify);
      return parsed.id === lockId;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Releases the cross-tab lock in localStorage if held by lockId.
 */
export function releaseStorageLock(lockId: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCK_STORAGE_KEY);
    if (raw) {
      const existing = JSON.parse(raw);
      if (existing?.id === lockId) {
        localStorage.removeItem(LOCK_STORAGE_KEY);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Executes an async action with cross-tab mutual exclusion.
 * Uses navigator.locks when available (supported in modern browsers),
 * falling back to an expiring localStorage mutex for environments without Web Locks.
 */
export async function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  // 1. Modern Web Locks API (Chrome 69+, Safari 15.4+, Firefox 96+, Edge 79+)
  if (
    typeof navigator !== 'undefined' &&
    navigator.locks &&
    typeof navigator.locks.request === 'function'
  ) {
    return await navigator.locks.request(QUEUE_LOCK_NAME, fn);
  }

  // 2. Cross-tab localStorage fallback with backoff polling
  const lockId = `lock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const startTime = Date.now();
  const WAIT_TIMEOUT_MS = 6000;

  while (!tryAcquireStorageLock(lockId)) {
    if (Date.now() - startTime > WAIT_TIMEOUT_MS) {
      // Avoid deadlocking forever if a previous process crashed without releasing
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  try {
    return await fn();
  } finally {
    releaseStorageLock(lockId);
  }
}

/**
 * Appends a new rawInput to the offline queue with a client-generated ID.
 */
export function queueCapture(rawInput: string, customId?: string): QueuedCaptureItem {
  const generatedId =
    customId ||
    (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `queue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  const item: QueuedCaptureItem = {
    id: generatedId,
    rawInput: rawInput.trim(),
    createdAt: new Date().toISOString(),
  };

  if (typeof localStorage !== 'undefined') {
    try {
      const current = getQueuedCaptures();
      current.push(item);
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(current));
    } catch (err) {
      console.error('Failed to append to offline capture queue:', err);
    }
  }

  return item;
}

/**
 * Removes a specific item from the queue by ID.
 */
export function removeQueuedCapture(id: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const current = getQueuedCaptures();
    const filtered = current.filter((item) => item.id !== id);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to remove item from offline queue:', err);
  }
}

/**
 * Clears the entire offline queue, synced ids set, lock, and inflight states.
 */
export function clearQueuedCaptures(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
    localStorage.removeItem(SYNCED_STORAGE_KEY);
    localStorage.removeItem(LOCK_STORAGE_KEY);
    localStorage.removeItem(INFLIGHT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear offline capture queue:', err);
  }
}

/**
 * Flushes all queued items in FIFO order using the provided server action dispatcher.
 * Protected by cross-tab locking (navigator.locks with localStorage mutex fallback)
 * and in-flight tracking so concurrent tabs never dispatch the same item twice.
 * Removes an item from the queue ONLY after the server confirms the save.
 * Returns the count of successfully synced and failed items.
 */
export async function flushQueuedCaptures(
  dispatcher: (input: string) => Promise<ActionResponse<unknown>>
): Promise<{ synced: number; failed: number }> {
  return await withCrossTabLock(async () => {
    // Re-fetch queue and synced IDs from storage after acquiring lock
    const queue = getQueuedCaptures();
    if (queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    const syncedIds = getSyncedCaptureIds();
    const inFlightIds = getInFlightCaptureIds();

    for (const item of queue) {
      // 1. If already saved on server: skip re-dispatching to prevent duplicate record
      if (syncedIds.has(item.id)) {
        removeQueuedCapture(item.id);
        synced++;
        continue;
      }

      // 2. If another tab or concurrent runner has this item in flight: skip
      if (inFlightIds.has(item.id)) {
        continue;
      }

      // Mark in-flight before network request
      markCaptureAsInFlight(item.id);

      try {
        const res = await dispatcher(item.rawInput);
        if (res.success) {
          // Server confirmed the save: mark as synced, remove from queue
          markCaptureAsSynced(item.id);
          removeQueuedCapture(item.id);
          synced++;
        } else {
          // Server rejected or network failed: leave in queue for future retry
          failed++;
          console.warn(`Failed to sync queued item ${item.id}:`, res.error);
        }
      } catch (err) {
        // Network exception: leave in queue for future retry
        failed++;
        console.error(`Error syncing queued item ${item.id}:`, err);
      } finally {
        unmarkCaptureAsInFlight(item.id);
      }
    }

    return { synced, failed };
  });
}
