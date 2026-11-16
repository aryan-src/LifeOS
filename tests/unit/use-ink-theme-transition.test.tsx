import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  useInkThemeTransition,
  createVenomInkMaskDataUri,
  generateOrganicInkSvg,
  INK_TRANSITION_CONFIG,
  VENOM_CONFIG,
} from '@/hooks/use-ink-theme-transition';

describe('useInkThemeTransition with Vector SVG Data URI & WAAPI', () => {
  let animateMock: ReturnType<typeof vi.fn>;
  let createdCanvas: {
    id: string;
    setAttribute: ReturnType<typeof vi.fn>;
    style: { cssText: string };
    width: number;
    height: number;
    getContext: ReturnType<typeof vi.fn>;
    showPopover: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    parentNode: unknown;
  } | null;
  let dummyDoc: {
    documentElement: {
      classList: {
        contains: ReturnType<typeof vi.fn>;
        toggle: ReturnType<typeof vi.fn>;
        add: ReturnType<typeof vi.fn>;
        remove: ReturnType<typeof vi.fn>;
      };
      style: {
        setProperty: ReturnType<typeof vi.fn>;
        removeProperty: ReturnType<typeof vi.fn>;
      };
      setAttribute: ReturnType<typeof vi.fn>;
      removeAttribute: ReturnType<typeof vi.fn>;
      getAttribute: ReturnType<typeof vi.fn>;
      animate: ReturnType<typeof vi.fn>;
    };
    body: {
      appendChild: ReturnType<typeof vi.fn>;
    };
    createElement: ReturnType<typeof vi.fn>;
    getElementById: ReturnType<typeof vi.fn>;
    querySelector: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    animateMock = vi.fn().mockReturnValue({
      finished: Promise.resolve(),
    });

    createdCanvas = null;

    dummyDoc = {
      documentElement: {
        classList: {
          contains: vi.fn().mockReturnValue(false),
          toggle: vi.fn(),
          add: vi.fn(),
          remove: vi.fn(),
        },
        style: {
          setProperty: vi.fn(),
          removeProperty: vi.fn(),
        },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        getAttribute: vi.fn().mockReturnValue(null),
        animate: animateMock,
      },
      body: {
        appendChild: vi.fn().mockImplementation((el: unknown) => {
          if (createdCanvas && el === createdCanvas) {
            createdCanvas.parentNode = dummyDoc.body;
          }
        }),
      },
      createElement: vi.fn().mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          createdCanvas = {
            id: '',
            setAttribute: vi.fn(),
            style: { cssText: '' },
            width: 0,
            height: 0,
            getContext: vi.fn().mockReturnValue({
              scale: vi.fn(),
              clearRect: vi.fn(),
              beginPath: vi.fn(),
              moveTo: vi.fn(),
              lineTo: vi.fn(),
              closePath: vi.fn(),
              fill: vi.fn(),
              stroke: vi.fn(),
              arc: vi.fn(),
              ellipse: vi.fn(),
              save: vi.fn(),
              restore: vi.fn(),
            }),
            showPopover: vi.fn(),
            remove: vi.fn().mockImplementation(() => {
              if (createdCanvas) createdCanvas.parentNode = null;
            }),
            parentNode: null,
          };
          return createdCanvas;
        }
        return {};
      }),
      getElementById: vi.fn().mockReturnValue(null),
      querySelector: vi.fn().mockReturnValue(null),
    };

    const dummyWindow = {
      innerWidth: 1000,
      innerHeight: 800,
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    };

    (globalThis as unknown as { document: unknown }).document = dummyDoc;
    (globalThis as unknown as { window: unknown }).window = dummyWindow;
  });

  afterEach(() => {
    delete (globalThis as unknown as { document?: unknown }).document;
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  function getHookInstance() {
    let hookResult!: ReturnType<typeof useInkThemeTransition>;
    function TestConsumer() {
      hookResult = useInkThemeTransition();
      return null;
    }
    renderToString(<TestConsumer />);
    return hookResult;
  }

  it('generates a valid, self-contained SVG data URI with path and satellite droplets', () => {
    const dataUri = createVenomInkMaskDataUri();
    expect(dataUri).toMatch(/^url\("data:image\/svg\+xml,/);
    expect(dataUri).toContain('viewBox%3D%22-120%20-120%20240%20240%22');
    expect(dataUri).toContain('%3Cpath');
    expect(dataUri).toContain('%3Ccircle');
  });

  it('calls applyTheme directly when document.startViewTransition is undefined', () => {
    const doc = globalThis.document as unknown as { startViewTransition?: unknown };
    delete doc.startViewTransition;

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    hook.triggerThemeTransition(null, applyTheme);

    expect(applyTheme).toHaveBeenCalledTimes(1);
    expect(dummyDoc.documentElement.setAttribute).not.toHaveBeenCalledWith(
      'data-theme-transitioning',
      'true'
    );
  });

  it('calls applyTheme directly when prefers-reduced-motion is true', () => {
    globalThis.window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    (globalThis.document as unknown as { startViewTransition: unknown }).startViewTransition = vi.fn();

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    hook.triggerThemeTransition(null, applyTheme);

    expect(applyTheme).toHaveBeenCalledTimes(1);
    expect(
      (globalThis.document as unknown as { startViewTransition: ReturnType<typeof vi.fn> }).startViewTransition
    ).not.toHaveBeenCalled();
  });

  it('sets --ink-mask and data-theme-transitioning, then triggers startViewTransition', () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const readyPromise = Promise.resolve();
    const finishedPromise = Promise.resolve();

    const startViewTransitionMock = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return {
        ready: readyPromise,
        finished: finishedPromise,
      };
    });

    (globalThis.document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    const mockMouseEvent = {
      clientX: 300,
      clientY: 400,
    } as unknown as React.MouseEvent;

    hook.triggerThemeTransition(mockMouseEvent, applyTheme);

    expect(dummyDoc.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--ink-mask',
      expect.stringMatching(/^url\("data:image\/svg\+xml,/)
    );
    expect(dummyDoc.documentElement.setAttribute).toHaveBeenCalledWith(
      'data-theme-transitioning',
      'true'
    );
    expect(startViewTransitionMock).toHaveBeenCalledTimes(1);
    expect(applyTheme).toHaveBeenCalledTimes(1);
  });

  it('animates ::view-transition-new(root) via WAAPI pinned to click coordinates and cleans up on finish', async () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const readyPromise = Promise.resolve();
    let finishCallback: () => void = () => {};
    const finishedPromise = new Promise<void>((resolve) => {
      finishCallback = resolve;
    });

    const startViewTransitionMock = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return {
        ready: readyPromise,
        finished: finishedPromise,
      };
    });

    (globalThis.document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    const mockMouseEvent = {
      clientX: 500,
      clientY: 200,
    } as unknown as React.MouseEvent;

    hook.triggerThemeTransition(mockMouseEvent, applyTheme, { duration: 750 });

    await readyPromise;

    expect(animateMock).toHaveBeenCalledWith(
      [
        {
          maskSize: '0px 0px',
          WebkitMaskSize: '0px 0px',
          maskPosition: '500px 200px',
          WebkitMaskPosition: '500px 200px',
        },
        expect.objectContaining({
          maskSize: expect.stringContaining('px'),
          WebkitMaskSize: expect.stringContaining('px'),
          maskPosition: expect.stringContaining('px'),
          WebkitMaskPosition: expect.stringContaining('px'),
        }),
      ],
      expect.objectContaining({
        duration: 750,
        easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
        fill: 'forwards',
        pseudoElement: '::view-transition-new(root)',
      })
    );

    // Complete transition
    finishCallback();
    await finishedPromise;

    expect(dummyDoc.documentElement.removeAttribute).toHaveBeenCalledWith('data-theme-transitioning');
    expect(dummyDoc.documentElement.style.removeProperty).toHaveBeenCalledWith('--ink-mask');
  });

  it('falls back to viewport center coordinates when event is null or has zero coordinates', async () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const readyPromise = Promise.resolve();
    const finishedPromise = Promise.resolve();

    const startViewTransitionMock = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return {
        ready: readyPromise,
        finished: finishedPromise,
      };
    });

    (globalThis.document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    hook.triggerThemeTransition(null, applyTheme);

    await readyPromise;

    // Window width is 1000, height is 800 -> center is 500, 400
    expect(animateMock).toHaveBeenCalledWith(
      [
        {
          maskSize: '0px 0px',
          WebkitMaskSize: '0px 0px',
          maskPosition: '500px 400px',
          WebkitMaskPosition: '500px 400px',
        },
        expect.anything(),
      ],
      expect.anything()
    );
  });

  it('exposes VENOM_CONFIG with all required tunables within valid ranges', () => {
    expect(VENOM_CONFIG).toBeDefined();
    expect(VENOM_CONFIG.TENDRIL_COUNT).toBeGreaterThanOrEqual(6);
    expect(VENOM_CONFIG.TENDRIL_COUNT).toBeLessThanOrEqual(10);

    expect(VENOM_CONFIG.TENDRIL_LENGTH).toBeGreaterThanOrEqual(0.15);
    expect(VENOM_CONFIG.TENDRIL_LENGTH).toBeLessThanOrEqual(0.35);

    expect(VENOM_CONFIG.GOO_SMOOTHNESS).toBeGreaterThanOrEqual(0.02);
    expect(VENOM_CONFIG.GOO_SMOOTHNESS).toBeLessThanOrEqual(0.04);

    expect(VENOM_CONFIG.WRITHE_AMOUNT).toBeGreaterThanOrEqual(0.005);
    expect(VENOM_CONFIG.WRITHE_AMOUNT).toBeLessThanOrEqual(0.015);

    expect(VENOM_CONFIG.GLOSS_STRENGTH).toBeGreaterThanOrEqual(0);
    expect(VENOM_CONFIG.GLOSS_STRENGTH).toBeLessThanOrEqual(1);

    expect(VENOM_CONFIG.DURATION_MS).toBeGreaterThanOrEqual(1000);
    expect(VENOM_CONFIG.DURATION_MS).toBeLessThanOrEqual(1200);
  });

  it('generates morphing organic ink SVG mask with smooth Bézier paths and satellite droplets', () => {
    const svg0 = generateOrganicInkSvg(0.0, 950, 40, 1000, 800);
    expect(svg0).toContain('<svg');
    expect(svg0).toContain('<path');
    expect(svg0).toContain('fill="#000"');

    const svgHalf = generateOrganicInkSvg(0.5, 950, 40, 1000, 800);
    expect(svgHalf).toContain('<circle');
    expect(svgHalf.length).toBeGreaterThan(svg0.length);

    const svgFull = generateOrganicInkSvg(1.0, 950, 40, 1000, 800);
    expect(svgFull).toContain('</svg>');
  });

  it('sets up organic SVG ink mask and cleans up when transition finishes', async () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const readyPromise = Promise.resolve();
    let finishCallback: () => void = () => {};
    const finishedPromise = new Promise<void>((resolve) => {
      finishCallback = resolve;
    });

    const startViewTransitionMock = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return {
        ready: readyPromise,
        finished: finishedPromise,
      };
    });

    (globalThis.document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    hook.triggerThemeTransition(null, applyTheme);

    expect(dummyDoc.documentElement.setAttribute).toHaveBeenCalledWith(
      'data-theme-transitioning',
      'true'
    );
    expect(dummyDoc.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--ink-mask',
      expect.stringMatching(/^url\("data:image\/svg\+xml,/)
    );

    await readyPromise;
    finishCallback();
    await finishedPromise;

    expect(dummyDoc.documentElement.removeAttribute).toHaveBeenCalledWith('data-theme-transitioning');
    expect(dummyDoc.documentElement.style.removeProperty).toHaveBeenCalledWith('--ink-mask');
  });

  it('uses VENOM_CONFIG.DURATION_MS by default when options.duration is omitted', async () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const readyPromise = Promise.resolve();
    const finishedPromise = Promise.resolve();

    const startViewTransitionMock = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return {
        ready: readyPromise,
        finished: finishedPromise,
      };
    });

    (globalThis.document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    hook.triggerThemeTransition(null, applyTheme);
    await readyPromise;

    expect(animateMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        duration: VENOM_CONFIG.DURATION_MS,
      })
    );
  });
});
