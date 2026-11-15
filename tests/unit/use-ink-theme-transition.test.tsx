import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  useInkThemeTransition,
  getInkKeyframes,
  INK_GRID_COLS,
  INK_GRID_ROWS,
  INK_GRID_FRAMES,
  INK_DEFAULT_DURATION,
} from '@/hooks/use-ink-theme-transition';

describe('useInkThemeTransition hook', () => {
  let animateMock: ReturnType<typeof vi.fn>;
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
      animate: ReturnType<typeof vi.fn>;
    };
    body: {
      appendChild: ReturnType<typeof vi.fn>;
    };
    getElementById: ReturnType<typeof vi.fn>;
    querySelector: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    animateMock = vi.fn().mockReturnValue({
      finished: Promise.resolve(),
    });

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
        animate: animateMock,
      },
      body: {
        appendChild: vi.fn(),
      },
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

  it('generates valid 48 keyframes stepping across 8x6 sprite sheet with steps(1, jump-end)', () => {
    const keyframes = getInkKeyframes();
    expect(keyframes).toHaveLength(INK_GRID_FRAMES);

    // First frame (0, 0) should be at 0% 0%
    expect(keyframes[0].maskPosition).toBe('0% 0%');
    expect(keyframes[0].easing).toBe('steps(1, jump-end)');

    // Frame 7 (col 7, row 0) should be at 100% 0%
    expect(keyframes[7].maskPosition).toBe('100% 0%');

    // Last frame (col 7, row 5) should be at 100% 100%
    expect(keyframes[47].maskPosition).toBe('100% 100%');
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

  it('triggers startViewTransition, sets data-theme-transitioning, and executes applyTheme', () => {
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

  it('animates ::view-transition-new(root) using WAAPI keyframes and skips transition on finish', async () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    let animFinishCallback: () => void = () => {};
    const animFinishedPromise = new Promise<void>((resolve) => {
      animFinishCallback = resolve;
    });

    const mockAnim = {
      finished: animFinishedPromise,
    };
    animateMock.mockReturnValue(mockAnim);

    const skipTransitionMock = vi.fn();
    const readyPromise = Promise.resolve();
    const finishedPromise = Promise.resolve();

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

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    hook.triggerThemeTransition(null, applyTheme, { duration: INK_DEFAULT_DURATION });

    // Wait for transition.ready to trigger animate
    await readyPromise;
    await new Promise((r) => setTimeout(r, 0));

    expect(animateMock).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        duration: 1500,
        easing: 'linear',
        fill: 'forwards',
        pseudoElement: '::view-transition-new(root)',
      })
    );

    // Complete animation -> should call skipTransition()
    animFinishCallback();
    await animFinishedPromise;
    await new Promise((r) => setTimeout(r, 0));

    expect(skipTransitionMock).toHaveBeenCalledTimes(1);
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
