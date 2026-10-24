/**
 * Unified Dashboard Telemetry Type Interfaces
 * LifeOS Command Center — Unified Canvas Edition
 */

export interface PocketMoneyTelemetry {
  monthlyAllowance: number;
  remainingAllowance: number;
  allowanceUsagePercent: number;
  monthlySpent: number;
  todaySpent: number;
  safeDailyBudget: number;
  daysLeftInMonth: number;
  currencySymbol: string;
  weeklyDays: Array<{
    dayLabel: string;
    spent: number;
    isToday: boolean;
  }>;
}

export interface FocusCockpitTelemetry {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionPercentage: number;
  overdueCount: number;
  activeTimerMinutes: number;
  isTimerRunning: boolean;
  nextTaskTitle: string | null;
  estimatedTimeRemaining?: string;
}

export interface SubmissionDeadlineItem {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  daysRemainingLabel: string;
  isToday: boolean;
  isOverdue: boolean;
  status: 'pending' | 'submitted' | 'graded';
}

export interface HabitTelemetryItem {
  id: string;
  name: string;
  streak: number;
  history: boolean[]; // 7 days: M, T, W, T, F, S, S
  isCompletedToday: boolean;
}

export interface ProjectTelemetryItem {
  id: string;
  title: string;
  status: 'active' | 'in_progress' | 'paused' | 'backlog' | 'completed';
  completionPercentage: number;
  nextMilestone?: string;
}

export interface IdeaTelemetryItem {
  id: string;
  title: string;
  content: string;
  tag: 'note' | 'draft' | 'idea' | 'research';
  dateLabel: string;
  isPinned: boolean;
  projectId?: string | null;
}

export interface DashboardWorkspaceTelemetry {
  greeting: string;
  displayName: string;
  currentDateFormatted: string;
  pocketMoney: PocketMoneyTelemetry;
  focus: FocusCockpitTelemetry;
  submissions: SubmissionDeadlineItem[];
  habits: HabitTelemetryItem[];
  projects: ProjectTelemetryItem[];
  ideas: IdeaTelemetryItem[];
}
