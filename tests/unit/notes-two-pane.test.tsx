import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { NotesGrid } from '../../src/components/notes/notes-grid';
import type { NoteWithProject } from '../../src/lib/actions/notes';

vi.mock('@/lib/actions/notes', () => ({
  togglePinNote: vi.fn().mockResolvedValue({ success: true }),
  deleteNote: vi.fn().mockResolvedValue({ success: true }),
  promoteNoteToProject: vi.fn().mockResolvedValue({ success: true }),
  createNote: vi.fn().mockResolvedValue({ success: true }),
}));

const sampleNotes: NoteWithProject[] = [
  {
    id: 'note-1',
    user_id: 'user-1',
    title: 'Discrete Mathematics: Graph Theory & Trees',
    content:
      'Formal axioms regarding acyclic connected subgraphs, spanning tree cardinality, Cayley formulation, and edge deletion properties in simple connected components.',
    tags: ['academics', 'math'],
    is_pinned: true,
    is_archived: false,
    project_id: null,
    created_at: '2026-11-18T14:40:00Z',
    updated_at: '2026-11-18T14:40:00Z',
    project: null,
  },
  {
    id: 'note-2',
    user_id: 'user-1',
    title: 'Tactile Architecture & Paper UI Design Principles',
    content:
      'Restraint versus flat sterility: anchoring spatial orientation with warm paper textures, typographic hierarchy, and discrete hairline structures devoid of excessive blurs.',
    tags: ['architecture'],
    is_pinned: false,
    is_archived: false,
    project_id: 'proj-1',
    created_at: '2026-11-17T10:00:00Z',
    updated_at: '2026-11-17T10:00:00Z',
    project: {
      id: 'proj-1',
      title: 'Design System',
      slug: 'design-system',
    },
  },
];

describe('Notes Two-Pane Master-Detail View', () => {
  it('renders two-pane layout with note stream and active note inspector', () => {
    const html = renderToString(<NotesGrid initialNotes={sampleNotes} />).replace(
      /<!--.*?-->/g,
      ''
    );

    // Left pane list
    expect(html).toContain('Sorted by Modified');
    expect(html).toContain('1 pinned / 1 stream');
    expect(html).toContain('Discrete Mathematics: Graph Theory');
    expect(html).toContain('Tactile Architecture');

    // Right pane detail inspector
    expect(html).toContain('Formal axioms regarding acyclic connected subgraphs');
    expect(html).toContain('Ready to execute on this note?');
  });

  it('renders linked project banner when note is promoted', () => {
    const html = renderToString(
      <NotesGrid initialNotes={[sampleNotes[1]]} />
    ).replace(/<!--.*?-->/g, '');

    expect(html).toContain('Linked Project: #design-system');
  });
});
