import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useInkThemeTransition } from '@/hooks/use-ink-theme-transition';
import * as inkModule from '@/lib/ink-bleed/inkTransition';
import { inkParams } from '@/lib/ink-bleed/gl/params';

describe('useInkThemeTransition hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as unknown as { window: unknown }).window = {
      innerWidth: 1000,
      innerHeight: 800,
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('calls applyTheme directly when window is undefined', () => {
    // @ts-expect-error simulating SSR
    delete globalThis.window;

    const applyTheme = vi.fn();
    const hook = getHookInstance();
    hook.triggerThemeTransition(null, applyTheme);

    expect(applyTheme).toHaveBeenCalledTimes(1);
  });

  it('delegates to InkTransition.toggle with click coordinates', () => {
    const mockToggle = vi.fn();
    const mockInk = {
      toggle: mockToggle,
    } as unknown as inkModule.InkTransition;

    vi.spyOn(inkModule, 'getGlobalInkTransition').mockReturnValue(mockInk);

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    const mockMouseEvent = {
      clientX: 250,
      clientY: 350,
    } as unknown as React.MouseEvent;

    hook.triggerThemeTransition(mockMouseEvent, applyTheme, { duration: 1500 });

    expect(inkParams.duration).toBe(1.5);
    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith(
      { x: 250, y: 350 },
      undefined,
      applyTheme,
      undefined
    );
  });

  it('delegates to InkTransition.toggle with undefined coordinates on keyboard event', () => {
    const mockToggle = vi.fn();
    const mockInk = {
      toggle: mockToggle,
    } as unknown as inkModule.InkTransition;

    vi.spyOn(inkModule, 'getGlobalInkTransition').mockReturnValue(mockInk);

    const applyTheme = vi.fn();
    const hook = getHookInstance();

    const mockKeyboardEvent = {
      key: 'Enter',
    } as unknown as React.KeyboardEvent;

    hook.triggerThemeTransition(mockKeyboardEvent, applyTheme);

    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith(
      undefined,
      undefined,
      applyTheme,
      undefined
    );
  });
});
