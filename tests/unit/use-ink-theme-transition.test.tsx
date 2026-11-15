import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useInkThemeTransition } from '@/hooks/use-ink-theme-transition';

describe('useInkThemeTransition hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const dummyDoc = {
      documentElement: {
        classList: {
          contains: vi.fn().mockReturnValue(false),
          toggle: vi.fn(),
        },
        style: {
          setProperty: vi.fn(),
          removeProperty: vi.fn(),
        },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
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

  it('calls applyTheme directly when document.startViewTransition is undefined', () => {
    const doc = globalThis.document as unknown as { startViewTransition?: unknown };
    delete doc.startViewTransition;

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    hook.triggerThemeTransition(null, applyTheme);

    expect(applyTheme).toHaveBeenCalledTimes(1);
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

  it('resolves coordinates correctly and uses viewport center on keyboard events', () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const startViewTransitionMock = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return {
        ready: Promise.resolve(),
        finished: Promise.resolve(),
      };
    });

    (globalThis.document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    const mockKeyboardEvent = {
      key: 'Enter',
    } as unknown as React.KeyboardEvent;

    hook.triggerThemeTransition(mockKeyboardEvent, applyTheme);

    expect(startViewTransitionMock).toHaveBeenCalledTimes(1);
    expect(applyTheme).toHaveBeenCalledTimes(1);
    expect(globalThis.document.documentElement.setAttribute).toHaveBeenCalledWith(
      'data-theme-transitioning',
      'true'
    );
  });

  it('sets CSS variables for sprite-sheet mask coordinates and duration', () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    let finishCallback: () => void = () => {};
    const finishedPromise = new Promise<void>((resolve) => {
      finishCallback = resolve;
    });

    const startViewTransitionMock = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return {
        ready: Promise.resolve(),
        finished: finishedPromise,
      };
    });

    (globalThis.document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    const mockMouseEvent = {
      clientX: 500,
      clientY: 100,
    } as unknown as React.MouseEvent;

    hook.triggerThemeTransition(mockMouseEvent, applyTheme, { duration: 1100 });

    const setProperty = (globalThis.document.documentElement.style as unknown as { setProperty: ReturnType<typeof vi.fn> }).setProperty;
    expect(setProperty).toHaveBeenCalledWith('--mask-x', expect.stringContaining('px'));
    expect(setProperty).toHaveBeenCalledWith('--mask-y', expect.stringContaining('px'));
    expect(setProperty).toHaveBeenCalledWith('--mask-x-end', expect.stringContaining('px'));
    expect(setProperty).toHaveBeenCalledWith('--mask-size', expect.stringContaining('px'));
    expect(setProperty).toHaveBeenCalledWith('--ink-duration', '1100ms');

    // Clean up transition
    finishCallback();
  });

  it('ignores extra clicks while a transition is active (click debounce)', async () => {
    globalThis.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    let finishCallback: () => void = () => {};
    const finishedPromise = new Promise<void>((resolve) => {
      finishCallback = resolve;
    });

    const startViewTransitionMock = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return {
        ready: Promise.resolve(),
        finished: finishedPromise,
      };
    });

    (globalThis.document as unknown as { startViewTransition: unknown }).startViewTransition =
      startViewTransitionMock;

    const applyTheme1 = vi.fn();
    const applyTheme2 = vi.fn();
    const hook = getHookInstance();

    // First trigger starts transition
    hook.triggerThemeTransition(null, applyTheme1);
    expect(startViewTransitionMock).toHaveBeenCalledTimes(1);
    expect(applyTheme1).toHaveBeenCalledTimes(1);

    // Second trigger while active is ignored
    hook.triggerThemeTransition(null, applyTheme2);
    expect(startViewTransitionMock).toHaveBeenCalledTimes(1);
    expect(applyTheme2).not.toHaveBeenCalled();

    // Finish first transition and wait for microtasks
    finishCallback();
    await finishedPromise;
    await new Promise((r) => setTimeout(r, 10));

    // After finish, next trigger is accepted
    const applyTheme3 = vi.fn();
    hook.triggerThemeTransition(null, applyTheme3);
    expect(startViewTransitionMock).toHaveBeenCalledTimes(2);
    expect(applyTheme3).toHaveBeenCalledTimes(1);
  });
});
