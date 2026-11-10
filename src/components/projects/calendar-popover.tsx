'use client';

import React, { useState, useEffect } from 'react';

export interface CalendarPopoverProps {
  selectedIsoDate?: string; // 'YYYY-MM-DD'
  onSelectDate: (isoDate: string, displayDate: string) => void;
  onClear: () => void;
  onClose?: () => void;
  className?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarPopover({
  selectedIsoDate = '',
  onSelectDate,
  onClear,
  onClose,
  className = '',
}: CalendarPopoverProps) {
  // Determine initial viewing date based on selected date or current date
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedIsoDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedIsoDate)) {
      const [y, m] = selectedIsoDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  // Sync viewing month when selected date changes externally
  useEffect(() => {
    if (selectedIsoDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedIsoDate)) {
      const [y, m] = selectedIsoDate.split('-').map(Number);
      setViewDate(new Date(y, m - 1, 1));
    }
  }, [selectedIsoDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = MONTH_NAMES[month];

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handlePrevYear = () => {
    setViewDate(new Date(year - 1, month, 1));
  };

  const handleNextYear = () => {
    setViewDate(new Date(year + 1, month, 1));
  };

  const handleSelectDay = (day: number) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    const display = `${d}/${m}/${y}`;
    onSelectDate(iso, display);
    onClose?.();
  };

  const handleSelectLeadingDay = (day: number) => {
    const prevDate = new Date(year, month - 1, 1);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    const display = `${d}/${m}/${y}`;
    setViewDate(prevDate);
    onSelectDate(iso, display);
    onClose?.();
  };

  const handleSelectTrailingDay = (day: number) => {
    const nextDate = new Date(year, month + 1, 1);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    const display = `${d}/${m}/${y}`;
    setViewDate(nextDate);
    onSelectDate(iso, display);
    onClose?.();
  };

  const handleToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    const display = `${d}/${m}/${y}`;
    setViewDate(new Date(y, now.getMonth(), 1));
    onSelectDate(iso, display);
    onClose?.();
  };

  const handleClear = () => {
    onClear();
    onClose?.();
  };

  // Calendar math
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 for Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const leadingDaysCount = firstDayOfWeek;
  const leadingDays: number[] = [];
  for (let i = leadingDaysCount - 1; i >= 0; i--) {
    leadingDays.push(daysInPrevMonth - i);
  }

  const currentDays: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const totalCellsSoFar = leadingDaysCount + daysInMonth;
  const trailingDaysCount = (7 - (totalCellsSoFar % 7)) % 7;
  const trailingDays: number[] = Array.from({ length: trailingDaysCount }, (_, i) => i + 1);

  return (
    <div
      data-purpose="calendar-popover"
      className={`w-[336px] max-w-[calc(100vw-2rem)] bg-[#FAF9F5] dark:bg-[#090A0F] border border-stone-200/90 dark:border-zinc-800/90 rounded-2xl shadow-card shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200 select-none text-stone-800 dark:text-zinc-200 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popover Header: Month Selector & Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setIsMonthPickerOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-stone-900 dark:text-zinc-100 hover:bg-stone-200/60 dark:hover:bg-zinc-800/60 rounded-lg transition-colors group cursor-pointer"
        >
          <span>{`${monthName} ${year}`}</span>
          <svg
            className={`w-3.5 h-3.5 text-stone-500 dark:text-zinc-400 group-hover:text-stone-800 dark:group-hover:text-zinc-200 transition-transform ${
              isMonthPickerOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={isMonthPickerOpen ? handlePrevYear : handlePrevMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200/60 dark:hover:bg-zinc-800/60 transition-colors border border-stone-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 shadow-xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={isMonthPickerOpen ? handleNextYear : handleNextMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-200/60 dark:hover:bg-zinc-800/60 transition-colors border border-stone-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 shadow-xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {isMonthPickerOpen ? (
        /* Quick Month / Year Selector Grid */
        <div className="grid grid-cols-3 gap-2 py-2">
          {SHORT_MONTHS.map((mName, mIdx) => {
            const isCurr = mIdx === month;
            return (
              <button
                key={mName}
                type="button"
                onClick={() => {
                  setViewDate(new Date(year, mIdx, 1));
                  setIsMonthPickerOpen(false);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isCurr
                    ? 'bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs'
                    : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                {mName}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          {/* Day of Week Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {DAYS_OF_WEEK.map((dayLabel, idx) => (
              <span
                key={`${dayLabel}-${idx}`}
                className="text-[11px] font-mono font-semibold text-stone-400 dark:text-zinc-500 tracking-wider py-1"
              >
                {dayLabel}
              </span>
            ))}
          </div>

          {/* Calendar Date Grid */}
          <div className="grid grid-cols-7 gap-1 text-center" id="calendar-grid">
            {/* Leading days (faded) */}
            {leadingDays.map((ld) => (
              <button
                type="button"
                key={`leading-${ld}`}
                onClick={() => handleSelectLeadingDay(ld)}
                className="h-9 w-9 flex items-center justify-center text-stone-300 dark:text-zinc-600 text-xs font-mono select-none mx-auto hover:text-stone-500 dark:hover:text-zinc-400 rounded-lg hover:bg-stone-200/40 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
              >
                {ld}
              </button>
            ))}

            {/* Current month days */}
            {currentDays.map((d) => {
              const currentIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = selectedIsoDate === currentIso;

              if (isSelected) {
                return (
                  <button
                    key={`curr-${d}`}
                    type="button"
                    onClick={() => handleSelectDay(d)}
                    className="bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-xl shadow-md scale-105 flex items-center justify-center h-9 w-9 ring-1 ring-emerald-500/50 mx-auto relative group cursor-pointer"
                  >
                    <span className="text-sm">{d}</span>
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />
                  </button>
                );
              }

              return (
                <button
                  key={`curr-${d}`}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-stone-700 dark:text-zinc-300 text-sm font-medium hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition-colors mx-auto cursor-pointer"
                >
                  {d}
                </button>
              );
            })}

            {/* Trailing days (faded) */}
            {trailingDays.map((td) => (
              <button
                type="button"
                key={`trailing-${td}`}
                onClick={() => handleSelectTrailingDay(td)}
                className="h-9 w-9 flex items-center justify-center text-stone-300 dark:text-zinc-600 text-xs font-mono select-none mx-auto hover:text-stone-500 dark:hover:text-zinc-400 rounded-lg hover:bg-stone-200/40 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
              >
                {td}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Popover Footer: Clear and Today buttons */}
      <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-medium text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors px-1.5 py-1 rounded hover:bg-stone-200/50 dark:hover:bg-zinc-800/50 cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleToday}
          className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs cursor-pointer"
        >
          Today
        </button>
      </div>
    </div>
  );
}

export default CalendarPopover;
