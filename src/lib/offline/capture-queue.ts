/**
 * Offline Quick-Capture Queue Manager
 * Persists queued captures in localStorage when offline or network drops,
 * and flushes them in FIFO order upon network reconnection.
 */

import type { ActionResponse } from '@/types/action.types';

export const QUEUE_STORAGE_KEY = 'lifeos_offline_capture_queue';

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
 * Appends a new rawInput to the offline queue.
 */
export function queueCapture(rawInput: string): QueuedCaptureItem {
  const item: QueuedCaptureItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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
 * Clears the entire offline queue.
 */
export function clearQueuedCaptures(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear offline capture queue:', err);
  }
}

/**
 * Flushes all queued items in FIFO order using the provided server action dispatcher.
 * Returns the count of successfully synced and failed items.
 */
export async function flushQueuedCaptures(
  dispatcher: (input: string) => Promise<ActionResponse<unknown>>
): Promise<{ synced: number; failed: number }> {
  const queue = getQueuedCaptures();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await dispatcher(item.rawInput);
      if (res.success) {
        removeQueuedCapture(item.id);
        synced++;
      } else {
        failed++;
        console.warn(`Failed to sync queued item ${item.id}:`, res.error);
      }
    } catch (err) {
      failed++;
      console.error(`Error syncing queued item ${item.id}:`, err);
    }
  }

  return { synced, failed };
}
