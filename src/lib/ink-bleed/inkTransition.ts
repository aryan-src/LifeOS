import gsap from 'gsap';
import { capturePage, layoutKey, renderScale } from './capture/capture';
import { inkParams } from './gl/params';
import { InkRenderer, type InkFrame, type InkSource } from './gl/renderer';
import { applyTheme, getTheme, otherTheme, type Theme } from './theme';
import { ThemeIcon } from './themeIcon';

export interface Point {
  x: number;
  y: number;
}

const EASE = 'power3.out';
const FADE_OUT = 0.15;
const RESIZE_DEBOUNCE_MS = 250;
/** CSS cross-fade used without WebGL2, with reduced motion, or before snapshots are ready. */
const CSS_FADE_S = 0.45;

/**
 * Spread shape over time (from codemure-official/ink-bleed-theme-changer).
 * `growth`: base radius at progress 1 relative to the farthest corner.
 * `cleanupFrom`: fraction of the duration after which a uniform extra reach
 * eats whatever the noise left behind, so the page is fully covered at the end.
 * `cleanupReach`: extra reach at t = 1, relative to the farthest corner.
 */
export const SPREAD = { growth: 0.7, cleanupFrom: 0.45, cleanupReach: 0.4, cleanupPow: 2 };

/** Everything needed to reproduce a transition exactly ("replay last click"). */
export interface ClickRecord {
  point: Point;
  seed: InkFrame['seed'];
  from: Theme;
}

const REPLAY_HOLD_MS = 400;

type ActiveFrame = Omit<InkFrame, 'progress' | 'radius' | 'time' | 'cleanup'>;

/**
 * Orchestrates the theme transition (codemure-official/ink-bleed-theme-changer):
 *  1. keeps fresh snapshots of both themes on the GPU (pre-captured, re-captured on layout change)
 *  2. on toggle, covers the page with the "from" image, flips the live DOM underneath,
 *     spreads the ink, then fades the overlay away onto the already-flipped page
 *  3. if toggled mid-spread, freezes the frame on screen and spreads the next ink over it
 *  4. falls back to a CSS colour cross-fade without WebGL2 or with reduced motion
 */
export class InkTransition {
  private readonly renderer: InkRenderer | null;
  private toggleButton: HTMLButtonElement | null = null;
  private icon: ThemeIcon | null = null;
  private readonly state = { progress: 0, time: 0 };
  private tween: gsap.core.Tween | null = null;
  private fade: gsap.core.Tween | null = null;
  private frame: ActiveFrame | null = null;
  private cssFadeTimer = 0;
  private replayTimer = 0;
  private last: ClickRecord | null = null;

  private captureGen = 0;
  private capturing = false;
  private captureQueued = false;
  private resizeTimer = 0;

  constructor(canvas: HTMLCanvasElement, toggleButton?: HTMLButtonElement | null, opts: { webgl?: boolean } = {}) {
    this.toggleButton = toggleButton ?? null;
    if (this.toggleButton) {
      this.icon = new ThemeIcon(this.toggleButton);
      this.icon.set(getTheme());
    }

    this.renderer = opts.webgl === false ? null : InkRenderer.create(canvas);
    if (!this.renderer) {
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.ink = 'css';
      }
      return;
    }

    if (typeof document !== 'undefined') {
      document.documentElement.dataset.ink = 'webgl';
    }

