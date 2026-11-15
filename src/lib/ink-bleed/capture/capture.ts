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
  const cap = isCoarsePointer() ? 1.0 : 1.25;
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

export async function capturePage(
  theme: Theme,
  scale: number,
  maxTextureSize: number
): Promise<Snapshot | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  const t0 = performance.now();
  const key = layoutKey(scale);
  const { width, height } = documentSize();

  // Never exceed what the GPU can hold; the shader handles scale != canvas DPR.
  const safeScale = Math.min(scale, maxTextureSize / Math.max(width, 1), maxTextureSize / Math.max(height, 1));

  try {
    const html2canvasModule = await import('html2canvas');
    const html2canvas = (
      typeof html2canvasModule === 'function'
        ? html2canvasModule
        : (html2canvasModule as unknown as { default?: unknown }).default || html2canvasModule
    ) as (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;

    if (typeof html2canvas !== 'function') {
      console.warn('[ink] html2canvas is not a function');
      return null;
    }

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
      imageTimeout: 2000,
      ignoreElements: (el: Element) => {
        if (el.classList?.contains('ink-canvas')) return true;
        if (el.getAttribute('data-html2canvas-ignore') !== null) return true;
        return false;
      },
      onclone: (doc: Document) => {
        doc.documentElement.dataset.theme = theme === 'dark' ? 'crimson-dark' : 'nordic';
        if (theme === 'dark') {
          doc.documentElement.classList.add('dark');
          if (doc.body) {
            doc.body.style.backgroundColor = '#0B0B0C';
            doc.body.style.color = '#FFFDD0';
          }
        } else {
          doc.documentElement.classList.remove('dark');
          if (doc.body) {
            doc.body.style.backgroundColor = '#FAF9F5';
            doc.body.style.color = '#1F2937';
          }
        }
        doc.querySelectorAll<HTMLElement>('[data-ink-live]').forEach((el) => {
          el.style.visibility = 'hidden';
        });
      },
    });

    if (!canvas || canvas.width <= 1 || canvas.height <= 1) {
      return null;
    }

    return { theme, canvas, scale: safeScale, key, ms: performance.now() - t0 };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ink] capturePage failed, fallback will be used:', err);
    }
    return null;
  }
}
