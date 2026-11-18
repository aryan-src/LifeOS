import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Modal, getWrappedFocusIndex } from '../../src/components/ui/modal';

describe('Shared Modal Primitive', () => {
  it('renders nothing when closed and renders ARIA dialog with close button when open', () => {
    const closedHtml = renderToString(
      <Modal open={false} onClose={() => undefined} title="Hidden">
        Body
      </Modal>
    );
    expect(closedHtml).toBe('');

    const openHtml = renderToString(
      <Modal open={true} onClose={() => undefined} title="Session Complete" heroTitle={true}>
        <p>Completed 25 minutes.</p>
      </Modal>
    );

    expect(openHtml).toContain('role="dialog"');
    expect(openHtml).toContain('aria-modal="true"');
    expect(openHtml).toContain('aria-label="Close modal"');
    expect(openHtml).toContain('font-serif');
    expect(openHtml).toContain('text-modal-hero');
    expect(openHtml).not.toContain('italic');
  });

  it('uses Geist font-sans by default when heroTitle is false', () => {
    const html = renderToString(
      <Modal open={true} onClose={() => undefined} title="Add Habit">
        <p>Form</p>
      </Modal>
    );

    expect(html).toContain('font-sans');
    expect(html).not.toContain('font-serif');
  });

  it('wraps keyboard focus indices cleanly forward and backward', () => {
    expect(getWrappedFocusIndex(0, 3, false)).toBe(1);
    expect(getWrappedFocusIndex(2, 3, false)).toBe(0);
    expect(getWrappedFocusIndex(-1, 3, false)).toBe(0);
    expect(getWrappedFocusIndex(0, 3, true)).toBe(2);
    expect(getWrappedFocusIndex(1, 3, true)).toBe(0);
    expect(getWrappedFocusIndex(0, 0, false)).toBe(-1);
  });
});
