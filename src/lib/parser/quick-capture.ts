/**
 * Smart Quick-Capture Parser Module
 * Deterministic tokenizer for ⌘K palette input.
 * Supports natural language dates in profile timezone, prefix shortcuts,
 * expense amounts, category guessing, priority levels, project linking,
 * habit check-ins, and fallback to idea.
 */

export type CaptureTarget = 'transaction' | 'task' | 'note' | 'assignment' | 'habit';
export type ChipType = 'transaction' | 'expense' | 'task' | 'note' | 'assignment' | 'habit';

export interface QuickCaptureCategory {
  id: string;
  name: string;
}

export interface QuickCaptureProject {
  id: string;
  title: string;
  slug?: string;
}

export interface QuickCaptureHabit {
  id: string;
  title: string;
  is_completed_today?: boolean;
}

export interface QuickCaptureContext {
  timezone?: string; // defaults to 'Asia/Kolkata'
  referenceDate?: Date; // used for deterministic testing and midnight-boundary verification
  categories?: QuickCaptureCategory[];
  projects?: QuickCaptureProject[];
  habits?: QuickCaptureHabit[];
}

export interface ParsedChips {
  type: ChipType;
  title: string;
  date?: string | null;
  priority?: 1 | 2 | 3 | 4;
  amount?: number | null;
  category?: string | null;
  categoryId?: string | null;
  project?: string | null;
  projectId?: string | null;
  statusNote?: string | null;
}

export interface ParsedCapture {
  target: CaptureTarget | null;
  rawInput: string;
  projectSlug?: string;
  summaryPill: string;
  payload: {
    title?: string;
    description?: string;
    content?: string;
    date?: string | null;
    dueDate?: string | null;
    priority?: 1 | 2 | 3 | 4;
    amount?: number;
    type?: 'expense' | 'income';
    categoryId?: string | null;
    categoryName?: string | null;
    subject?: string;
    projectId?: string | null;
    projectSlug?: string | null;
    projectTitle?: string | null;
    tags?: string[];
    habitId?: string | null;
    habitTitle?: string | null;
    isAlreadyCompletedToday?: boolean;
  };
  chips: ParsedChips;
}

const FORMATTER_CACHE = new Map<
  string,
  { dateFormatter: Intl.DateTimeFormat; weekdayFormatter: Intl.DateTimeFormat }
>();

function getFormattersForTimezone(timezone: string) {
  let cached = FORMATTER_CACHE.get(timezone);
  if (!cached) {
    cached = {
      dateFormatter: new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      weekdayFormatter: new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
      }),
    };
    FORMATTER_CACHE.set(timezone, cached);
  }
  return cached;
}

// Pre-warm default timezone formatter
getFormattersForTimezone('Asia/Kolkata');

/**
 * Returns date components (year, month, day, dateString YYYY-MM-DD, weekday 0-6)
 * evaluated in the target IANA timezone (defaults to Asia/Kolkata).
 */
export function getDateInTimezone(
  date: Date = new Date(),
  timezone: string = 'Asia/Kolkata'
): { year: number; month: number; day: number; dateString: string; weekday: number } {
  const { dateFormatter, weekdayFormatter } = getFormattersForTimezone(timezone);
  const dateString = dateFormatter.format(date);
  const [yStr, mStr, dStr] = dateString.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  const shortWeekday = weekdayFormatter.format(date).toLowerCase();
  const weekdayMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  const weekday = weekdayMap[shortWeekday] ?? 0;

  return { year, month, day, dateString, weekday };
}

/**
 * Safely adds days to a YYYY-MM-DD string.
 */
export function addDaysToDateString(dateString: string, daysToAdd: number): string {
  const [y, m, d] = dateString.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d + daysToAdd));
  return utcDate.toISOString().slice(0, 10);
}

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const WEEKDAY_NAME_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const CATEGORY_KEYWORD_SYNONYMS: Record<string, string[]> = {
  cafe: ['coffee', 'latte', 'tea', 'cafe', 'espresso', 'starbucks', 'beverage'],
  food: [
    'lunch',
    'dinner',
    'breakfast',
    'burger',
    'pizza',
    'meal',
    'restaurant',
    'swiggy',
    'zomato',
    'snack',
    'snacks',
    'dining',
  ],
  books: ['book', 'books', 'textbook', 'reading', 'novel', 'stationery', 'paper'],
  transit: ['metro', 'bus', 'uber', 'cab', 'ola', 'auto', 'train', 'flight', 'transit', 'ticket', 'transport', 'commute', 'petrol', 'fuel'],
  groceries: ['groceries', 'grocery', 'milk', 'vegetables', 'fruits', 'supermarket', 'instamart', 'zepto', 'blinkit', 'apples'],
  utilities: ['rent', 'wifi', 'internet', 'electricity', 'bill', 'recharge', 'phone', 'subscription', 'hosting', 'domain'],
  education: ['tuition', 'course', 'exam', 'fees', 'college', 'academic'],
};

