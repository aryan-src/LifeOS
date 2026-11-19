import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  queueCapture,
  getQueuedCaptures,
  flushQueuedCaptures,
  clearQueuedCaptures,
  formatWaitingToSync,
  getSyncedCaptureIds,
  QUEUE_STORAGE_KEY,
} from '@/lib/offline/capture-queue';

describe('Offline Capture Queue Replay & De-duplication', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStore[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockStore[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStore[key];
      }),
      clear: vi.fn(() => {
        mockStore = {};
      }),
    });
    clearQueuedCaptures();
  });

  it('generates unique client IDs for each queued item', () => {
    const item1 = queueCapture('task Buy coffee');
    const item2 = queueCapture('expense ₹120 #transit', 'custom-client-id-123');

    expect(item1.id).toBeDefined();
    expect(item2.id).toBe('custom-client-id-123');
    expect(item1.id).not.toBe(item2.id);

    const queued = getQueuedCaptures();
    expect(queued).toHaveLength(2);
    expect(queued[0].id).toBe(item1.id);
    expect(queued[1].id).toBe('custom-client-id-123');
  });

  it('formats waiting to sync status clearly in plain words', () => {
    expect(formatWaitingToSync(0)).toBe('');
    expect(formatWaitingToSync(1)).toBe('1 waiting to sync');
    expect(formatWaitingToSync(4)).toBe('4 waiting to sync');
  });

  it('replays queue after dropped connection without creating duplicates', async () => {
    const item1 = queueCapture('first item');
    const item2 = queueCapture('second item');

    // Simulate first flush: item1 succeeds, then network drops on item2
    const flakyDispatcher = vi.fn().mockImplementation(async (input: string) => {
      if (input === 'first item') {
        return { success: true, data: { id: 'entity-1' } };
      }
      // Dropped connection / network error on item2
      return { success: false, error: 'Network connection dropped' };
    });

    const firstFlush = await flushQueuedCaptures(flakyDispatcher);
    expect(firstFlush.synced).toBe(1);
    expect(firstFlush.failed).toBe(1);

    // item1 is removed from queue, item2 is still queued
    const intermediateQueue = getQueuedCaptures();
    expect(intermediateQueue).toHaveLength(1);
    expect(intermediateQueue[0].id).toBe(item2.id);

    // item1 was recorded in synced IDs
    const syncedIds = getSyncedCaptureIds();
    expect(syncedIds.has(item1.id)).toBe(true);

    // Simulate accidentally having item1 re-added to queue (e.g. storage race or retry)
    // and network reconnection
    const reconnectedDispatcher = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'entity-2' },
    });

    // Manually set queue with both items to verify duplicate prevention
    localStorage.setItem(
      QUEUE_STORAGE_KEY,
      JSON.stringify([
        { id: item1.id, rawInput: 'first item', createdAt: new Date().toISOString() },
        { id: item2.id, rawInput: 'second item', createdAt: new Date().toISOString() },
      ])
    );

    const secondFlush = await flushQueuedCaptures(reconnectedDispatcher);
    expect(secondFlush.synced).toBe(2);
    expect(secondFlush.failed).toBe(0);

    // Item 1 was skipped because it was already synced; reconnectedDispatcher only called for item 2!
    expect(reconnectedDispatcher).toHaveBeenCalledTimes(1);
    expect(reconnectedDispatcher).toHaveBeenCalledWith('second item');

    const finalQueue = getQueuedCaptures();
    expect(finalQueue).toHaveLength(0);
  });
});
