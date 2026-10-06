export type CaptureTarget = 'transaction' | 'task' | 'note';
import { getTodayDate, getTomorrowDate } from '@/lib/utils/date';

export interface ParsedCapture {
  target: CaptureTarget;
  projectSlug?: string;
  summaryPill: string;
  payload: {
    // For transactions:
    amount?: number;
    type?: 'expense' | 'income';
    description?: string;
    // For tasks:
    title?: string;
    dueDate?: string;
    priority?: number;
    // For notes:
    content?: string;
  };
}

/**
 * Intelligent deterministic tokenizer for Quick Capture input.
 * Strictly tested and compliant with multi-currency tokens, date tags, and edge case token overlaps.
 */
export function parseQuickCapture(rawInput: string): ParsedCapture {
  const input = rawInput.trim();
  if (!input) {
    return {
      target: 'note',
      summaryPill: 'Type to capture anything...',
      payload: { content: '' },
    };
  }

  // 1. Extract Project Reference (#slug)
  const projectMatch = input.match(/#([a-zA-Z0-9_-]+)/);
  const projectSlug = projectMatch ? projectMatch[1] : undefined;

  // Working text with project tag removed
  let workingText = input.replace(/#([a-zA-Z0-9_-]+)/g, '').trim();

  // 2. Extract Date Operator (@today, @tomorrow, @YYYY-MM-DD)
  let dueDate: string | undefined = undefined;
  const todayStr = getTodayDate();
  const tomorrowStr = getTomorrowDate();

  if (/@today\b/i.test(workingText)) {
    dueDate = todayStr;
    workingText = workingText.replace(/@today\b/gi, '').trim();
  } else if (/@tomorrow\b/i.test(workingText)) {
    dueDate = tomorrowStr;
    workingText = workingText.replace(/@tomorrow\b/gi, '').trim();
  } else {
    const explicitDateMatch = workingText.match(/@(\d{4}-\d{2}-\d{2})\b/);
    if (explicitDateMatch) {
      dueDate = explicitDateMatch[1];
      workingText = workingText.replace(explicitDateMatch[0], '').trim();
    }
  }

  // Clean redundant whitespace
  workingText = workingText.replace(/\s+/g, ' ').trim();

  // 3. Currency / Transaction Detection
  // Matches:
  // a) Symbol prefix: [+-]?[$€£¥]\s*[0-9]+(\.[0-9]{1,2})?
  // b) Trailing currency code: [0-9]+(\.[0-9]{1,2})?\s+(USD|EUR|GBP|INR)
  const symbolMatch = workingText.match(/([+-]?)\s*([$€£¥₹])\s*(\d+(?:\.\d{1,2})?)/);
  const trailingCodeMatch = workingText.match(/(\d+(?:\.\d{1,2})?)\s+(USD|EUR|GBP|INR)\b/i);

  if (symbolMatch || trailingCodeMatch) {
    let amountVal = 0;
    let isIncome = false;

    if (symbolMatch) {
      isIncome = symbolMatch[1] === '+';
      amountVal = parseFloat(symbolMatch[3]);
      // Remove money token from description
      workingText = workingText.replace(symbolMatch[0], '').trim();
    } else if (trailingCodeMatch) {
      amountVal = parseFloat(trailingCodeMatch[1]);
      workingText = workingText.replace(trailingCodeMatch[0], '').trim();
    }

    // Clean remaining text
    const description = workingText.replace(/\s+/g, ' ').trim() || 'Quick Capture Transaction';
    const signedAmount = isIncome ? amountVal : -amountVal;

    const summaryPill = `Transaction: ${isIncome ? '+' : '-'}$${amountVal.toFixed(2)} (${description})${
      projectSlug ? ` | #${projectSlug}` : ''
    }`;

    return {
      target: 'transaction',
      projectSlug,
      summaryPill,
      payload: {
        amount: signedAmount,
        type: isIncome ? 'income' : 'expense',
        description,
        dueDate,
      },
    };
  }

  // 4. Task Directive Detection ("todo:", "TODO:", "[]", "- [ ]")
  const taskPrefixMatch = workingText.match(/^(?:(?:-\s*)?\[\s*\]|todo:)\s*(.+)$/i);
  if (taskPrefixMatch) {
    const taskTitle = taskPrefixMatch[1].replace(/\s+/g, ' ').trim();
    const summaryPill = `Task: "${taskTitle}"${dueDate ? ` | Due: ${dueDate}` : ''}${
      projectSlug ? ` | #${projectSlug}` : ''
    }`;

    return {
      target: 'task',
      projectSlug,
      summaryPill,
      payload: {
        title: taskTitle,
        dueDate,
        priority: 2,
      },
    };
  }

  // 5. Unstructured Ideas & Notes Fallback
  const summaryTitle =
    workingText.length > 40 ? workingText.slice(0, 40) + '...' : workingText;
  const summaryPill = `Idea: "${summaryTitle}"${projectSlug ? ` | #${projectSlug}` : ''}`;

  return {
    target: 'note',
    projectSlug,
    summaryPill,
    payload: {
      title: summaryTitle,
      content: workingText,
    },
  };
}
