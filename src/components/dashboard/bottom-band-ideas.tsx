import React from 'react';
import type { NoteWithProject } from '@/lib/actions/notes';
import { RecentIdeasShelf } from '@/components/notes/recent-ideas-shelf';

interface BottomBandIdeasProps {
  initialNotes: NoteWithProject[];
  className?: string;
}

export function BottomBandIdeas({ initialNotes, className = '' }: BottomBandIdeasProps) {
  return (
    <RecentIdeasShelf
      initialNotes={initialNotes}
      className={`h-full ${className}`}
    />
  );
}
