/**
 * Timezone and Date utilities for LifeOS.
 * Standardized on Indian Standard Time (IST - Asia/Kolkata).
 *
 * Deterministic formatters prevent Vercel UTC serverless drift (where after midnight
 * in IST, UTC servers still report the previous day's date).
 */

export const APP_TIMEZONE = 'Asia/Kolkata';

const istDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Returns the current date formatted as YYYY-MM-DD in IST.
 */
export function getTodayDate(date: Date = new Date()): string {
  return istDateFormatter.format(date);
}

/**
 * Returns tomorrow's date formatted as YYYY-MM-DD in IST.
 */
export function getTomorrowDate(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return getTodayDate(tomorrow);
}

/**
 * Returns yesterday's date formatted as YYYY-MM-DD in IST.
 */
export function getYesterdayDate(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return getTodayDate(yesterday);
}

/**
 * Formats a Date or ISO string into a human-readable string in IST.
 * e.g., "07 Oct 2026" or "Wednesday, 7 October 2026"
 */
export function formatDateIST(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    ...options,
  }).format(d);
}

/**
 * Generates trailing N days including today in IST.
 */
export function getTrailingDays(count: number = 7): Array<{
  date: string;
  dayLabel: string;
  isToday: boolean;
}> {
  const todayStr = getTodayDate();
  const days: Array<{ date: string; dayLabel: string; isToday: boolean }> = [];
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: APP_TIMEZONE,
  });

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dStr = getTodayDate(d);
    days.push({
      date: dStr,
      dayLabel: dayFormatter.format(d),
      isToday: dStr === todayStr,
    });
  }

  return days;
}

/**
 * Deterministically formats strict YYYY-MM-DD database strings without timezone shifts.
 * Prevents server (UTC) vs client (IST/local) day/hour mismatch hydration crashes.
 */
export function formatCalendarDate(
  dateInput: string | Date | null | undefined,
  format: 'short' | 'medium' | 'full' | 'header' = 'medium'
): string {
  if (!dateInput) return '';

  let dateStr: string;
  if (typeof dateInput === 'string') {
    dateStr = dateInput.split('T')[0];
  } else {
    dateStr = getTodayDate(dateInput);
  }

  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12) return dateStr;

  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Construct absolute local date without UTC midnight shifts
  const dateObj = new Date(y, m - 1, d);
  const dayName = shortDays[dateObj.getDay()] || '';
  const shortMonth = shortMonths[m - 1] || '';
  const fullMonth = fullMonths[m - 1] || '';

  if (format === 'header') {
    return `${dayName}, ${d} ${shortMonth}`;
  }
  if (format === 'short') {
    return `${shortMonth} ${d}`;
  }
  if (format === 'full') {
    return `${fullMonth} ${d}, ${y}`;
  }
  return `${d} ${shortMonth} ${y}`;
}
