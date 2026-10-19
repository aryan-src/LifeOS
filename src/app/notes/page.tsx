import React from 'react';
import type { Metadata } from 'next';
import { NotesGrid } from '@/components/notes/notes-grid';
import { getNotes } from '@/lib/actions/notes';

export const metadata: Metadata = {
  title: 'Notes',
  description: 'Scratchpad and idea capture with one-click promotion to active projects.',
};

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="flex flex-col w-full">
      <div className="w-full">
        <NotesGrid initialNotes={notes} />
      </div>
    </div>
  );
}

