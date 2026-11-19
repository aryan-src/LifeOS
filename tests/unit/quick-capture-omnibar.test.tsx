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
});