    this.renderer.resize(renderScale());
    this.renderer.watchContext(
      () => this.cancel(),
      () => this.scheduleCapture(0),
    );

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.renderer?.resize(renderScale());
        if (this.frame) this.draw();
        this.scheduleCapture(RESIZE_DEBOUNCE_MS);
      });

      if (typeof ResizeObserver !== 'undefined' && document.body) {
        new ResizeObserver(() => this.scheduleCapture(RESIZE_DEBOUNCE_MS)).observe(document.body);
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotion.addEventListener('change', () => this.scheduleCapture(0));

      this.scheduleCapture(10);
      if (document.fonts) {
        void document.fonts.ready.then(() => this.scheduleCapture(100));
      }
    }
  }

  setToggleButton(button: HTMLButtonElement | null): void {
    this.toggleButton = button;
    if (button) {
      this.icon = new ThemeIcon(button);
      this.icon.set(getTheme());
    } else {
      this.icon = null;
    }
  }

  get isWebGL(): boolean {
    return this.renderer !== null;
  }

  get isAnimating(): boolean {
    return this.frame !== null;
  }

  get lastClick(): ClickRecord | null {
    return this.last;
  }

  /**
   * Toggle the theme, spreading from `point` (viewport CSS px) or from the toggle button.
   * `applyCallback` flips the live DOM behind the overlay.
   */
  toggle(
    point?: Point,
    seed?: InkFrame['seed'],
    applyCallback?: () => void,
    targetTheme?: Theme
  ): void {
    if (typeof window === 'undefined') return;

    window.clearTimeout(this.replayTimer);
    const current = getTheme();
    const to = targetTheme ?? otherTheme(current);
    const renderer = this.renderer;
    const scale = renderScale();
    const key = layoutKey(scale);
    const interrupting = this.frame !== null;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canAnimate =
      renderer !== null &&
      !renderer.isLost &&
      !reducedMotion &&
      renderer.hasValid(to, key) &&
      (interrupting || renderer.hasValid(current, key));

    if (!canAnimate || !renderer) {
      this.cancel();
      this.crossFade(to, applyCallback);
      if (renderer && !reducedMotion) this.scheduleCapture(0);
      return;
    }

    // Interrupted: freeze exactly what is on screen and spread the new ink over it.
    let from: InkSource = current;
    if (interrupting) {
      this.tween?.kill();
      this.fade?.kill();
      this.tween = this.fade = null;
      renderer.resize(scale);
      const frozen = this.currentFrame();
      from = frozen && renderer.freeze(frozen) ? 'composite' : current;
    }

    const center = point ?? this.toggleCenter();
    const maxDist = farthestCorner(center);
    const frameSeed = seed ?? randomSeed();
    this.last = { point: center, seed: frameSeed, from: otherTheme(to) };

    this.frame = { from, to, center, maxDist, seed: frameSeed };
    this.state.progress = 0;
    this.state.time = 0;

    const chromeFrom = this.icon?.readChrome();
    renderer.resize(scale);
    this.draw();

    // Same task: the overlay (showing "from") and the flipped DOM hit the screen together.
    gsap.set(renderer.canvas, { opacity: 1 });
    renderer.canvas.classList.add('is-active');

    if (applyCallback) {
      applyCallback();
    } else {
      applyTheme(to, this.toggleButton);
    }

    const duration = inkParams.duration;
    this.icon?.morphTo(to, {
      duration,
      ease: EASE,
      timeScale: inkParams.timeScale,
      chromeFrom,
      chromeDelay: this.inkArrival(center, maxDist, this.toggleCenter()) * duration,
    });

    this.tween = gsap.to(this.state, {
      progress: 1,
      duration,
      ease: EASE,
      onUpdate: () => {
        this.state.time = this.tween?.time() ?? 0;
        this.draw();
      },
      onComplete: () => this.finish(),
    });
    this.tween.timeScale(inkParams.timeScale);
  }

  replay(): boolean {
    const last = this.last;
    if (!last || typeof window === 'undefined') return false;
    window.clearTimeout(this.replayTimer);
    this.cancel();
    this.icon?.kill();
    if (getTheme() !== last.from) {
      applyTheme(last.from, this.toggleButton);
      this.icon?.set(last.from);
    }
    this.replayTimer = window.setTimeout(() => this.toggle(last.point, last.seed), REPLAY_HOLD_MS);
    return true;
  }

  setTimeScale(scale: number): void {
    inkParams.timeScale = scale;
    this.tween?.timeScale(scale);
    this.fade?.timeScale(scale);
    this.icon?.setTimeScale(scale);
  }

  private currentFrame(): InkFrame | null {
    if (!this.frame) return null;
    const { progress, time } = this.state;
    const { maxDist } = this.frame;
    const linear = Math.min(1, time / inkParams.duration);
    const ramp = Math.max(0, (linear - SPREAD.cleanupFrom) / (1 - SPREAD.cleanupFrom));
    const cleanup =
      ramp ** SPREAD.cleanupPow * maxDist * SPREAD.cleanupReach + Math.max(0, (linear - 0.97) / 0.03) * maxDist;
    return { ...this.frame, progress, time, radius: progress * maxDist * SPREAD.growth, cleanup };
  }

  private draw(): void {
    const frame = this.currentFrame();
    if (this.renderer && frame) this.renderer.draw(frame);
  }

  private finish(): void {
    const canvas = this.renderer?.canvas;
    this.tween = null;
    if (!canvas) return;
    this.fade = gsap
      .to(canvas, { opacity: 0, duration: FADE_OUT, ease: 'none', onComplete: () => this.hide() })
      .timeScale(inkParams.timeScale);
  }

  private hide(): void {
    this.fade = null;
    this.frame = null;
    this.renderer?.canvas.classList.remove('is-active');
    if (this.captureQueued) this.scheduleCapture(0);
  }

  cancel(): void {
    if (!this.frame) return;
    this.tween?.kill();
    this.fade?.kill();
    this.tween = null;
    this.hide();
  }

  /** Plain CSS colour transition fallback */
  private crossFade(to: Theme, applyCallback?: () => void): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.classList.add('theme-fade');
    root.style.setProperty('--theme-fade', `${CSS_FADE_S}s`);

    if (applyCallback) {
      applyCallback();
    } else {
      applyTheme(to, this.toggleButton);
    }

    if (motion) {
      this.icon?.morphTo(to, { duration: CSS_FADE_S * 1.6, ease: 'power2.inOut', timeScale: 1 });
    } else {
      this.icon?.set(to);
    }
    window.clearTimeout(this.cssFadeTimer);
    this.cssFadeTimer = window.setTimeout(() => {
      root.classList.remove('theme-fade');
      if (this.captureQueued) this.scheduleCapture(0);
    }, CSS_FADE_S * 1000 + 50);
  }

  private inkArrival(center: Point, maxDist: number, target: Point): number {
    const dist = Math.hypot(target.x - center.x, target.y - center.y);
    if (dist < 28) return 0;
    const p = Math.min(1, dist / (maxDist * SPREAD.growth * 1.15));
    return Math.min(0.85, 1 - Math.cbrt(1 - p));
  }

  private toggleCenter(): Point {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const r = this.toggleButton?.getBoundingClientRect();
    if (!r) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // ---------- Capture scheduling ----------

  private scheduleCapture(delay: number): void {
    if (typeof window === 'undefined') return;
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => void this.captureAll(), delay);
  }

  private async captureAll(): Promise<void> {
    const renderer = this.renderer;
    if (typeof window === 'undefined' || !renderer || renderer.isLost) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    if (this.capturing || this.frame || document.documentElement.classList.contains('theme-fade')) {
      this.captureQueued = true;
      return;
    }

    const scale = renderScale();
    const key = layoutKey(scale);
    const current = getTheme();
    const themes: Theme[] = [current, otherTheme(current)].filter((t) => !renderer.hasValid(t, key));
    this.captureQueued = false;
    if (themes.length === 0) return;

    const gen = ++this.captureGen;
    this.capturing = true;
    try {
      for (const theme of themes) {
        const snap = await capturePage(theme, scale, renderer.maxTextureSize);
        if (!snap) continue;
        if (gen !== this.captureGen) return;
        if (snap.key !== layoutKey(renderScale())) {
          this.captureQueued = true;
          break;
        }
        renderer.upload(snap);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ink] capture failed', err);
      }
    } finally {
      this.capturing = false;
    }
    if (this.captureQueued) this.scheduleCapture(RESIZE_DEBOUNCE_MS);
  }
}

function farthestCorner(p: Point): number {
  if (typeof document === 'undefined') return 1000;
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  return Math.max(Math.hypot(p.x, p.y), Math.hypot(w - p.x, p.y), Math.hypot(p.x, h - p.y), Math.hypot(w - p.x, h - p.y)) + 4;
}

function randomSeed(): InkFrame['seed'] {
  return { x: Math.random() * 64 - 32, y: Math.random() * 64 - 32, angle: Math.random() * Math.PI * 2 };
}

// Global singleton instance for easy client-side hook access
let globalInk: InkTransition | null = null;

export function getGlobalInkTransition(toggleButton?: HTMLButtonElement | null): InkTransition | null {
  if (typeof window === 'undefined') return null;

  if (!globalInk) {
    let canvas = document.querySelector<HTMLCanvasElement>('.ink-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'ink-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.setAttribute('data-html2canvas-ignore', '');
      document.body.appendChild(canvas);
    }
    globalInk = new InkTransition(canvas, toggleButton);
  } else if (toggleButton) {
    globalInk.setToggleButton(toggleButton);
  }

  return globalInk;
}
