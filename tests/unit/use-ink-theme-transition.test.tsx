import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useInkThemeTransition } from '@/hooks/use-ink-theme-transition';

describe('useInkThemeTransition hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const dummyDoc = {
      documentElement: {
        style: {
          setProperty: vi.fn(),
          removeProperty: vi.fn(),
        },
      },
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

  it('executes startViewTransition when supported and reduced-motion is false', () => {
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

    // createElement for canvas in node mock
    (globalThis.document as unknown as { createElement: unknown }).createElement = vi.fn().mockReturnValue({
      getContext: vi.fn().mockReturnValue(null), // returns null to test fallback path
    });

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    const mockMouseEvent = {
      clientX: 300,
      clientY: 400,
    } as unknown as React.MouseEvent;

    hook.triggerThemeTransition(mockMouseEvent, applyTheme);

    expect(startViewTransitionMock).toHaveBeenCalledTimes(1);
    expect(applyTheme).toHaveBeenCalledTimes(1);
  });

  it('falls back to viewport center when triggered via keyboard event', () => {
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

    (globalThis.document as unknown as { createElement: unknown }).createElement = vi.fn().mockReturnValue({
      getContext: vi.fn().mockReturnValue(null),
    });

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    const mockKeyboardEvent = {
      key: 'Enter',
    } as unknown as React.KeyboardEvent;

    hook.triggerThemeTransition(mockKeyboardEvent, applyTheme);

    expect(startViewTransitionMock).toHaveBeenCalledTimes(1);
    expect(applyTheme).toHaveBeenCalledTimes(1);
  });
});
