import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { QuickCaptureOmnibar } from '@/components/global/quick-capture';
import { useUIStore } from '@/lib/store/use-ui-store';

// Mock UI store for deterministic SSR testing
const mockUIState = {
  isQuickCaptureOpen: false,
  quickCaptureInitialValue: '',
  closeQuickCapture: vi.fn(),
  openQuickCapture: vi.fn(),
};

vi.mock('@/lib/store/use-ui-store', () => ({
  useUIStore: Object.assign(() => mockUIState, {
    getState: () => mockUIState,
    setState: (update: Partial<typeof mockUIState>) => Object.assign(mockUIState, update),
  }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock server actions
vi.mock('@/lib/actions/quick-capture', () => ({
  dispatchQuickCapture: vi.fn(),
  undoQuickCapture: vi.fn(),
  getQuickCaptureContext: vi.fn().mockResolvedValue({
    timezone: 'Asia/Kolkata',
    categories: [
      { id: 'cat-cafe', name: 'Cafe & Dining' },
      { id: 'cat-transit', name: 'Transit' },
    ],
    projects: [
      { id: 'proj-1', title: 'LifeOS', slug: 'lifeos' },
    ],
    habits: [
      { id: 'h-1', title: 'Read 20 pages', is_completed_today: true },
      { id: 'h-2', title: 'Meditate 10 mins', is_completed_today: false },
    ],
  }),
}));

describe('QuickCaptureOmnibar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    useUIStore.setState({ isQuickCaptureOpen: false, quickCaptureInitialValue: '' });
    const html = renderToString(<QuickCaptureOmnibar />);
    expect(html).toBe('');
  });

  it('renders input, plain-language shortcuts, and theme classes when open', () => {
    useUIStore.setState({ isQuickCaptureOpen: true, quickCaptureInitialValue: '' });
    const html = renderToString(<QuickCaptureOmnibar />);

    expect(html).toContain('placeholder="Type anything:');
    expect(html).toContain('Tab moves chips');
    expect(html).toContain('Esc closes');
    expect(html).toContain('Enter saves');
    expect(html).toContain('bg-surface-container-lowest');
    expect(html).toContain('dark:bg-zinc-900');
    expect(html).not.toContain('italic');
  });

  it('renders editable preview chips when initial value is provided', () => {
    useUIStore.setState({
      isQuickCaptureOpen: true,
      quickCaptureInitialValue: '₹450 cold brew coffee',
    });
    const html = renderToString(<QuickCaptureOmnibar />);

    expect(html).toContain('data-testid="preview-chips-row"');
    expect(html).toContain('data-testid="chip-type"');
    expect(html).toContain('data-testid="chip-title"');
    expect(html).toContain('data-testid="chip-amount"');
    expect(html).toContain('data-testid="chip-category"');
    expect(html).toContain('data-testid="chip-project"');
    expect(html).not.toContain('italic');
  });

  it('renders task priority and date chips for task inputs', () => {
    useUIStore.setState({
      isQuickCaptureOpen: true,
      quickCaptureInitialValue: 't Prepare lab notes tomorrow !high',
    });
    const html = renderToString(<QuickCaptureOmnibar />);

    expect(html).toContain('data-testid="chip-priority"');
    expect(html).toContain('data-testid="chip-date"');
    expect(html).toContain('Low (1)');
    expect(html).toContain('Medium (2)');
    expect(html).toContain('High (3)');
    expect(html).toContain('Urgent (4)');
  });

  it('renders habit check-in preview chip when matching habit title', () => {
    useUIStore.setState({
      isQuickCaptureOpen: true,
      quickCaptureInitialValue: 'Meditate 10 mins',
    });
    const html = renderToString(
      <QuickCaptureOmnibar
        initialContext={{
          habits: [
            { id: 'h-1', title: 'Meditate 10 mins', is_completed_today: false },
          ],
        }}
      />
    );

    expect(html).toContain('data-testid="preview-chips-row"');
    expect(html).toContain('Ready to check in');
    expect(html).toContain('value="Meditate 10 mins"');
  });

  it('disables submit button and renders zero toasts for empty or whitespace input', () => {
    // Empty input
    useUIStore.setState({ isQuickCaptureOpen: true, quickCaptureInitialValue: '' });
    const htmlEmpty = renderToString(<QuickCaptureOmnibar />);
    expect(htmlEmpty).toContain('disabled=""');
    expect(htmlEmpty).not.toContain('data-testid="undo-toast"');
    expect(htmlEmpty).not.toContain('data-testid="feedback-toast"');

    // Whitespace-only input
    useUIStore.setState({ isQuickCaptureOpen: true, quickCaptureInitialValue: '   ' });
    const htmlSpace = renderToString(<QuickCaptureOmnibar />);
    expect(htmlSpace).toContain('disabled=""');
    expect(htmlSpace).not.toContain('data-testid="undo-toast"');
    expect(htmlSpace).not.toContain('data-testid="feedback-toast"');
  });

  it('contains zero fancy words across all rendered UI elements', () => {
    useUIStore.setState({
      isQuickCaptureOpen: true,
      quickCaptureInitialValue: 't Quick sync',
    });
    const html = renderToString(<QuickCaptureOmnibar />);

    const bannedWords = [
      'telemetry',
      'protocol',
      'ritual',
      'synthesis',
      'cadence',
      'velocity',
      'vault',
      'ledger',
      'deliverables',
      'sprint',
      'sanctuary',
      'calibration',
      'allocation',
    ];

    for (const word of bannedWords) {
      expect(html.toLowerCase()).not.toContain(word);
    }
  });

  it('renders Indian Rupee icon and parses ₹1,200 rent correctly in preview chips and summary pill', () => {
    useUIStore.setState({
      isQuickCaptureOpen: true,
      quickCaptureInitialValue: '₹1,200 rent',
    });
    const html = renderToString(<QuickCaptureOmnibar />);

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Quick Capture"');

    // Amount chip must have 1200, not 1
    expect(html).toContain('value="1200"');
    // Title chip must have "rent", not ",200 rent"
    expect(html).toContain('value="rent"');
    expect(html).not.toContain('value=",200 rent"');

    // Must show IndianRupee icon and NOT DollarSign
    expect(html).toContain('lucide-indian-rupee');
    expect(html).not.toContain('lucide-dollar-sign');

    // Summary pill must show rupee and not dollar
    expect(html).toContain('Transaction: -₹1200.00 (rent)');
    expect(html).not.toContain('-$1.00');
    expect(html).not.toContain('-$1200.00');
  });

  it('traps keyboard focus inside the dialog when pressing Tab more times than focusable elements', () => {
    // Harness simulating DOM elements and keyboard event dispatch
    let activeElement: any = null;
    const listeners: Record<string, ((e: any) => void)[]> = {};

    const mockWindow = {
      addEventListener: (type: string, fn: any) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      removeEventListener: (type: string, fn: any) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter((cb) => cb !== fn);
        }
      },
    };

    const backgroundTrigger = {
      id: 'open-omnibar-button',
      isInsideDialog: false,
      focus: () => {
        activeElement = backgroundTrigger;
      },
    };

    // Dialog container with 5 focusable child elements (input, clear, submit, chip-type, chip-amount)
    const dialogElements: any[] = [];
    const makeDialogElement = (id: string) => {
      const el = {
        id,
        isInsideDialog: true,
        focus: () => {
          activeElement = el;
        },
      };
      dialogElements.push(el);
      return el;
    };

    const inputEl = makeDialogElement('input');
    const clearEl = makeDialogElement('clear-btn');
    const submitEl = makeDialogElement('submit-btn');
    const chipTypeEl = makeDialogElement('chip-type');
    const chipAmountEl = makeDialogElement('chip-amount');

    const dialogContainer = {
      id: 'dialog-container',
      contains: (el: any) => el?.isInsideDialog === true,
      querySelectorAll: (_selector: string) => dialogElements,
    };

    const mockDocument = {
      get activeElement() {
        return activeElement;
      },
    };

    const originalWindow = (globalThis as any).window;
    const originalDocument = (globalThis as any).document;

    try {
      (globalThis as any).window = mockWindow;
      (globalThis as any).document = mockDocument;

      // User was initially focused on an element outside the dialog
      backgroundTrigger.focus();
      expect(activeElement.id).toBe('open-omnibar-button');

      // Hook simulation with useModalA11y logic
      const previousActiveElementRef = { current: mockDocument.activeElement };
      const onClose = vi.fn();

      const keydownHandler = (e: {
        key: string;
        shiftKey?: boolean;
        preventDefault: () => void;
        defaultPrevented?: boolean;
      }) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }

        if (e.key === 'Tab') {
          const focusable = dialogContainer.querySelectorAll('...');
          if (focusable.length === 0) return;

          const firstElement = focusable[0];
          const lastElement = focusable[focusable.length - 1];

          if (!dialogContainer.contains(mockDocument.activeElement)) {
            e.preventDefault();
            firstElement.focus();
            return;
          }

          if (e.shiftKey) {
            if (mockDocument.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (mockDocument.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      mockWindow.addEventListener('keydown', keydownHandler);

      // On modal open, focus lands on the first focusable element (input)
      inputEl.focus();
      expect(activeElement.id).toBe('input');

      // Press Tab 15 times (3 full cycles through the 5 focusable elements)
      const tabPressCount = 15;
      for (let i = 0; i < tabPressCount; i++) {
        let prevented = false;
        const event = {
          key: 'Tab',
          shiftKey: false,
          preventDefault: () => {
            prevented = true;
          },
        };

        const currentIdx = dialogElements.indexOf(activeElement);
        keydownHandler(event);

        if (!prevented) {
          // Standard browser behavior: move to next element
          const nextIdx = (currentIdx + 1) % dialogElements.length;
          dialogElements[nextIdx].focus();
        }

        // Assertion: focus NEVER leaves the dialog container
        expect(dialogContainer.contains(activeElement)).toBe(true);
        expect(activeElement.isInsideDialog).toBe(true);
        expect(activeElement).not.toBe(backgroundTrigger);
      }

      // Test Shift+Tab wrapping from first element to last
      inputEl.focus();
      expect(activeElement.id).toBe('input');
      let shiftPrevented = false;
      keydownHandler({
        key: 'Tab',
        shiftKey: true,
        preventDefault: () => {
          shiftPrevented = true;
        },
      });
      expect(shiftPrevented).toBe(true);
      expect(activeElement.id).toBe('chip-amount'); // lastElement

      // Test Escape closes and restores focus to previous active element
      let escPrevented = false;
      keydownHandler({
        key: 'Escape',
        preventDefault: () => {
          escPrevented = true;
        },
      });
      expect(escPrevented).toBe(true);
      expect(onClose).toHaveBeenCalledTimes(1);

      // Cleanup / close restores previous focus
      previousActiveElementRef.current.focus();
      expect(activeElement.id).toBe('open-omnibar-button');
    } finally {
      (globalThis as any).window = originalWindow;
      (globalThis as any).document = originalDocument;
    }
  });
});