/**
 * Intelligent deterministic tokenizer for Smart Quick Capture.
 */
export function parseQuickCapture(
  rawInput: string,
  context: QuickCaptureContext = {}
): ParsedCapture {
  const input = rawInput ? rawInput.trim() : '';

  // 1. Empty or whitespace input
  if (!input) {
    return {
      target: 'note',
      rawInput,
      summaryPill: 'Type to capture anything...',
      payload: { content: '', title: '' },
      chips: { type: 'note', title: '' },
    };
  }

  const timezone = context.timezone || 'Asia/Kolkata';
  const now = context.referenceDate || new Date();
  const tzInfo = getDateInTimezone(now, timezone);
  const todayStr = tzInfo.dateString;
  const tomorrowStr = addDaysToDateString(todayStr, 1);

  // 2. Exact Habit Check-In Match
  if (context.habits && context.habits.length > 0) {
    const matchedHabit = context.habits.find(
      (h) => h.title.trim().toLowerCase() === input.toLowerCase()
    );
    if (matchedHabit) {
      const isDone = Boolean(matchedHabit.is_completed_today);
      return {
        target: 'habit',
        rawInput,
        summaryPill: isDone ? 'Habit: Already done today' : `Check in habit: "${matchedHabit.title}"`,
        payload: {
          title: matchedHabit.title,
          habitId: matchedHabit.id,
          habitTitle: matchedHabit.title,
          isAlreadyCompletedToday: isDone,
          date: todayStr,
        },
        chips: {
          type: 'habit',
          title: matchedHabit.title,
          date: todayStr,
          statusNote: isDone ? 'Already done' : 'Ready to check in',
        },
      };
    }
  }

  let workingText = input;
  let explicitTarget: CaptureTarget | null = null;

  // 3. Prefix Shortcuts: "t ", "e ", "i ", "a "
  if (/^t\s+/i.test(workingText)) {
    explicitTarget = 'task';
    workingText = workingText.replace(/^t\s+/i, '').trim();
  } else if (/^e\s+/i.test(workingText)) {
    explicitTarget = 'transaction';
    workingText = workingText.replace(/^e\s+/i, '').trim();
  } else if (/^i\s+/i.test(workingText)) {
    explicitTarget = 'note';
    workingText = workingText.replace(/^i\s+/i, '').trim();
  } else if (/^a\s+/i.test(workingText)) {
    explicitTarget = 'assignment';
    workingText = workingText.replace(/^a\s+/i, '').trim();
  } else if (/^(?:todo:|(?:-\s*)?\[\s*\])\s*/i.test(workingText)) {
    explicitTarget = 'task';
    workingText = workingText.replace(/^(?:todo:|(?:-\s*)?\[\s*\])\s*/i, '').trim();
  }

  // 4. Check for #assignment directive
  const isAssignment = /#assignment\b/i.test(workingText);
  if (isAssignment) {
    explicitTarget = 'assignment';
    workingText = workingText.replace(/#assignment\b/gi, '').trim();
  }

  // 5. Extract Priority (!low, !med, !medium, !high, !urgent)
  let priority: 1 | 2 | 3 | 4 | undefined = undefined;
  const priorityMatch = workingText.match(/(?:^|\s)!(low|med|medium|high|urgent)\b/i);
  if (priorityMatch) {
    const pWord = priorityMatch[1].toLowerCase();
    if (pWord === 'low') priority = 1;
    else if (pWord === 'med' || pWord === 'medium') priority = 2;
    else if (pWord === 'high') priority = 3;
    else if (pWord === 'urgent') priority = 4;

    workingText = workingText.replace(priorityMatch[0], ' ').replace(/\s+/g, ' ').trim();
  }

  // 6. Extract Project Reference (@name or #slug)
  let matchedProject: QuickCaptureProject | undefined = undefined;
  let projectSlug: string | undefined = undefined;

  const atProjectMatch = workingText.match(/(?:^|\s)@([a-zA-Z0-9_\-]+)/);
  if (atProjectMatch) {
    const candidate = atProjectMatch[1].toLowerCase();
    if (context.projects && context.projects.length > 0) {
      matchedProject = context.projects.find(
        (p) =>
          p.title.toLowerCase() === candidate ||
          (p.slug && p.slug.toLowerCase() === candidate) ||
          p.title.toLowerCase().replace(/\s+/g, '-') === candidate
      );
      if (matchedProject) {
        projectSlug = matchedProject.slug || matchedProject.title.toLowerCase().replace(/\s+/g, '-');
        workingText = workingText.replace(atProjectMatch[0], ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }

  // Extract Hashtags (for project slug or tags)
  const tags: string[] = [];
  const hashtagMatches = Array.from(workingText.matchAll(/(?:^|\s)#([a-zA-Z0-9_\-]+)/g)).map(
    (m) => m[1]
  );
  if (hashtagMatches.length > 0) {
    const candidate = hashtagMatches.find((slug) => slug.toLowerCase() !== 'assignment');
    if (candidate) {
      if (!projectSlug) projectSlug = candidate;
      if (!matchedProject && context.projects) {
        matchedProject = context.projects.find(
          (p) =>
            p.slug?.toLowerCase() === candidate.toLowerCase() ||
            p.title.toLowerCase() === candidate.toLowerCase()
        );
      }
    }
    hashtagMatches.forEach((t) => {
      if (t.toLowerCase() !== 'assignment') tags.push(t);
    });
    // Strip hashtags
    workingText = workingText.replace(/(?:^|\s)#[a-zA-Z0-9_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // 7. Natural Language Date Parsing (Evaluated in Timezone)
  // Preserves time tokens like "6pm", "18:00" in working text!
  let parsedDate: string | null = null;

  // Match all date tokens: @today, @tomorrow, @YYYY-MM-DD, today, tomorrow, in X days, weekdays, Month Day
  const dateAtMatch = workingText.match(/@(\d{4}-\d{2}-\d{2})\b/);
  if (dateAtMatch) {
    parsedDate = dateAtMatch[1];
  } else if (/(?:^|\s)@?today\b/i.test(workingText)) {
    parsedDate = todayStr;
  } else if (/(?:^|\s)@?tomorrow\b/i.test(workingText)) {
    parsedDate = tomorrowStr;
  } else if (/(?:^|\s)in\s+(\d+)\s+days?\b/i.test(workingText)) {
    const inDaysMatch = workingText.match(/(?:^|\s)in\s+(\d+)\s+days?\b/i);
    if (inDaysMatch) {
      parsedDate = addDaysToDateString(todayStr, parseInt(inDaysMatch[1], 10));
    }
  } else if (
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i.test(
      workingText
    )
  ) {
    const mMatch = workingText.match(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
    );
    if (mMatch) {
      const mNum = MONTH_MAP[mMatch[1].toLowerCase()];
      const dNum = parseInt(mMatch[2], 10);
      if (mNum && dNum >= 1 && dNum <= 31) {
        parsedDate = `${tzInfo.year}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      }
    }
  } else if (
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i.test(
      workingText
    )
  ) {
    const dMatch = workingText.match(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i
    );
    if (dMatch) {
      const dNum = parseInt(dMatch[1], 10);
      const mNum = MONTH_MAP[dMatch[2].toLowerCase()];
      if (mNum && dNum >= 1 && dNum <= 31) {
        parsedDate = `${tzInfo.year}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      }
    }
  } else {
    const weekdayMatch = workingText.match(
      /(?:^|\s)(sunday|sun|monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat)\b/i
    );
    if (weekdayMatch) {
      const targetDay = WEEKDAY_NAME_MAP[weekdayMatch[1].toLowerCase()];
      if (targetDay !== undefined) {
        let diff = targetDay - tzInfo.weekday;
        if (diff <= 0) diff += 7;
        parsedDate = addDaysToDateString(todayStr, diff);
      }
    }
  }

  // Strip all recognized date tokens from workingText (leaving time tokens like 6pm, 18:00 untouched!)
  workingText = workingText
    .replace(/@\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/(?:^|\s)@?today\b/gi, ' ')
    .replace(/(?:^|\s)@?tomorrow\b/gi, ' ')
    .replace(/(?:^|\s)in\s+\d+\s+days?\b/gi, ' ')
    .replace(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,
      ' '
    )
    .replace(
      /\b\d{1,2}(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi,
      ' '
    )
    .replace(
      /(?:^|\s)(sunday|sun|monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  // 8. Currency / Transaction Detection
  // Strictly requires currency indicator (₹, $, €, £, ¥, "rs", "inr", "USD", etc.)
  // OR explicit "e " prefix. Bare numbers alone (e.g. "Finish chapter 5", "2 apples")
  // MUST NOT become expenses.
  let isExpense = explicitTarget === 'transaction';
  let isIncome = false;
  let parsedAmount: number | null = null;
  let remainingExpenseText = workingText;

  // Leading currency symbol or prefix "rs" / "inr" (e.g. "₹450 coffee", "rs 350 lunch", "$25 domain")
  const symbolRegex = /([+-]?)\s*([$€£¥₹]|(?:rs\.?|inr))\s*([+-]?)\s*(\d+(?:\.\d{1,2})?)/i;
  // Trailing currency symbol or code (e.g. "coffee 450 rs", "50 USD dinner", "coffee 450rs")
  const trailingCodeRegex = /([+-]?)\s*(\d+(?:\.\d{1,2})?)\s*(?:([$€£¥₹])|(?:rs\.?|inr)|(?:usd|eur|gbp))\b/i;

  const symbolMatch = workingText.match(symbolRegex);
  const trailingCodeMatch = workingText.match(trailingCodeRegex);

  if (symbolMatch) {
    isExpense = true;
    const hasMinus = symbolMatch[1] === '-' || symbolMatch[3] === '-';
    const hasPlus = symbolMatch[1] === '+' || symbolMatch[3] === '+';
    isIncome = hasPlus && !hasMinus;
    parsedAmount = parseFloat(symbolMatch[4]);
    remainingExpenseText = workingText.replace(symbolMatch[0], ' ').replace(/\s+/g, ' ').trim();
  } else if (trailingCodeMatch) {
    isExpense = true;
    isIncome = trailingCodeMatch[1] === '+';
    parsedAmount = parseFloat(trailingCodeMatch[2]);
    remainingExpenseText = workingText.replace(trailingCodeMatch[0], ' ').replace(/\s+/g, ' ').trim();
  } else if (isExpense) {
    // Input starts with "e " shortcut: any number counts as money
    const anyNumMatch = workingText.match(/(\d+(?:\.\d{1,2})?)/);
    if (anyNumMatch) {
      parsedAmount = parseFloat(anyNumMatch[1]);
      remainingExpenseText = workingText.replace(anyNumMatch[0], ' ').replace(/\s+/g, ' ').trim();
    }
  }

  // Category Guessing for Expenses
  let guessedCategoryId: string | null = null;
  let guessedCategoryName: string | null = null;

  if (isExpense && context.categories && context.categories.length > 0) {
    const lowerWords = remainingExpenseText.toLowerCase().split(/\s+/);

    for (const cat of context.categories) {
      const catLower = cat.name.toLowerCase();
      if (lowerWords.some((w) => catLower === w || catLower.includes(w) || w.includes(catLower))) {
        guessedCategoryId = cat.id;
        guessedCategoryName = cat.name;
        break;
      }
    }

    if (!guessedCategoryId) {
      for (const [canonical, synonyms] of Object.entries(CATEGORY_KEYWORD_SYNONYMS)) {
        if (synonyms.some((syn) => lowerWords.includes(syn))) {
          const cat = context.categories.find(
            (c) =>
              c.name.toLowerCase().includes(canonical) ||
              synonyms.some((s) => c.name.toLowerCase().includes(s))
          );
          if (cat) {
            guessedCategoryId = cat.id;
            guessedCategoryName = cat.name;
            break;
          }
        }
      }
    }
  }

  // 9. Assignment Parsing
  if (isAssignment || explicitTarget === 'assignment') {
    const cleanAssignmentText = workingText
      .replace(/^(?:(?:-\s*)?\[\s*\]|todo:|assignment:)\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    let subject = 'General';
    let title = cleanAssignmentText || 'Untitled Assignment';

    const separatorMatch = cleanAssignmentText.match(/^([^:\-]+)[:\-]\s+(.+)$/);
    if (separatorMatch) {
      subject = separatorMatch[1].trim();
      title = separatorMatch[2].trim();
    } else {
      const words = cleanAssignmentText.split(/\s+/);
      if (tags.length > 0) {
        subject = tags[0];
      } else if (words.length >= 2) {
        subject = words[0];
      }
    }

    const summaryPill = `Assignment: "${title}" (${subject})${
      parsedDate ? ` | Due: ${parsedDate}` : ''
    }${projectSlug ? ` | #${projectSlug}` : ''}`;

    return {
      target: 'assignment',
      rawInput,
      projectSlug,
      summaryPill,
      payload: {
        subject,
        title,
        dueDate: parsedDate,
        date: parsedDate,
        projectId: matchedProject?.id || null,
        projectSlug: projectSlug || null,
        tags,
      },
      chips: {
        type: 'assignment',
        title,
        date: parsedDate,
        project: matchedProject?.title || projectSlug || null,
        projectId: matchedProject?.id || null,
      },
    };
  }

  // 10. Transaction / Expense Return
  if (isExpense && parsedAmount !== null) {
    const description = remainingExpenseText || 'Quick Capture Transaction';
    const signedAmount = isIncome ? parsedAmount : -parsedAmount;
    const summaryPill = `Transaction: ${isIncome ? '+' : '-'}$${parsedAmount.toFixed(2)} (${description})${
      projectSlug ? ` | #${projectSlug}` : ''
    }`;

    return {
      target: 'transaction',
      rawInput,
      projectSlug,
      summaryPill,
      payload: {
        amount: signedAmount,
        type: isIncome ? 'income' : 'expense',
        description,
        title: description,
        dueDate: parsedDate,
        date: parsedDate || todayStr,
        categoryId: guessedCategoryId,
        categoryName: guessedCategoryName,
        projectId: matchedProject?.id || null,
        projectSlug: projectSlug || null,
        tags,
      },
      chips: {
        type: 'expense',
        title: description,
        amount: parsedAmount,
        category: guessedCategoryName,
        categoryId: guessedCategoryId,
        date: parsedDate || todayStr,
        project: matchedProject?.title || projectSlug || null,
        projectId: matchedProject?.id || null,
      },
    };
  }

  // 11. Task Return
  if (explicitTarget === 'task' || priority !== undefined || parsedDate !== null) {
    const rawTitle = workingText.replace(/\s+/g, ' ').trim();
    const taskTitle = rawTitle || 'Untitled Task';
    const prioNum = priority || 2;
    const summaryPill = `Task: "${taskTitle}"${parsedDate ? ` | Due: ${parsedDate}` : ''}${
      projectSlug ? ` | #${projectSlug}` : ''
    }`;

    return {
      target: 'task',
      rawInput,
      projectSlug,
      summaryPill,
      payload: {
        title: taskTitle,
        dueDate: parsedDate,
        date: parsedDate,
        priority: prioNum,
        projectId: matchedProject?.id || null,
        projectSlug: projectSlug || null,
        tags,
      },
      chips: {
        type: 'task',
        title: taskTitle,
        date: parsedDate,
        priority: prioNum,
        project: matchedProject?.title || projectSlug || null,
        projectId: matchedProject?.id || null,
      },
    };
  }

  // 12. Fallback to Idea / Note (Nothing Lost)
  const summaryTitle =
    workingText.length > 40 ? workingText.slice(0, 40) + '...' : (workingText || 'Untitled Note');
  const summaryPill = `Save as idea: "${summaryTitle}"${projectSlug ? ` | #${projectSlug}` : ''}`;

  return {
    target: 'note',
    rawInput,
    projectSlug,
    summaryPill,
    payload: {
      title: summaryTitle,
      content: input,
      projectId: matchedProject?.id || null,
      projectSlug: projectSlug || null,
      tags,
    },
    chips: {
      type: 'note',
      title: summaryTitle,
      project: matchedProject?.title || projectSlug || null,
      projectId: matchedProject?.id || null,
    },
  };
}
