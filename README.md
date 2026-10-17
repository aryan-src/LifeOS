# LifeOS

A minimalist, zero-latency daily personal OS designed for students and builders. Coordinates academic planning, task execution, daily habits, financial tracking, and idea incubation in a calm, distraction-free workspace.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Supabase Postgres** (enforcing database-level Row Level Security), **Tailwind CSS**, and **Motion**.

---

## Architecture & Principles

- **Zero-Latency Interactions:** Optimistic UI state updates with instant tactile feedback (0ms perceived latency) backed by atomic PostgreSQL server mutations.
- **Strict Row-Level Security (RLS):** Every table (`profiles`, `projects`, `tasks`, `categories`, `transactions`, `notes`, `assignments`, `habits`, `habit_logs`) enforces strict owner isolation via `auth.uid() = user_id`.
- **Server Action Validation:** Every mutating action is strictly parsed and sanitized with `zod` schemas before hitting the database.
- **Clean Single-Package Motion:** Standardized on `motion/react` with accessible animations respecting `prefers-reduced-motion`.
- **100% Self-Hosted Assets:** Local typography and icons without external CDN tracking or external Google Fonts requests.

---

## Workspace Modules

1. **LifeOS Command Center (`/dashboard`)**
   - Real-time telemetry quadrant aggregating active projects, focus tasks, pocket allowance runway, and upcoming assignments.
2. **Projects Kanban (`/projects`)**
   - Full drag-and-drop Kanban workflow with stages (Backlog, Active, Paused, Completed), project-linked budget burndown, and completion percentages.
3. **Daily Tasks & Focus Pomodoro (`/tasks`)**
   - Tactile task checklist, priority tagging, and an ambient vapor-digit Pomodoro focus timer.
4. **Habit Tracker (`/habits`)**
   - 0ms streak logging, 7-day consistency visualization, and weekly completion rate analytics.
5. **Academic Assignments (`/assignments`)**
   - Course assignment tracker with stage progression (`not_started` &rarr; `in_progress` &rarr; `submission_pending` &rarr; `submitted` &rarr; `graded`) and grade calculator.
6. **Pocket Money Ledger (`/finances`)**
   - Daily safe spend calculators, category distribution breakdowns, trailing 7-day interactive bar chart, and expense logs.
7. **Ideas & Notes (`/notes`)**
   - Markdown scratchpad with atomic promotion to active projects via PostgreSQL ACID procedures.
8. **Quick Capture Omnibar (`⌘K` / `Ctrl+K`)**
   - Global keyboard modal for rapid natural input routing across tasks, expenses, notes, and assignments.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.3.8 (App Router, Server Components & Server Actions) |
| **Language** | TypeScript (Strict mode, zero `any` policy) |
| **Database & Auth** | Supabase PostgreSQL with Row Level Security (RLS) & Auth |
| **Styling** | Tailwind CSS 3.4 with custom theme tokens |
| **Validation** | Zod 3.23 |
| **Animation** | Motion (`motion/react`) |
| **Icons** | Lucide React |
| **Testing** | Vitest & Playwright |

---

## Getting Started

### Prerequisites
- Node.js 18.18+ (Node 20+ recommended)
- A Supabase project (Free or Pro)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/aryan-src/LifeOS.git
cd LifeOS
npm install
```

### 2. Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Migration
In your Supabase project's **SQL Editor**, run the consolidated schema setup script located at:
```
supabase/consolidated_dev_setup.sql
```
This migration enables Row Level Security (RLS) across all tables, creates owner policies, configures profile synchronization triggers, and installs the atomic `promote_to_project` stored procedure.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page, or authenticate at `/login` to access the main workspace.

---

## Verification & Testing

Run all quality checks locally:

```bash
# Typecheck
npx tsc --noEmit

# Lint (Zero errors, zero warnings, @typescript-eslint/no-explicit-any enforced)
npm run lint

# Unit Tests (15 test suites, 93 tests)
npm test

# Production Build
npm run build
```

---

## License

This project is open source and available under the [MIT License](LICENSE).
