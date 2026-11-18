/**
 * Cross-tab completion alert lock, optional Web Audio chime, and opt-in browser notifications.
 * Guarantees only one browser tab plays the completion sound or triggers a desktop notification
 * for a given clientSessionId.
 */

const ALERT_CHANNEL_NAME = 'lifeos_focus_timer_alerts';
const ALERT_STORAGE_PREFIX = 'lifeos_focus_alert_claimed_';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const claimedInMemory = new Set<string>();
let alertChannel: BroadcastChannel | null = null;

function ensureBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!alertChannel) {
    try {
      alertChannel = new BroadcastChannel(ALERT_CHANNEL_NAME);
      alertChannel.onmessage = (event: MessageEvent) => {
        const data = event.data as { type?: string; clientSessionId?: string } | null;
        if (data?.type === 'ALERT_CLAIMED' && typeof data.clientSessionId === 'string') {
          claimedInMemory.add(data.clientSessionId);
        }
      };
    } catch {
      alertChannel = null;
    }
  }
  return alertChannel;
}

/**
 * Attempts to claim sole alert ownership (chime + browser notification) for `clientSessionId`.
 * Returns true for at most one tab; subsequent calls or other tabs return false.
 */
export function claimSessionCompletionAlert(
  clientSessionId: string,
  tabId: string,
  storage?: StorageLike | null
): boolean {
  if (!clientSessionId) return false;
  if (claimedInMemory.has(clientSessionId)) return false;

  const store: StorageLike | null =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;

  const key = `${ALERT_STORAGE_PREFIX}${clientSessionId}`;

  if (store) {
    try {
      const existing = store.getItem(key);
      if (existing && existing !== tabId) {
        claimedInMemory.add(clientSessionId);
        return false;
      }
      if (!existing) {
        store.setItem(key, tabId);
      }
      const winner = store.getItem(key);
      if (winner !== tabId) {
        claimedInMemory.add(clientSessionId);
        return false;
      }
    } catch {
      // Storage unavailable (private browsing); fall back to in-memory + BroadcastChannel
    }
  }

  claimedInMemory.add(clientSessionId);

  const channel = ensureBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({
        type: 'ALERT_CLAIMED',
        clientSessionId,
        tabId,
      });
    } catch {}
  }

  return true;
}

/**
 * Resets in-memory alert claims (intended for unit tests only).
 */
export function resetAlertClaimsForTests(): void {
  claimedInMemory.clear();
}

/**
 * Synthesizes a calm, quiet two-note bell chime using Web Audio API.
 * Requires no audio files and no browser permission prompt.
 */
export function playFocusCompletionChime(): void {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, start: 0, duration: 0.7 },    // C5
      { freq: 783.99, start: 0.16, duration: 0.9 }, // G5
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gain.gain.setValueAtTime(0.0001, now + note.start);
      gain.gain.exponentialRampToValueAtTime(0.08, now + note.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration + 0.05);
    }

    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 1400);
  } catch {
    // Gracefully ignore autoplay / audio context restrictions
  }
}

/**
 * Explicitly requests browser Notification permission.
 * Must ONLY be called from a direct user click handler.
 */
export async function requestFocusNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Shows a quiet browser notification if permission is granted and the tab is hidden.
 */
export function showFocusCompletionNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (typeof document !== 'undefined' && !document.hidden) return;

  try {
    new Notification(title, {
      body,
      silent: false,
    });
  } catch {
    // Ignore notification errors on restricted environments
  }
}
