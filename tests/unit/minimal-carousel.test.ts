import { describe, it, expect } from 'vitest';
import { buildDashboardCards } from '@/components/dashboard/minimal-carousel';

describe('buildDashboardCards Data Binding', () => {
  const mockAnalytics = {
    currentDate: '2026-10-08',
    currencySymbol: '₹',
    monthlyAllowance: 5000,
    monthlySpent: 185,
    remainingAllowance: 4815,
    allowanceUsagePercent: 4,
    todaySpent: 0,
    safeDailyBudget: 161,
    daysLeftInMonth: 24,
    weekSpent: 120,
    weeklyDays: [],
    categoryBreakdown: [],
    projectSpendTotal: 0,
    totalInflow: 5000,
    totalOutflow: 185,
    netCashflow: 4815,
    cashflowComparison: [],
  };

  const mockTasks = [
    {
      id: 'task-1',
      user_id: 'user-1',
      title: 'Study Algorithm',
      is_completed: false,
      priority: 1,
      due_date: '2026-10-08',
      created_at: '2026-10-08T00:00:00Z',
      updated_at: '2026-10-08T00:00:00Z',
    },
    {
      id: 'task-2',
      user_id: 'user-1',
      title: 'Review Physics Notes',
      is_completed: true,
      priority: 2,
      due_date: '2026-10-07',
      created_at: '2026-10-07T00:00:00Z',
      updated_at: '2026-10-08T00:00:00Z',
    },
  ];

  const mockProjects = [
    {
      id: 'proj-1',
      user_id: 'user-1',
      title: 'Cloud Revamp',
      slug: 'cloud-revamp',
      status: 'active' as const,
      color: '#6366f1',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-08T00:00:00Z',
      total_tasks: 5,
      completed_tasks: 2,
      completion_percentage: 40,
    },
  ];

  const mockNotes = [
    {
      id: 'note-1',
      user_id: 'user-1',
      title: 'Distributed Systems Idea',
      content: 'Consider raft consensus for peer nodes.',
      tags: ['sys', 'arch'],
      created_at: '2026-10-08T00:00:00Z',
      updated_at: '2026-10-08T00:00:00Z',
    },
  ];

  it('maps 4 core dashboard modules correctly', () => {
    const cards = buildDashboardCards({
      analytics: mockAnalytics,
      tasks: mockTasks as any,
      projects: mockProjects as any,
      notes: mockNotes as any,
    });

    expect(cards.length).toBe(4);
    const ids = cards.map((c) => c.id);
    expect(ids).toEqual(['finances-card', 'tasks-card', 'projects-card', 'notes-card']);
    expect(cards.map((c) => c.iconName)).toEqual(['wallet', 'tasks', 'projects', 'notes']);
    // Verify cards have no non-serializable React elements or functions
    cards.forEach((card: any) => {
      expect(card.icon).toBeUndefined();
    });
    // Verify cards are 100% JSON serializable across RSC Flight protocol boundaries
    expect(() => JSON.stringify(cards)).not.toThrow();
  });

  it('binds live dynamic values and currency into cards', () => {
    const cards = buildDashboardCards({
      analytics: mockAnalytics,
      tasks: mockTasks as any,
      projects: mockProjects as any,
      notes: mockNotes as any,
    });

    const financesCard = cards.find((c) => c.id === 'finances-card')!;
    expect(financesCard.value).toContain('₹4,815');
    expect(financesCard.primaryAction.label).toBe('Open Ledger');
    expect(financesCard.primaryAction.route).toBe('/finances');
    expect(financesCard.secondaryAction.label).toBe('Record Expense');

    const tasksCard = cards.find((c) => c.id === 'tasks-card')!;
    expect(tasksCard.value).toBe('1 of 2 tasks completed');
    expect(tasksCard.primaryAction.label).toBe('Priority Matrix');
    expect(tasksCard.primaryAction.route).toBe('/tasks');

    const projectsCard = cards.find((c) => c.id === 'projects-card')!;
    expect(projectsCard.value).toBe('1 Ongoing Workstreams');
    expect(projectsCard.primaryAction.label).toBe('View Board');
    expect(projectsCard.primaryAction.route).toBe('/projects');

    const notesCard = cards.find((c) => c.id === 'notes-card')!;
    expect(notesCard.value).toBe('1 thoughts in vault');
    expect(notesCard.primaryAction.label).toBe('Open Notes');
    expect(notesCard.primaryAction.route).toBe('/notes');
  });

  it('applies calm, warm neutral palettes without heavy drop-shadows', () => {
    const cards = buildDashboardCards({
      analytics: mockAnalytics,
      tasks: mockTasks as any,
      projects: mockProjects as any,
      notes: mockNotes as any,
    });

    cards.forEach((card) => {
      expect(card.color).not.toContain('shadow-2xl');
      expect(card.color).not.toContain('text-white');
    });
  });

  it('safely handles null and undefined telemetry without crashing', () => {
    // Calling with empty object
    const cardsFromEmpty = buildDashboardCards({});
    expect(cardsFromEmpty.length).toBe(4);
    expect(cardsFromEmpty[0].value).toContain('15,000');
    expect(cardsFromEmpty[1].value).toBe('0 of 0 tasks completed');
    expect(cardsFromEmpty[2].value).toBe('0 Ongoing Workstreams');
    expect(cardsFromEmpty[3].value).toBe('0 thoughts in vault');

    // Calling with undefined / null arguments
    const cardsFromNulls = buildDashboardCards({
      analytics: null,
      tasks: null,
      projects: null,
      notes: null,
    });
    expect(cardsFromNulls.length).toBe(4);
    expect(cardsFromNulls[0].title).toBe('Pocket Money Tracker');
    expect(cardsFromNulls[1].title).toBe("Today's Focus");
  });
});

