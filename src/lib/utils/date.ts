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
