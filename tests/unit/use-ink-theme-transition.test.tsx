import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  useInkThemeTransition,
  easeInOutCubic,
  injectVenomSvgMask,
  VENOM_DEFAULT_DURATION,
} from '@/hooks/use-ink-theme-transition';

describe('useInkThemeTransition hook & GPU Liquid SVG Mask', () => {
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
    };
    body: {
      appendChild: ReturnType<typeof vi.fn>;
    };
    getElementById: ReturnType<typeof vi.fn>;
    querySelector: ReturnType<typeof vi.fn>;
    createElementNS: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    const createdElements: Record<string, unknown> = {};

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
      },
      body: {
        appendChild: vi.fn().mockImplementation((el: unknown) => el),
      },
      getElementById: vi.fn().mockImplementation((id: string) => createdElements[id] || null),
      querySelector: vi.fn().mockReturnValue(null),
      createElementNS: vi.fn().mockImplementation((ns: string, tag: string) => {
        const el = {
          namespaceURI: ns,
          tagName: tag,
          attributes: {} as Record<string, string>,
          style: {} as Record<string, string>,
          setAttribute: vi.fn().mockImplementation((name: string, val: string) => {
            el.attributes[name] = val;
            if (name === 'id') {
              createdElements[val] = el;
            }
          }),
          getAttribute: vi.fn().mockImplementation((name: string) => el.attributes[name]),
          remove: vi.fn().mockImplementation(() => {
            const id = el.attributes['id'];
            if (id) delete createdElements[id];
          }),
          innerHTML: '',
        };
        return el;
      }),
    };

    const dummyWindow = {
      innerWidth: 1000,
      innerHeight: 800,
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
      requestAnimationFrame: vi.fn().mockImplementation((cb: (now: number) => void) => {
        return setTimeout(() => cb(performance.now()), 16) as unknown as number;
      }),
      cancelAnimationFrame: vi.fn().mockImplementation((id: number) => {
        clearTimeout(id);
      }),
    };

    (globalThis as unknown as { document: unknown }).document = dummyDoc;
    (globalThis as unknown as { window: unknown }).window = dummyWindow;
    (globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = dummyWindow.requestAnimationFrame;
    (globalThis as unknown as { cancelAnimationFrame: unknown }).cancelAnimationFrame = dummyWindow.cancelAnimationFrame;
  });

  afterEach(() => {
    delete (globalThis as unknown as { document?: unknown }).document;
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { requestAnimationFrame?: unknown }).requestAnimationFrame;
    delete (globalThis as unknown as { cancelAnimationFrame?: unknown }).cancelAnimationFrame;
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

  it('computes correct easeInOutCubic values', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.25)).toBeCloseTo(0.0625, 4);
    expect(easeInOutCubic(0.75)).toBeCloseTo(0.9375, 4);
  });

  it('injects hidden SVG with feTurbulence, feDisplacementMap, feComponentTransfer, and mask', () => {
    const svg = injectVenomSvgMask(900, 50, 1000, 800);
    expect(svg).not.toBeNull();
    expect(dummyDoc.createElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'svg');
    expect(svg?.getAttribute('id')).toBe('venom-ink-svg');
    expect(svg?.innerHTML).toContain('id="venom-liquid-filter"');
    expect(svg?.innerHTML).toContain('feTurbulence');
    expect(svg?.innerHTML).toContain('baseFrequency="0.0055"');
    expect(svg?.innerHTML).toContain('feGaussianBlur');
    expect(svg?.innerHTML).toContain('feDisplacementMap');
    expect(svg?.innerHTML).toContain('scale="145"');
    expect(svg?.innerHTML).toContain('feComponentTransfer');
    expect(svg?.innerHTML).toContain('slope="60" intercept="-28"');
    expect(svg?.innerHTML).toContain('id="venom-ink-mask"');
    expect(svg?.innerHTML).toContain('id="venom-ink-circle"');
    expect(dummyDoc.body.appendChild).toHaveBeenCalled();
  });

  it('calls applyTheme directly when document.startViewTransition is undefined', () => {
    const doc = globalThis.document as unknown as { startViewTransition?: unknown };
    delete doc.startViewTransition;

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    hook.triggerThemeTransition(null, applyTheme);

    expect(applyTheme).toHaveBeenCalledTimes(1);
    expect(dummyDoc.documentElement.setAttribute).toHaveBeenCalledWith(
      'data-theme-crossfading',
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

  it('triggers startViewTransition, sets data-theme-transitioning, and executes applyTheme synchronously', () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const readyPromise = Promise.resolve();
    const finishedPromise = Promise.resolve();

    const startViewTransitionMock = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return {
        ready: readyPromise,
        finished: finishedPromise,
        skipTransition: vi.fn(),
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

    expect(globalThis.document.documentElement.setAttribute).toHaveBeenCalledWith(
      'data-theme-transitioning',
      'true'
    );
    expect(startViewTransitionMock).toHaveBeenCalledTimes(1);
    expect(applyTheme).toHaveBeenCalledTimes(1);
  });

  it('animates venom-ink-circle radius via requestAnimationFrame from 0 to maxCornerDistance + 150 over 750ms and skips transition on finish', async () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const skipTransitionMock = vi.fn();
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
        skipTransition: skipTransitionMock,
      };
    });

    (globalThis.document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    const circleEl = {
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
    };

    dummyDoc.getElementById.mockImplementation((id: string) => {
      if (id === 'venom-ink-circle') return circleEl;
      return null;
    });

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    hook.triggerThemeTransition(null, applyTheme, { duration: VENOM_DEFAULT_DURATION });

    await readyPromise;
    expect(globalThis.window.requestAnimationFrame).toHaveBeenCalled();

    finishCallback();
    await finishedPromise;
  });

  it('skips running transition when clicked mid-animation to allow immediate new transition', async () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const skipTransition1 = vi.fn();
    const skipTransition2 = vi.fn();

    let finishCallback1: () => void = () => {};
    const finishedPromise1 = new Promise<void>((resolve) => {
      finishCallback1 = resolve;
    });

    const startViewTransitionMock = vi
      .fn()
      .mockImplementationOnce((cb: () => void) => {
        cb();
        return {
          ready: Promise.resolve(),
          finished: finishedPromise1,
          skipTransition: skipTransition1,
        };
      })
      .mockImplementationOnce((cb: () => void) => {
        cb();
        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
          skipTransition: skipTransition2,
        };
      });

    (globalThis.document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    const applyTheme1 = vi.fn();
    const applyTheme2 = vi.fn();
    const hook = getHookInstance();

    // First trigger starts transition 1
    hook.triggerThemeTransition(null, applyTheme1);
    expect(startViewTransitionMock).toHaveBeenCalledTimes(1);
    expect(applyTheme1).toHaveBeenCalledTimes(1);

    // Second trigger mid-animation skips transition 1 and starts transition 2 immediately
    hook.triggerThemeTransition(null, applyTheme2);
    expect(skipTransition1).toHaveBeenCalledTimes(1);
    expect(startViewTransitionMock).toHaveBeenCalledTimes(2);
    expect(applyTheme2).toHaveBeenCalledTimes(1);

    finishCallback1();
    await finishedPromise1;
  });
});
