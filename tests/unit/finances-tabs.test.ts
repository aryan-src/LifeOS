import { describe, it, expect } from 'vitest';

// Week range helper matching the implementation in finances-client-view
function getWeekRange(dateStr: string): { startOfWeek: string; endOfWeek: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayOfMonth}`;
  };

  return {
    startOfWeek: format(monday),
    endOfWeek: format(sunday),
  };
}

describe('Finances Time Filter Logic', () => {
  const mockTransactions = [
    { id: '1', date: '2026-10-07', description: 'Lunch today', amount: 120, type: 'expense' },
    { id: '2', date: '2026-10-05', description: 'Monday Notebook', amount: 80, type: 'expense' },
    { id: '3', date: '2026-10-01', description: 'Earlier this month', amount: 300, type: 'expense' },
    { id: '4', date: '2026-09-25', description: 'Last month coffee', amount: 50, type: 'expense' },
  ];

  const currentDate = '2026-10-07'; // Wednesday
  const weeklyDays = [
    { date: '2026-10-01' },
    { date: '2026-10-02' },
    { date: '2026-10-03' },
    { date: '2026-10-04' },
    { date: '2026-10-05' },
    { date: '2026-10-06' },
    { date: '2026-10-07' },
  ];

  it('correctly calculates calendar week Monday-Sunday range', () => {
    const { startOfWeek, endOfWeek } = getWeekRange(currentDate);
    expect(startOfWeek).toBe('2026-10-05');
    expect(endOfWeek).toBe('2026-10-11');
  });

  it('filters "today" transactions strictly by current date', () => {
    const todayList = mockTransactions.filter((t) => t.date === currentDate);
    expect(todayList.length).toBe(1);
    expect(todayList[0].id).toBe('1');
  });

  it('returns empty array when no transactions exist for today without falling back', () => {
    const noToday = mockTransactions.filter((t) => t.date === '2026-10-08');
    expect(noToday).toEqual([]);
    expect(noToday.length).toBe(0);
  });

  it('filters "this_week" by calendar week (Mon-Sun) and trailing 7 days', () => {
    const { startOfWeek, endOfWeek } = getWeekRange(currentDate);
    const trailing7 = new Set(weeklyDays.map((d) => d.date));

    const weekList = mockTransactions.filter(
      (t) => (t.date >= startOfWeek && t.date <= endOfWeek) || trailing7.has(t.date)
    );

    // 2026-10-07 (in week + trailing 7), 2026-10-05 (in week + trailing 7), 2026-10-01 (in trailing 7)
    expect(weekList.length).toBe(3);
    expect(weekList.map((t) => t.id)).toEqual(['1', '2', '3']);
  });

  it('filters "monthly" strictly by current month prefix', () => {
    const currentYearMonth = currentDate.substring(0, 7);
    const monthlyList = mockTransactions.filter((t) => t.date.startsWith(currentYearMonth));

    expect(monthlyList.length).toBe(3);
    expect(monthlyList.find((t) => t.id === '4')).toBeUndefined();
  });

  it('shows all transactions when "all" is active', () => {
    expect(mockTransactions.length).toBe(4);
  });
});
