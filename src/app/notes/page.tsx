import React from 'react';
import { Shell } from '@/components/layout/shell';
import { NotesGrid } from '@/components/notes/notes-grid';
import { getNotes } from '@/lib/actions/notes';

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <Shell>
      <div className="w-full">
        <NotesGrid initialNotes={notes} />
      </div>
    </Shell>
  );
}

