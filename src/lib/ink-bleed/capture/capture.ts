import type { Theme } from '../gl/params';

/**
 * Full-document snapshots of the page in a given theme.
 * Source: codemure-official/ink-bleed-theme-changer
 *
 * We capture the whole document (not just the viewport) so a snapshot stays valid
 * while the user scrolls; the shader picks the visible window using the live scroll
 * offset. The theme is applied to html2canvas' *cloned* document via `onclone`, so the
 * live page never flickers during pre-capture.
 */

export interface Snapshot {
  theme: Theme;
  canvas: HTMLCanvasElement;
  /** Texture pixels per CSS pixel. */
  scale: number;
  /** Layout this snapshot is valid for; see {@link layoutKey}. */
  key: string;
  ms: number;
}

const BACKGROUND: Record<Theme, string> = {
  light: '#FAF9F5',
  dark: '#0B0B0C',
};

const isCoarsePointer = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/** Device-pixel ratio used for both the snapshots and the overlay canvas. */
export function renderScale(): number {
  if (typeof window === 'undefined') return 1;
  const cap = isCoarsePointer() ? 1.5 : 2;
  return Math.min(window.devicePixelRatio || 1, cap);
}

export function documentSize(): { width: number; height: number } {
  if (typeof document === 'undefined') return { width: 1920, height: 1080 };
  const el = document.documentElement;
  return { width: el.clientWidth, height: Math.max(el.scrollHeight, el.clientHeight) };
}

/**
 * Identifies the layout a snapshot depends on. Viewport height is deliberately
 * excluded (mobile URL-bar show/hide changes it without reflowing the document).
 */
export function layoutKey(scale: number): string {
  const { width, height } = documentSize();
  return `${width}x${height}@${scale}`;
}

export async function capturePage(theme: Theme, scale: number, maxTextureSize: number): Promise<Snapshot> {
  const t0 = performance.now();
  const key = layoutKey(scale);
  const { width, height } = documentSize();

  // Never exceed what the GPU can hold; the shader handles scale != canvas DPR.
  const safeScale = Math.min(scale, maxTextureSize / Math.max(width, 1), maxTextureSize / Math.max(height, 1));

  try {
    // Lazy-loaded: html2canvas is ~200 KB and only needed after first paint.
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(document.body, {
      scale: safeScale,
      backgroundColor: BACKGROUND[theme],
      x: 0,
      y: 0,
      width,
      height,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: document.documentElement.clientHeight,
      logging: false,
      useCORS: true,
      onclone: (doc) => {
        doc.documentElement.dataset.theme = theme === 'dark' ? 'crimson-dark' : 'nordic';
        if (theme === 'dark') {
          doc.documentElement.classList.add('dark');
        } else {
          doc.documentElement.classList.remove('dark');
        }
        doc.querySelectorAll<HTMLElement>('[data-ink-live]').forEach((el) => {
          el.style.visibility = 'hidden';
        });
      },
    });

    return { theme, canvas, scale: safeScale, key, ms: performance.now() - t0 };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ink] capturePage fallback used:', err);
    }
    // Solid background fallback texture so the WebGL ink bleed shader always has valid textures to sample
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * safeScale));
    canvas.height = Math.max(1, Math.round(height * safeScale));
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = BACKGROUND[theme];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return { theme, canvas, scale: safeScale, key, ms: performance.now() - t0 };
  }
}
