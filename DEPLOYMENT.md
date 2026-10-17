# LifeOS Production Deployment Blueprint & Runbook

**Target Platform:** Vercel (Next.js Edge/Serverless Frontend) + Supabase Cloud (Managed PostgreSQL 15+)  
**Architecture:** Next.js App Router (React 19, RSC, Server Actions)

---

## 1. Production Environment Variables

Configure the following variables in **Vercel Project Settings -> Environment Variables** (and `.env.local` for local development):

| Variable Name | Description | Example / Format |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public API URL of your Supabase project | `https://eaawdzqfnwuokfjdyvpq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous JWT client key (RLS-enforced) | `eyJhbGciOi...` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | *(Optional/Modern)* Supabase publishable API key | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Admin/Migration only - never expose to client)* | `eyJhbGciOi...` |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for Auth redirects & SEO metadata | `https://life-os-ghost-a56a.vercel.app` |

> [!NOTE]
> The Supabase client in `src/lib/supabase/client.ts` supports both legacy JWT anon keys (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) and new Supabase publishable keys (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `sb_publishable_...`).

---

## 2. Supabase Auth Configuration & Redirect URLs

In your Supabase Dashboard under **Authentication -> URL Configuration**:

1. **Site URL:** Set to your production domain:
   ```text
   https://life-os-ghost-a56a.vercel.app
   ```
2. **Redirect URLs:** Add your canonical callback URLs:
   ```text
   https://life-os-ghost-a56a.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
3. **Email Provider:** Under **Authentication -> Providers -> Email**, ensure Email signup/login is enabled.

---

## 3. Database Schema, Migrations & Environment Separation

LifeOS enforces multi-tenant data isolation directly in PostgreSQL via Row-Level Security (RLS) policies scoped to `auth.uid()`.

### Strict Production Rules & Environment Separation

1. **Vercel Environment Separation:**
   - **Preview / Development Branches (`fix/*`, PRs):** Point to the `lifeos-dev` project (`eaawdzqfnwuokfjdyvpq`). All migration tests and PR previews run safely against this database.
   - **Production (`main`):** Points to the production Supabase project. **Never** point preview deployments to production credentials.
2. **Vercel Deployment Protection:**
   - Keep Vercel Deployment Protection enabled on Preview deployments to prevent unauthorized web crawlers or unauthorized visitors from probing pre-release branches.
3. **Database Discipline:**
   - **Never paste ad-hoc SQL into the Supabase Dashboard SQL Editor** without committing a corresponding versioned file in `supabase/migrations/`.
   - Apply schema changes via `npm run db:push`.
   - Keep Supabase automated daily backups enabled (in Supabase Dashboard -> Database -> Backups).

### Database Convenience Scripts

```bash
# Push all local migrations in supabase/migrations/ to the linked Supabase project
npm run db:push

# Re-generate TypeScript types from the linked Supabase schema
npm run db:types

# Run the Phase 1 RLS security & two-user isolation verification suite
npm run verify:rls
```

### Applying Schema & RLS Migrations

#### Option A: Supabase CLI (Recommended)
```bash
# 1. Login to Supabase CLI
npx supabase login

# 2. Link your local repo to your target Supabase project
npx supabase link --project-ref <your-project-ref>

# 3. Push pending migrations
npm run db:push
```

#### Option B: Idempotent Setup Script
If provisioning a new instance from scratch, execute `supabase/consolidated_dev_setup.sql` in the **Supabase Dashboard -> SQL Editor**. This idempotent script:
- Creates all 9 tables (`profiles`, `projects`, `tasks`, `categories`, `transactions`, `notes`, `assignments`, `habits`, `habit_logs`)
- Enables RLS on all 9 tables
- Enforces `owner full access` policies (`USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()))`)
- Hardens the `promote_to_project` RPC with `SECURITY DEFINER`, fixed `search_path = public`, and unforgeable `auth.uid()` validation
- Establishes performance indexes on `user_id` and query filters

### Verifying Database Security

Run the verification script to ensure anonymous queries are blocked and RPC authentication is enforced:
```bash
npm run verify:rls
```
Expected output:
- All 9 tables return `0 rows returned (RLS filtered)` or `Access Denied`
- `promote_to_project` RPC returns unauthenticated execution blocked
- Two-user isolation test confirms User B cannot read or tamper with User A rows

---

## 4. Vercel Deployment Configuration

### `vercel.json` Specification
Root `vercel.json` configures strict HTTP security headers including Content Security Policy (CSP), frame denial, and MIME sniffing protection:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;" }
      ]
    }
  ]
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

## 5. Production Smoke Test Verification Checklist

Once deployed to production:
1. **Landing Page & SEO**: Visit `/` and verify honest feature copy, OpenGraph/Twitter tags, `/robots.txt`, and `/sitemap.xml`.
2. **Auth Verification**: Navigate to `/login` and test sign-up / sign-in. Verify session cookies are set and redirect routes to `/dashboard`.
3. **RLS Isolation**: Confirm that all loaded tasks, projects, notes, and transactions belong strictly to the authenticated user.
4. **Quick Capture**: Press `⌘K` / `Ctrl+K`, enter `$45 dinner #cloud-revamp`, and confirm insertion into the user's ledger.
5. **Hydration & Responsiveness**: Open Browser Console (DevTools) and confirm **0 hydration warnings or layout shift errors**.
