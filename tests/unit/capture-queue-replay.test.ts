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

  it('replays the same queued item twice and produces exactly one record', async () => {
    const item = queueCapture('test offline task', 'item-single-client-id');
    const createdRecords: Array<{ id: string; input: string }> = [];

    const serverDispatcher = vi.fn().mockImplementation(async (rawInput: string) => {
      const record = { id: `task-server-${Date.now()}`, input: rawInput };
      createdRecords.push(record);
      return { success: true, data: record };
    });

    // First replay
    const firstFlush = await flushQueuedCaptures(serverDispatcher);
    expect(firstFlush.synced).toBe(1);
    expect(firstFlush.failed).toBe(0);
    expect(createdRecords).toHaveLength(1);
    expect(serverDispatcher).toHaveBeenCalledTimes(1);

    // Second replay (calling flush again immediately)
    const secondFlush = await flushQueuedCaptures(serverDispatcher);
    expect(secondFlush.synced).toBe(0);
    expect(secondFlush.failed).toBe(0);

    // Total records must be exactly one; dispatcher was not invoked a second time
    expect(createdRecords).toHaveLength(1);
    expect(serverDispatcher).toHaveBeenCalledTimes(1);
    expect(getQueuedCaptures()).toHaveLength(0);
    expect(getSyncedCaptureIds().has(item.id)).toBe(true);
  });

  it('replays queue from two simulated concurrent tabs and produces exactly one record', async () => {
    const item = queueCapture('test offline task', 'item-two-tabs-id');
    const createdRecords: Array<{ id: string; input: string }> = [];

    // Simulate async network round-trip delay to expose concurrent race condition
    const slowServerDispatcher = vi.fn().mockImplementation(async (rawInput: string) => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      const record = { id: `task-server-${createdRecords.length + 1}`, input: rawInput };
      createdRecords.push(record);
      return { success: true, data: record };
    });

    // Simulate Tab A and Tab B receiving the 'online' event at the same time
    const [tabAResult, tabBResult] = await Promise.all([
      flushQueuedCaptures(slowServerDispatcher),
      flushQueuedCaptures(slowServerDispatcher),
    ]);

    // Cross-tab lock ensures only one tab dispatches; the second tab waits or skips
    expect(slowServerDispatcher).toHaveBeenCalledTimes(1);
    expect(createdRecords).toHaveLength(1);
    expect(createdRecords[0].input).toBe('test offline task');

    // Exactly one tab successfully synced it; total synced across both tabs is 1
    expect(tabAResult.synced + tabBResult.synced).toBe(1);
    expect(tabAResult.failed + tabBResult.failed).toBe(0);

    // Queue is cleaned up and marked synced
    expect(getQueuedCaptures()).toHaveLength(0);
    expect(getSyncedCaptureIds().has(item.id)).toBe(true);
  });

  it('handles reconnect when item was already saved and produces exactly one record', async () => {
    const item = queueCapture('test offline task', 'already-saved-id');
    const createdRecords: Array<{ id: string; input: string }> = [
      { id: 'task-pre-existing-1', input: 'test offline task' },
    ];

    // Mark as already synced (simulates item was saved before disconnect or in previous cycle)
    const serverDispatcher = vi.fn().mockImplementation(async (rawInput: string) => {
      const record = { id: `task-server-duplicate`, input: rawInput };
      createdRecords.push(record);
      return { success: true, data: record };
    });

    // Mark the capture ID as already synced
    const { markCaptureAsSynced } = await import('@/lib/offline/capture-queue');
    markCaptureAsSynced(item.id);

    // Network returns and triggers flush
    const reconnectFlush = await flushQueuedCaptures(serverDispatcher);

    // Reconnect skips dispatching because it was already saved
    expect(serverDispatcher).toHaveBeenCalledTimes(0);
    expect(reconnectFlush.synced).toBe(1); // Cleaned from queue
    expect(reconnectFlush.failed).toBe(0);

    // Total records remains exactly 1 pre-existing record
    expect(createdRecords).toHaveLength(1);
    expect(createdRecords[0].id).toBe('task-pre-existing-1');
    expect(getQueuedCaptures()).toHaveLength(0);
  });

  it('supports navigator.locks Web Locks API when available in modern browsers', async () => {
    const item = queueCapture('test web lock task', 'web-lock-id');
    let lockAcquired = false;

    // Mock navigator.locks
    vi.stubGlobal('navigator', {
      onLine: true,
      locks: {
        request: vi.fn().mockImplementation(async (name: string, callback: () => Promise<unknown>) => {
          lockAcquired = true;
          return await callback();
        }),
      },
    });

    const dispatcher = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'task-lock-1' },
    });

    const res = await flushQueuedCaptures(dispatcher);
    expect(lockAcquired).toBe(true);
    expect(res.synced).toBe(1);
    expect(dispatcher).toHaveBeenCalledTimes(1);
    expect(getQueuedCaptures()).toHaveLength(0);

    vi.unstubAllGlobals();
  });
});
