# LifeOS Production Deployment Blueprint & Runbook

**Target Platform:** Vercel (Next.js Edge/Serverless Frontend) + Supabase Cloud (Managed PostgreSQL 15+)  
**Architecture:** Next.js App Router (React 19, RSC, Server Actions)

---

## 1. Production Environment Variables

Configure the following variables in the **Vercel Project Settings -> Environment Variables** (and `.env.production`):

| Variable Name | Description | Example / Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public API URL of your production Supabase project | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous JWT client key (RLS-enforced) | `eyJh...` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Optional / Admin only)* Secure backend service role key | `eyJh...` |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for Auth redirects & magic links | `https://lifeos.yourdomain.com` |

---

## 2. Supabase Cloud Schema Push & Migration Sequence

To deploy all local tables, indexes, triggers, and Row Level Security (RLS) policies to production without manual schema drift:

### Step 1: Login to Supabase CLI & Link Project
```bash
# Authenticate CLI with your Supabase account
supabase login

# Link your local repo to your production Supabase project ref
supabase link --project-ref <your-production-project-ref>
```

### Step 2: Push Database Migrations
Executes all SQL migration files in `supabase/migrations/` sequentially inside a single transaction:
```bash
# Push base schema, RLS policies, indexes, and promote_to_project RPC
supabase db push
```

### Step 3: Verify Critical Indexes and Stored Procedures
Confirm the following exist on the production database:
```sql
-- 1. Sub-millisecond Quick Capture Project Lookup
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'projects' AND indexname = 'idx_projects_slug';

-- 2. Atomic Promotion Stored Procedure
SELECT proname FROM pg_proc WHERE proname = 'promote_to_project';
```

---

## 3. Vercel Deployment Configuration

### `vercel.json` Specification
Place in the root directory for optimized caching and security headers:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Deploying via Vercel CLI
```bash
# Deploy preview build
npx vercel

# Deploy directly to production
npx vercel --prod
```

---

## 4. Production Smoke Test Verification Checklist

Once deployed to production:
1. **Auth Callback Verification**: Visit `https://lifeos.yourdomain.com/login` and verify email magic link or password authentication.
2. **Quick Capture Latency**: Press `⌘K` / `Ctrl+K`, enter `$45 dinner #cloud-revamp`, and confirm instantaneous insertion and revalidation.
3. **Optimistic UI Responsiveness**: Toggle daily tasks and drag Kanban cards to verify immediate zero-snapback responsiveness.
4. **Hydration Integrity**: Open Browser Console (DevTools) and confirm **0 hydration warnings or layout shift errors**.
