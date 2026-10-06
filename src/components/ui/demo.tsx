'use client';

import * as React from "react";
import { GlassCalendar } from "@/components/ui/glass-calendar";

export default function GlassCalendarDemo() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-stone-50 dark:bg-zinc-950">
      <GlassCalendar 
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        tasks={[
          { title: "Midterms Revision", due_date: "2026-10-07" },
          { title: "Submit CS Assignment", due_date: "2026-10-09" }
        ]}
        projects={[
          { title: "Distributed Systems Lab", target_date: "2026-10-10" }
        ]}
        className="max-w-[380px]"
      />
    </div>
  );
}
