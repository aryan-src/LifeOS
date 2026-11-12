/**
 * Static demo data for LifeOS landing page.
 * Keeps preview cards completely detached from real user data.
 */

export interface SpendingDay {
  day: string;
  height: string;
  isToday?: boolean;
}

export interface DemoProject {
  title: string;
  status: string;
  variant: 'active' | 'backlog' | 'paused';
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  emailLink?: string;
}

export interface BenefitItem {
  label: string;
  title: string;
  description: string;
  gridSpan: 's4' | 's2' | 'full';
}

export interface StepItem {
  number: number;
  title: string;
  description: string;
}

export const SAMPLE_POCKET_MONEY = {
  label: 'Pocket money · Nov',
  amount: '₹1,212',
  progressPercent: 76,
  caption: 'left of ₹5,000, about ₹60 a day',
};

export const SAMPLE_SPENDING = {
  label: 'Last 7 days · spending',
  amount: '₹718',
  sublabel: 'about ₹103 a day',
  days: [
    { day: 'Thu', height: '65%' },
    { day: 'Fri', height: '21%' },
    { day: 'Sat', height: '0%' },
    { day: 'Sun', height: '78%' },
    { day: 'Mon', height: '100%' },
    { day: 'Tue', height: '40%' },
    { day: 'Wed', height: '27%', isToday: true },
  ] as SpendingDay[],
};

export const SAMPLE_PROJECTS: DemoProject[] = [
  { title: 'Portfolio site', status: 'Active', variant: 'active' },
  { title: 'Lab report', status: 'Backlog', variant: 'backlog' },
  { title: 'Study group notes', status: 'Paused', variant: 'paused' },
];

export const SAMPLE_FOCUS = {
  label: 'Today’s focus',
  timer: '25:00',
  chip: '2 of 4 pomodoros',
  progressPercent: 60,
  caption: '3 of 5 tasks done',
};

export const SAMPLE_HABIT = {
  label: 'Habits',
  name: 'Practice coding',
  streak: '4 day streak',
  dots: [true, true, false, true, true, true, false],
  caption: '5 of 7 days this week',
};

export const SAMPLE_IDEA = {
  label: 'Recent ideas',
  text: 'Try pre and post increment questions before Friday.',
  action: 'Promote to project',
};

export const TAGLINE_WORDS: string[] = [
  'Plan',
  'the',
  'day.',
  'Guard',
  'the',
  'cash.',
  'Keep',
  'the',
  'streak.',
  'Catch',
  'the',
  'idea.',
  'One',
  'calm',
  'screen.',
];

export const BENEFITS: BenefitItem[] = [
  {
    label: 'Pocket money',
    title: 'Know what you can spend today',
    description:
      'Set a monthly budget and see a safe daily amount, a 7 day spending chart and a breakdown by category.',
    gridSpan: 's4',
  },
  {
    label: 'Tasks',
    title: 'Finish the day’s work',
    description: 'Daily and weekly tasks, with a pomodoro timer and sprints built in.',
    gridSpan: 's2',
  },
  {
    label: 'Habits',
    title: 'Keep your streaks alive',
    description: 'Tick a habit each day and watch your weekly pattern build.',
    gridSpan: 's2',
  },
  {
    label: 'Projects',
    title: 'See where every project stands',
    description:
      'Backlog, active, paused or completed, shown as a board, a list or a timeline.',
    gridSpan: 's4',
  },
  {
    label: 'Notes',
    title: 'Never lose an idea',
    description:
      'Scribble it down the moment it arrives, then promote it to a project in one click.',
    gridSpan: 'full',
  },
];

export const HOW_IT_WORKS_STEPS: StepItem[] = [
  {
    number: 1,
    title: 'Create your free account',
    description: 'Sign up for free and your dashboard is ready to fill.',
  },
  {
    number: 2,
    title: 'Add your budget, tasks and habits',
    description:
      'Enter your monthly pocket money, today’s tasks and the habits you want to keep.',
  },
  {
    number: 3,
    title: 'Check in at a glance',
    description: 'See your safe daily spend, today’s focus and your streaks on one screen.',
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-is-lifeos',
    question: 'What is LifeOS?',
    answer:
      'A single dashboard that tracks your pocket money, daily and weekly tasks, habits, projects and ideas.',
  },
  {
    id: 'is-it-free',
    question: 'Is it really free?',
    answer:
      'Yes, LifeOS is free to use right now. If that changes, you’ll hear about it before it does.',
  },
  {
    id: 'need-a-card',
    question: 'Do I need a card to sign up?',
    answer: 'No. You only need an account to start.',
  },
  {
    id: 'is-data-private',
    question: 'Is my data private?',
    answer:
      'Your budget, tasks, habits, projects and notes live in your own account, and other users can’t see them.',
  },
  {
    id: 'work-on-phone',
    question: 'Does it work on my phone?',
    answer: 'Yes. LifeOS runs in your phone’s browser, so there’s nothing to install.',
  },
  {
    id: 'delete-data',
    question: 'Can I delete my data?',
    answer: 'Yes. You can delete any habit, note or project whenever you like.',
  },
  {
    id: 'report-bug',
    question: 'How do I report a bug or suggest a feature?',
    answer: 'Email aryan.prajapati.dev@gmail.com. I read every message.',
    emailLink: 'aryan.prajapati.dev@gmail.com',
  },
];

export const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};
