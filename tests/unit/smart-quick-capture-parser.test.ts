import { describe, it, expect } from 'vitest';
import {
  parseQuickCapture,
  getDateInTimezone,
  addDaysToDateString,
  type QuickCaptureContext,
} from '@/lib/parser/quick-capture';

describe('Smart Quick Capture Pure Parser Module', () => {
  const mockContext: QuickCaptureContext = {
    timezone: 'Asia/Kolkata',
    referenceDate: new Date('2026-11-19T10:00:00.000Z'), // Thursday in Asia/Kolkata
    categories: [
      { id: 'cat-cafe', name: 'Cafe & Dining' },
      { id: 'cat-books', name: 'Books & Stationery' },
      { id: 'cat-transit', name: 'Transit' },
      { id: 'cat-groceries', name: 'Groceries' },
    ],
    projects: [
      { id: 'proj-tripos', title: 'CS Tripos', slug: 'cs-tripos' },
      { id: 'proj-os', title: 'Operating Systems', slug: 'operating-systems' },
    ],
    habits: [
      { id: 'h-walk', title: 'Morning sunlight & walk', is_completed_today: false },
      { id: 'h-read', title: 'Read 20 pages', is_completed_today: true },
    ],
  };

  // 1. Empty & Whitespace
  it('handles empty input or pure whitespace gracefully with placeholder summary', () => {
    const resEmpty = parseQuickCapture('', mockContext);
    expect(resEmpty.target).toBe('note');
    expect(resEmpty.summaryPill).toBe('Type to capture anything...');
    expect(resEmpty.chips.title).toBe('');

    const resSpace = parseQuickCapture('   ', mockContext);
    expect(resSpace.target).toBe('note');
    expect(resSpace.summaryPill).toBe('Type to capture anything...');
  });

  // 2. Bad Input Resiliency
  it('safely handles noisy characters and punctuation without crashing', () => {
    const res = parseQuickCapture('??? !!! %%% ***', mockContext);
    expect(res.target).toBe('note');
    expect(res.payload.content).toBe('??? !!! %%% ***');
  });

  it('safely handles extremely long inputs without truncation error', () => {
    const longText = 'A'.repeat(500);
    const res = parseQuickCapture(longText, mockContext);
    expect(res.target).toBe('note');
    expect(res.payload.content).toBeDefined();
    expect(res.payload.content!.length).toBe(500);
  });

  // 3. Bare Numbers vs Valid Currency Numbers
  describe('Bare Numbers vs Valid Currency Numbers (Rule 2)', () => {
    it('does NOT treat "Finish chapter 5" as an expense (bare number)', () => {
      const res = parseQuickCapture('Finish chapter 5', mockContext);
      expect(res.target).not.toBe('transaction');
      expect(res.chips.type).not.toBe('expense');
      expect(res.target).toBe('note');
    });

    it('does NOT treat "2 apples" as an expense (bare leading number)', () => {
      const res = parseQuickCapture('2 apples', mockContext);
      expect(res.target).not.toBe('transaction');
      expect(res.chips.type).not.toBe('expense');
      expect(res.target).toBe('note');
    });

    it('does NOT treat "Read 20 pages" as an expense', () => {
      // With mockContext, "Read 20 pages" matches habit
      const res = parseQuickCapture('Read 20 pages', mockContext);
      expect(res.target).toBe('habit');
      expect(res.chips.type).not.toBe('expense');
    });

    it('does NOT treat "todo: Finish chapter 5" as an expense', () => {
      const res = parseQuickCapture('todo: Finish chapter 5', mockContext);
      expect(res.target).toBe('task');
      expect(res.chips.type).not.toBe('expense');
    });

    it('does NOT treat trailing bare number "dinner with team 850" as an expense', () => {
      const res = parseQuickCapture('dinner with team 850', mockContext);
      expect(res.target).not.toBe('transaction');
      expect(res.chips.type).not.toBe('expense');
    });

    it('parses "₹450 coffee" as expense with valid rupee currency symbol', () => {
      const res = parseQuickCapture('₹450 coffee', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(450);
      expect(Math.abs(res.payload.amount!)).toBe(450);
      expect(res.chips.title).toBe('coffee');
    });

    it('parses "coffee 450 rs" as expense with trailing rs', () => {
      const res = parseQuickCapture('coffee 450 rs', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(450);
      expect(Math.abs(res.payload.amount!)).toBe(450);
      expect(res.chips.title).toBe('coffee');
    });

    it('parses "e 450 coffee" as expense via "e " prefix shortcut', () => {
      const res = parseQuickCapture('e 450 coffee', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(450);
      expect(Math.abs(res.payload.amount!)).toBe(450);
      expect(res.chips.title).toBe('coffee');
    });

    it('parses "rs 350 lunch" as expense with prefix rs', () => {
      const res = parseQuickCapture('rs 350 lunch', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(350);
      expect(Math.abs(res.payload.amount!)).toBe(350);
    });

    it('parses "$25 domain renewal" as expense with dollar sign', () => {
      const res = parseQuickCapture('$25 domain renewal', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(25);
      expect(Math.abs(res.payload.amount!)).toBe(25);
    });

    // Thousands & Indian Grouping Separators (BUG 1)
    it('parses "₹1,200 rent" -> amount 1200 and title "rent"', () => {
      const res = parseQuickCapture('₹1,200 rent', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(1200);
      expect(Math.abs(res.payload.amount!)).toBe(1200);
      expect(res.chips.title).toBe('rent');
      expect(res.payload.title).toBe('rent');
      expect(res.summaryPill).toContain('₹1200.00');
      expect(res.chips.title).not.toMatch(/^[,.:;/-]/);
    });

    it('parses "₹1,20,000 fee" with Indian numbering grouping -> amount 120000', () => {
      const res = parseQuickCapture('₹1,20,000 fee', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(120000);
      expect(Math.abs(res.payload.amount!)).toBe(120000);
      expect(res.chips.title).toBe('fee');
      expect(res.chips.title).not.toMatch(/^[,.:;/-]/);
    });

    it('parses "e 12,000 laptop repair" via prefix shortcut -> amount 12000', () => {
      const res = parseQuickCapture('e 12,000 laptop repair', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(12000);
      expect(Math.abs(res.payload.amount!)).toBe(12000);
      expect(res.chips.title).toBe('laptop repair');
    });

    it('parses "rent 1,200 rs" with trailing currency code -> amount 1200', () => {
      const res = parseQuickCapture('rent 1,200 rs', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(1200);
      expect(Math.abs(res.payload.amount!)).toBe(1200);
      expect(res.chips.title).toBe('rent');
    });

    it('parses "₹450.50 lunch" with decimals -> amount 450.5', () => {
      const res = parseQuickCapture('₹450.50 lunch', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(450.5);
      expect(Math.abs(res.payload.amount!)).toBe(450.5);
      expect(res.chips.title).toBe('lunch');
    });

    it('parses "$1,200 rent" with dollar currency symbol -> amount 1200', () => {
      const res = parseQuickCapture('$1,200 rent', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(1200);
      expect(Math.abs(res.payload.amount!)).toBe(1200);
      expect(res.chips.title).toBe('rent');
    });

    it('parses "₹1,200" with no title into default transaction title', () => {
      const res = parseQuickCapture('₹1,200', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.type).toBe('expense');
      expect(res.chips.amount).toBe(1200);
      expect(Math.abs(res.payload.amount!)).toBe(1200);
      expect(res.chips.title).toBe('Quick Capture Transaction');
    });

    it('does NOT treat "item 1,5" as an expense (invalid comma grouping without currency)', () => {
      const res = parseQuickCapture('item 1,5', mockContext);
      expect(res.target).not.toBe('transaction');
      expect(res.chips.type).not.toBe('expense');
      expect(res.chips.amount).toBeUndefined();
    });

    it('does NOT treat invalid comma grouping "e 1,5" as 15 rupees', () => {
      const res = parseQuickCapture('e 1,5', mockContext);
      expect(res.target).toBe('transaction');
      expect(res.chips.amount).toBe(1); // 1, not 15
      expect(res.chips.title).toBe('5');
    });
  });

  // 4. Category Guessing
  it('guesses category correctly from words (coffee -> Cafe & Dining)', () => {
    const res = parseQuickCapture('₹180 iced latte coffee', mockContext);
    expect(res.chips.category).toBe('Cafe & Dining');
    expect(res.chips.categoryId).toBe('cat-cafe');
  });

  it('guesses category for transit (metro / bus)', () => {
    const res = parseQuickCapture('₹200 metro card recharge', mockContext);
    expect(res.chips.category).toBe('Transit');
    expect(res.chips.categoryId).toBe('cat-transit');
  });

  it('guesses category for books and textbooks', () => {
    const res = parseQuickCapture('₹950 algorithms textbook', mockContext);
    expect(res.chips.category).toBe('Books & Stationery');
    expect(res.chips.categoryId).toBe('cat-books');
  });

  it('leaves category empty for user to pick when no category matches', () => {
    const res = parseQuickCapture('₹1500 mystery gadget', mockContext);
    expect(res.target).toBe('transaction');
    expect(res.chips.type).toBe('expense');
    expect(res.chips.category).toBeNull();
    expect(res.chips.categoryId).toBeNull();
  });

  // 5. Priority Mapping
  it('maps !low to priority 1', () => {
    const res = parseQuickCapture('clean desk tomorrow !low', mockContext);
    expect(res.target).toBe('task');
    expect(res.payload.priority).toBe(1);
    expect(res.chips.priority).toBe(1);
    expect(res.payload.title).not.toContain('!low');
  });

  it('maps !med and !medium to priority 2', () => {
    const res1 = parseQuickCapture('t Review pull request !med', mockContext);
    expect(res1.payload.priority).toBe(2);

    const res2 = parseQuickCapture('t Review pull request !medium', mockContext);
    expect(res2.payload.priority).toBe(2);
  });

  it('maps !high to priority 3', () => {
    const res = parseQuickCapture('t Prepare presentation !high', mockContext);
    expect(res.payload.priority).toBe(3);
    expect(res.chips.priority).toBe(3);
  });

  it('maps !urgent to priority 4', () => {
    const res = parseQuickCapture('t Server downtime fix !urgent', mockContext);
    expect(res.payload.priority).toBe(4);
    expect(res.chips.priority).toBe(4);
  });

  it('defaults task priority to 2 when no priority is specified', () => {
    const res = parseQuickCapture('t Simple task tomorrow', mockContext);
    expect(res.payload.priority).toBe(2);
  });

  // 6. Project & Course Matching
  it('matches @project by name and links project ID', () => {
    const res = parseQuickCapture('t Implement virtual memory @operating-systems', mockContext);
    expect(res.target).toBe('task');
    expect(res.payload.projectId).toBe('proj-os');
    expect(res.chips.project).toBe('Operating Systems');
    expect(res.payload.title).not.toContain('@operating-systems');
  });

  it('ignores @name when no matching project exists', () => {
    const res = parseQuickCapture('t Meet @johndoe tomorrow', mockContext);
    expect(res.payload.projectId).toBeNull();
  });

  it('extracts #name as course tag for assignments', () => {
    const res = parseQuickCapture('a Lab Report 1 #cs-tripos tomorrow', mockContext);
    expect(res.target).toBe('assignment');
    expect(res.payload.subject).toBe('cs-tripos');
  });

  // 7. Date & Time Parsing in Profile Timezone
  it('parses "today" as today\'s date in profile timezone', () => {
    const res = parseQuickCapture('t Submit reflection today', mockContext);
    expect(res.chips.date).toBe('2026-11-19');
    expect(res.payload.title).toBe('Submit reflection');
  });

  it('parses "tomorrow" as tomorrow\'s date in profile timezone', () => {
    const res = parseQuickCapture('t Study algorithms tomorrow', mockContext);
    expect(res.chips.date).toBe('2026-11-20');
    expect(res.payload.title).toBe('Study algorithms');
  });

  it('parses "in 2 days" accurately', () => {
    const res = parseQuickCapture('t Team standup in 2 days', mockContext);
    expect(res.chips.date).toBe('2026-11-21');
  });

  it('parses weekday name "friday" to the upcoming Friday', () => {
    // 2026-11-19 is Thursday. Friday is tomorrow (2026-11-20).
    const res = parseQuickCapture('t Hand in assignment friday', mockContext);
    expect(res.chips.date).toBe('2026-11-20');
  });

  it('parses weekday name "monday" to next Monday', () => {
    // 2026-11-19 is Thursday. Next Monday is 2026-11-23.
    const res = parseQuickCapture('t Weekly sprint planning monday', mockContext);
    expect(res.chips.date).toBe('2026-11-23');
  });

  it('parses explicit date like "Nov 24"', () => {
    const res = parseQuickCapture('t Final paper draft Nov 24', mockContext);
    expect(res.chips.date).toBe('2026-11-24');
    expect(res.payload.title).toBe('Final paper draft');
  });

  it('parses inverted date like "24 Nov"', () => {
    const res = parseQuickCapture('t Final paper draft 24 Nov', mockContext);
    expect(res.chips.date).toBe('2026-11-24');
  });

  // 8. Time preservation in Title (Rule 6)
  it('preserves "6pm" in task title while storing only the date in chip', () => {
    const res = parseQuickCapture('t Group meeting 6pm tomorrow', mockContext);
    expect(res.target).toBe('task');
    expect(res.chips.date).toBe('2026-11-20');
    expect(res.payload.title).toBe('Group meeting 6pm');
  });

  it('preserves "18:00" in title while storing only the date in chip', () => {
    const res = parseQuickCapture('t Lab checkout 18:00 today', mockContext);
    expect(res.chips.date).toBe('2026-11-19');
    expect(res.payload.title).toBe('Lab checkout 18:00');
  });

  // 9. Prefix Shortcuts
  it('prefix shortcut "t " forces task target', () => {
    const res = parseQuickCapture('t Buy groceries', mockContext);
    expect(res.target).toBe('task');
    expect(res.payload.title).toBe('Buy groceries');
  });

  it('prefix shortcut "e " forces expense target', () => {
    const res = parseQuickCapture('e 300 dinner', mockContext);
    expect(res.target).toBe('transaction');
    expect(res.chips.type).toBe('expense');
    expect(Math.abs(res.payload.amount!)).toBe(300);
    expect(res.chips.amount).toBe(300);
  });

  it('prefix shortcut "i " forces idea/note target', () => {
    const res = parseQuickCapture('i Neural network loss formulation thoughts', mockContext);
    expect(res.target).toBe('note');
    expect(res.summaryPill).toContain('Save as idea');
  });

  it('prefix shortcut "a " forces assignment target', () => {
    const res = parseQuickCapture('a Math Homework 3 #math Nov 24', mockContext);
    expect(res.target).toBe('assignment');
    expect(res.chips.date).toBe('2026-11-24');
    expect(res.payload.subject).toBe('math');
  });

  // 10. Habit Check-In Rules (Rule 4)
  it('offers "Check in habit" when input exactly matches an uncompleted habit', () => {
    const res = parseQuickCapture('Morning sunlight & walk', mockContext);
    expect(res.target).toBe('habit');
    expect(res.payload.habitId).toBe('h-walk');
    expect(res.payload.isAlreadyCompletedToday).toBe(false);
    expect(res.summaryPill).toContain('Check in habit');
  });

  it('shows "Already done" when input matches a habit already completed today', () => {
    const res = parseQuickCapture('Read 20 pages', mockContext);
    expect(res.target).toBe('habit');
    expect(res.payload.habitId).toBe('h-read');
    expect(res.payload.isAlreadyCompletedToday).toBe(true);
    expect(res.chips.statusNote).toBe('Already done');
    expect(res.summaryPill).toBe('Habit: Already done today');
  });

  // 11. Fallback to Idea (Nothing Lost)
  it('treats unknown un-prefixed text as an idea so nothing is lost', () => {
    const res = parseQuickCapture('Build a spatial canvas for graph theory', mockContext);
    expect(res.target).toBe('note');
    expect(res.summaryPill).toContain('Save as idea');
    expect(res.payload.title).toBe('Build a spatial canvas for graph theory');
  });

  // 12. Midnight Boundary Test (Asia/Kolkata)
  it('strictly handles midnight boundary in Asia/Kolkata timezone (23:59:59 vs 00:00:01)', () => {
    // 23:59:59 IST on 2026-11-19 is 18:29:59 UTC
    const beforeMidnightUtc = new Date('2026-11-19T18:29:59.000Z');
    const beforeTz = getDateInTimezone(beforeMidnightUtc, 'Asia/Kolkata');
    expect(beforeTz.dateString).toBe('2026-11-19');

    const beforeRes = parseQuickCapture('t Late night task today', {
      timezone: 'Asia/Kolkata',
      referenceDate: beforeMidnightUtc,
    });
    expect(beforeRes.chips.date).toBe('2026-11-19');

    // 00:00:01 IST on 2026-11-20 is 18:30:01 UTC
    const afterMidnightUtc = new Date('2026-11-19T18:30:01.000Z');
    const afterTz = getDateInTimezone(afterMidnightUtc, 'Asia/Kolkata');
    expect(afterTz.dateString).toBe('2026-11-20');

    const afterRes = parseQuickCapture('t Post midnight task today', {
      timezone: 'Asia/Kolkata',
      referenceDate: afterMidnightUtc,
    });
    expect(afterRes.chips.date).toBe('2026-11-20');
  });
});
