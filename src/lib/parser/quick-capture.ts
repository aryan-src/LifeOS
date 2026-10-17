export type CaptureTarget = 'transaction' | 'task' | 'note' | 'assignment';
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
    // For tasks / assignments:
    title?: string;
    subject?: string;
    dueDate?: string;
    priority?: number;
    // For notes:
    content?: string;
  };
}

/**
 * Intelligent deterministic tokenizer for Quick Capture input.
 * Strictly tested and compliant with multi-currency tokens, date tags, #assignment directives, and edge case token overlaps.
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

  // 1. Detect #assignment Directive Tag
  const isAssignment = /#assignment\b/i.test(input);

  // 2. Extract Project Reference (#slug, ignoring #assignment)
  const hashtagMatches = Array.from(input.matchAll(/#([a-zA-Z0-9_-]+)/g)).map((m) => m[1]);
  const projectSlug = hashtagMatches.find((slug) => slug.toLowerCase() !== 'assignment');

  // Working text with hashtag tokens removed
  let workingText = input
    .replace(/#assignment\b/gi, '')
    .replace(/#([a-zA-Z0-9_-]+)/g, '')
    .trim();

  // 3. Extract Date Operator (@today, @tomorrow, @YYYY-MM-DD)
  let dueDate: string | undefined = undefined;
  const todayStr = getTodayDate();
  const tomorrowStr = getTomorrowDate();

  if (/@today\b/i.test(workingText)) {
    dueDate = todayStr;
  } else if (/@tomorrow\b/i.test(workingText)) {
    dueDate = tomorrowStr;
  } else {
    const explicitDateMatch = workingText.match(/@(\d{4}-\d{2}-\d{2})\b/);
    if (explicitDateMatch) {
      dueDate = explicitDateMatch[1];
    }
  }

  // Strip all date operators from working text
  workingText = workingText
    .replace(/@today\b/gi, '')
    .replace(/@tomorrow\b/gi, '')
    .replace(/@\d{4}-\d{2}-\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 4. Assignment Directive Detection (#assignment tag)
  if (isAssignment) {
    // Strip task or assignment prefixes if present e.g. "todo:", "TODO:", "- [ ]", "[ ]", "assignment:"
    const cleanAssignmentText = workingText
      .replace(/^(?:(?:-\s*)?\[\s*\]|todo:|assignment:)\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    let subject = 'General';
    let title = cleanAssignmentText || 'Untitled Assignment';

    // Check for explicit subject separator: "Physics: Lab Report" or "Physics - Lab Report"
    const separatorMatch = cleanAssignmentText.match(/^([^:\-]+)[:\-]\s+(.+)$/);
    if (separatorMatch) {
      subject = separatorMatch[1].trim();
      title = separatorMatch[2].trim();
    } else {
      // First word subject heuristic for multi-word titles (e.g. "Physics Lab Report" -> subject: "Physics", title: "Physics Lab Report")
      const words = cleanAssignmentText.split(/\s+/);
      if (words.length >= 2) {
        subject = words[0];
      }
    }

    const summaryPill = `Assignment: "${title}" (${subject})${dueDate ? ` | Due: ${dueDate}` : ''}${
      projectSlug ? ` | #${projectSlug}` : ''
    }`;

    return {
      target: 'assignment',
      projectSlug,
      summaryPill,
      payload: {
        subject,
        title,
        dueDate,
      },
    };
  }

  // 5. Currency / Transaction Detection
  // Matches:
  // a) Symbol prefix: [+-]?[$€£¥₹]\s*[+-]?\s*[0-9]+(\.[0-9]{1,2})? (e.g. $50, $-50, -$50, +$100)
  // b) Trailing currency code: [+-]?\s*[0-9]+(\.[0-9]{1,2})?\s+(USD|EUR|GBP|INR)
  const symbolMatch = workingText.match(/([+-]?)\s*([$€£¥₹])\s*([+-]?)\s*(\d+(?:\.\d{1,2})?)/);
  const trailingCodeMatch = workingText.match(/([+-]?)\s*(\d+(?:\.\d{1,2})?)\s+(USD|EUR|GBP|INR)\b/i);

  if (symbolMatch || trailingCodeMatch) {
    let amountVal = 0;
    let isIncome = false;

    if (symbolMatch) {
      const hasMinus = symbolMatch[1] === '-' || symbolMatch[3] === '-';
      const hasPlus = symbolMatch[1] === '+' || symbolMatch[3] === '+';
      isIncome = hasPlus && !hasMinus;
      amountVal = parseFloat(symbolMatch[4]);
      workingText = workingText.replace(symbolMatch[0], '').trim();
    } else if (trailingCodeMatch) {
      isIncome = trailingCodeMatch[1] === '+';
      amountVal = parseFloat(trailingCodeMatch[2]);
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

  // 6. Task Directive Detection ("todo:", "TODO:", "[]", "- [ ]")
  const taskPrefixMatch = workingText.match(/^(?:(?:-\s*)?\[\s*\]|todo:)\s*(.*)$/i);
  if (taskPrefixMatch) {
    const rawTitle = taskPrefixMatch[1].replace(/\s+/g, ' ').trim();
    const taskTitle = rawTitle || 'Untitled Task';
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

  // 7. Unstructured Ideas & Notes Fallback
  const summaryTitle =
    workingText.length > 40 ? workingText.slice(0, 40) + '...' : (workingText || 'Untitled Note');
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
