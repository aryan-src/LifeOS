import type { Project } from '@/types/database.types';

export interface ProjectWithMetrics extends Project {
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  total_spend: number;
}

export interface RawProjectTask {
  id: string;
  project_id: string | null;
  is_completed: boolean;
}

export interface RawProjectTransaction {
  id: string;
  project_id: string | null;
  amount: number | string;
  type: string;
}

/**
 * Pure calculation function for project metrics.
 * NULLIF(total_tasks, 0) safeguard prevents NaN / divide-by-zero errors.
 * Kept outside of 'use server' modules to avoid Next.js RPC compilation overhead.
 */
export function computeProjectsMetrics(
  projects: Project[],
  tasks: RawProjectTask[],
  transactions: RawProjectTransaction[]
): ProjectWithMetrics[] {
  return projects.map((project) => {
    const projTasks = tasks.filter((t) => t.project_id === project.id);
    const totalTasks = projTasks.length;
    const completedTasks = projTasks.filter((t) => t.is_completed).length;

    // NULLIF(totalTasks, 0) safeguard:
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const projTransactions = transactions.filter((tx) => tx.project_id === project.id);
    const totalSpend = projTransactions.reduce((acc, tx) => {
      const rawAmt = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount));
      const amt = isNaN(rawAmt) ? 0 : rawAmt;
      if (tx.type === 'expense' || amt < 0) {
        return acc + Math.abs(amt);
      }
      return acc;
    }, 0);

    return {
      ...project,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_percentage: completionPercentage,
      total_spend: totalSpend,
    };
  });
}
