import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { NotesGrid } from '../../src/components/notes/notes-grid';

vi.mock('@/lib/actions/notes', () => ({
  togglePinNote: vi.fn().mockResolvedValue({ success: true }),
  deleteNote: vi.fn().mockResolvedValue({ success: true }),
  promoteNoteToProject: vi.fn().mockResolvedValue({ success: true }),
  createNote: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Stitch NotesGrid Screen', () => {
  it('renders Playfair Display title, calm empty state, and omits fake tag distribution percentages when empty', () => {
    const html = renderToString(<NotesGrid initialNotes={[]} />);

    expect(html).toContain('font-serif text-page-title');
    expect(html).toContain('Notes');
    expect(html).toContain('No ideas captured yet.');
    expect(html).not.toContain('width:40%');
    expect(html).not.toContain('material-symbols-outlined');
    expect(html).not.toContain('italic');
  });

  it('computes real tag distribution when notes are present', () => {
    const html = renderToString(
      <NotesGrid
        initialNotes={[
          {
            id: 'n-1',
            user_id: 'u-1',
            title: 'Caching strategy',
            content: 'Use stale-while-revalidate',
            tags: ['engineering'],
            is_pinned: true,
            is_archived: false,
            project_id: null,
            created_at: '2026-11-18T00:00:00Z',
            updated_at: '2026-11-18T00:00:00Z',
            project: null,
          },
        ]}
      />
    );

    expect(html).toContain('Pinned Notes');
    expect(html).toContain('Caching strategy');
    expect(html).toContain('#engineering: 100%');
  });
});
