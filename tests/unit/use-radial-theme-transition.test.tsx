import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useRadialThemeTransition } from '@/hooks/use-radial-theme-transition';

describe('useRadialThemeTransition Hook', () => {
  function getHook() {
    let hookResult!: ReturnType<typeof useRadialThemeTransition>;
    function Harness() {
      hookResult = useRadialThemeTransition();
      return null;
    }
    renderToString(<Harness />);
    return hookResult;
  }

  describe('SSR / Node Environment', () => {
    it('calls applyThemeState directly when window or document is undefined', () => {
      const hook = getHook();
      const applyThemeState = vi.fn();

      hook.triggerThemeTransition(null, 'dark', applyThemeState);
      expect(applyThemeState).toHaveBeenCalledWith('dark');
    });
  });

  describe('Browser Environment with Mocked DOM', () => {
    let mockElement: any;
    let originalWindow: any;
    let originalDocument: any;

    beforeEach(() => {
      mockElement = {
        classList: {
          contains: vi.fn((cls: string) => false),
          toggle: vi.fn(),
          add: vi.fn(),
          remove: vi.fn(),
        },
        style: {
          colorScheme: '',
          setProperty: vi.fn(),
          removeProperty: vi.fn(),
        },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        getAttribute: vi.fn(),
        animate: vi.fn(),
      };

      originalWindow = (globalThis as any).window;
      originalDocument = (globalThis as any).document;

      (globalThis as any).window = {
        innerWidth: 1000,
        innerHeight: 800,
        matchMedia: vi.fn((query: string) => ({
          matches: false,
          media: query,
        })),
      };

      (globalThis as any).document = {
        documentElement: mockElement,
        createElement: vi.fn((tag: string) => {
          if (tag === 'canvas') {
            return {
              getContext: vi.fn(() => null),
              width: 960,
              height: 540,
              toDataURL: vi.fn(() => 'data:image/webp;base64,mockWebP'),
            };
          }
          return {};
        }),
      };
    });

    afterEach(() => {
      (globalThis as any).window = originalWindow;
      (globalThis as any).document = originalDocument;
      vi.restoreAllMocks();
    });

    it('falls back to synchronous DOM updates when startViewTransition is unsupported', () => {
      const hook = getHook();
      const applyThemeState = vi.fn();

      hook.triggerThemeTransition(null, 'dark', applyThemeState);

      expect(applyThemeState).toHaveBeenCalledWith('dark');
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('dark', true);
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      expect(mockElement.style.colorScheme).toBe('dark');
      expect(mockElement.setAttribute).not.toHaveBeenCalledWith('data-theme-transitioning', 'true');
    });

    it('sets dark mode and dark colorScheme when transitioning to monsoon-night', () => {
      const hook = getHook();
      const applyThemeState = vi.fn();

      hook.triggerThemeTransition(null, 'monsoon-night', applyThemeState);

      expect(applyThemeState).toHaveBeenCalledWith('monsoon-night');
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('dark', true);
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-theme', 'monsoon-night');
      expect(mockElement.style.colorScheme).toBe('dark');
    });

    it('bypasses view transition when prefers-reduced-motion matches', () => {
      const hook = getHook();
      const applyThemeState = vi.fn();
      const startViewTransition = vi.fn();
      (globalThis as any).document.startViewTransition = startViewTransition;

      (globalThis as any).window.matchMedia = vi.fn((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
      }));

      hook.triggerThemeTransition(null, 'light', applyThemeState);

      expect(startViewTransition).not.toHaveBeenCalled();
      expect(applyThemeState).toHaveBeenCalledWith('light');
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('dark', false);
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
      expect(mockElement.style.colorScheme).toBe('light');
    });

    it('initiates View Transition and runs root.animate with radial circle clipPath on click coordinates', async () => {
      const hook = getHook();
      const applyThemeState = vi.fn();

      let transitionCb: () => void = () => {};
      let resolveReady: () => void = () => {};
      let resolveFinished: () => void = () => {};

      const readyPromise = new Promise<void>((res) => { resolveReady = res; });
      const finishedPromise = new Promise<void>((res) => { resolveFinished = res; });

      (globalThis as any).document.startViewTransition = vi.fn((cb: () => void) => {
        transitionCb = cb;
        return {
          ready: readyPromise,
          finished: finishedPromise,
        };
      });

      const mockEvent = {
        clientX: 200,
        clientY: 300,
      } as unknown as React.MouseEvent;

      hook.triggerThemeTransition(mockEvent, 'dark', applyThemeState, { duration: 400 });

      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-theme-transitioning', 'true');
      expect((globalThis as any).document.startViewTransition).toHaveBeenCalled();

      // Trigger transition callback
      transitionCb();
      expect(applyThemeState).toHaveBeenCalledWith('dark');
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('dark', true);

      // Resolve ready to trigger root.animate
      resolveReady();
      await readyPromise;

      // Calculate expected radius: max(200, 1000-200=800)=800, max(300, 800-300=500)=500 => hypot(800, 500)
      const expectedEndRadius = Math.hypot(800, 500);

      expect(mockElement.animate).toHaveBeenCalledWith(
        {
          clipPath: [
            'circle(0px at 200px 300px)',
            `circle(${expectedEndRadius}px at 200px 300px)`,
          ],
        },
        {
          duration: 400,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
          pseudoElement: '::view-transition-new(root)',
        }
      );

      // Resolve finished to clean up data-theme-transitioning
      resolveFinished();
      await finishedPromise;

      expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-theme-transitioning');
    });

    it('sets data-transition-dir and data-theme-transitioning on documentElement during transition', async () => {
      const hook = getHook();
      const applyThemeState = vi.fn();

      let transitionCb: () => void = () => {};
      let resolveFinished: () => void = () => {};
      const readyPromise = Promise.resolve();
      const finishedPromise = new Promise<void>((res) => { resolveFinished = res; });

      (globalThis as any).document.startViewTransition = vi.fn((cb: () => void) => {
        transitionCb = cb;
        return {
          ready: readyPromise,
          finished: finishedPromise,
        };
      });

      hook.triggerThemeTransition(null, 'dark', applyThemeState);

      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-transition-dir', 'to-dark');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-theme-transitioning', 'true');

      transitionCb();

      resolveFinished();
      await finishedPromise;

      expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-theme-transitioning');
      expect(mockElement.removeAttribute).toHaveBeenCalledWith('data-transition-dir');
      expect(mockElement.style.removeProperty).toHaveBeenCalledWith('--ink-mask');
    });

    it('falls back to viewport center coordinates when triggered by keyboard (clientX=0, clientY=0)', async () => {
      const hook = getHook();
      const applyThemeState = vi.fn();

      let resolveReady: () => void = () => {};
      let resolveFinished: () => void = () => {};
      const readyPromise = new Promise<void>((res) => { resolveReady = res; });
      const finishedPromise = new Promise<void>((res) => { resolveFinished = res; });

      (globalThis as any).document.startViewTransition = vi.fn((cb: () => void) => {
        cb();
        return {
          ready: readyPromise,
          finished: finishedPromise,
        };
      });

      const mockKeyboardEvent = {
        clientX: 0,
        clientY: 0,
      } as unknown as React.MouseEvent;

      hook.triggerThemeTransition(mockKeyboardEvent, 'tui', applyThemeState);

      resolveReady();
      await readyPromise;

      // Viewport center: x = 1000/2 = 500, y = 800/2 = 400
      // hypot(max(500, 500), max(400, 400)) = hypot(500, 400)
      const expectedEndRadius = Math.hypot(500, 400);

      expect(mockElement.animate).toHaveBeenCalledWith(
        {
          clipPath: [
            'circle(0px at 500px 400px)',
            `circle(${expectedEndRadius}px at 500px 400px)`,
          ],
        },
        expect.objectContaining({
          duration: 1400,
          pseudoElement: '::view-transition-new(root)',
        })
      );
    });
  });
});
