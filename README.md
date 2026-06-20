# Compass

A personal navigator for parents of autistic and special needs children. Compass
knows your child, knows your journey, and tells you what to do next.

## Tech stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Supabase** for Postgres, Auth, and file storage
- **Claude API** (`claude-sonnet-4-6`) as the AI brain — document extraction, the
  "what comes next" engine, and the IEP Coach

## Features

1. **Auth & Onboarding** — email/password signup, then a guided flow to capture the
   child's name, age, diagnosis, current services, and location.
2. **The Roadmap** — upload IEPs, evaluations, or therapy notes (PDF/image). Claude
   extracts diagnoses, services, goals, recommendations, and key dates, builds a
   visual timeline, generates proactive "what comes next" suggestions, and exports a
   one-page PDF summary parents can hand to doctors/teachers.
3. **The Directory** — search specialists by ZIP code, specialty type, insurance, and
   telehealth availability.
4. **The Village** — a community feed with topic tags and threaded comments.
5. **IEP Coach** — upload an IEP and get a plain-English section-by-section
   explanation, flags on anything to question, and a list of questions for the next
   IEP meeting.
6. **Benefits Finder** (`/dashboard/benefits`) — pick a state and Claude generates
   Medicaid waivers, Regional Center services, SSI basics, ABLE accounts, state
   grants, tax credits, and respite funding, grouped into cards with a "Save to my
   profile" action (`saved_benefits` table). Includes a disclaimer that results are
   informational and should be verified with official sources.
7. **Weekly Digest Email** — `/api/digest/send` (cron-triggered, secret-protected)
   fetches every user with digests enabled, has Claude write the week's content
   (appointments, IEP deadlines, a focus tip, a trending Village post, a closing
   line), renders it into a hand-built warm HTML email, and sends it via a raw HTTP
   POST to Mailgun's API (no email SDK). Every send is logged to `digest_logs`.
   `/api/digest/preview` returns the same HTML for the current user so you can view
   it in the browser without sending anything. Toggle on `/dashboard/settings`.
8. **Milestone Alerts** — the "Coming up" section on `/dashboard` reads roadmap items
   and child profile data, and Claude surfaces time-sensitive alerts (IEP renewal
   windows, age-based transition planning, evaluations that may be due for an
   update). Each alert can be marked done or snoozed for 30 days (`milestone_alerts`
   table).

## Project structure

```
src/
  app/
    page.tsx                  Landing page
    login/, signup/           Auth pages
    onboarding/                Multi-step onboarding flow
    (app)/                    Authenticated app shell (sidebar layout)
      dashboard/              Dashboard home ("Coming up"), benefits/, settings/
      roadmap/                The Roadmap (hero feature)
      directory/              The Directory
      village/                The Village (community)
      iep-coach/              IEP Coach
    api/                      Route handlers (uploads, Claude calls, PDF export, etc.)
  components/                 Shared UI (nav, cards, badges, forms)
  lib/
    supabase/                 Browser/server/middleware Supabase clients
    claude/                   Claude API wrappers (extraction, next-steps, IEP coach,
                               benefits, digest content, milestone alerts)
    email/                    HTML email template + Mailgun HTTP sender
    digest/                   Shared digest-building logic (used by send + preview)
    types.ts                  Shared TypeScript types
supabase/
  migrations/
    0001_init.sql             Core schema, RLS policies, storage bucket
    0002_features.sql         saved_benefits, digest_logs, milestone_alerts
  seed.sql                    Sample specialists for local dev
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_features.sql` — together these create every table, RLS
   policy, the `documents` storage bucket, and the trigger that mirrors new
   `auth.users` into `public.users`.
3. Optionally run `supabase/seed.sql` to populate a handful of sample specialists for
   the Directory.
4. Go to Project Settings → API and copy your Project URL, anon key, and service
   role key.

### 3. Get an Anthropic API key

Create a key at [console.anthropic.com](https://console.anthropic.com).

### 3b. Get a Mailgun account (only needed for the weekly digest)

Create a domain at [mailgun.com](https://mailgun.com) and grab your private API key.
The Benefits Finder and Milestone Alerts features work without this — it's only
required to actually send (not preview) digest emails.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key
MAILGUN_API_KEY=your-mailgun-private-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
DIGEST_FROM_EMAIL=compass@yourdomain.com
DIGEST_CRON_SECRET=a-long-random-string
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). Sign up, complete onboarding,
and you'll land on the Roadmap.

### 6. Email confirmation (optional, for local dev)

By default Supabase requires email confirmation before a session is issued. For fast
local testing, you can disable it: Authentication → Providers → Email → turn off
"Confirm email". In production, leave it on and the signup flow already handles the
"check your inbox" state.

## Notes on the Claude integration

- `src/lib/claude/extract.ts` sends uploaded PDFs/images directly to Claude as a
  document/image content block and asks for structured JSON (diagnoses, services,
  goals, recommendations, important dates). That JSON populates `roadmap_items` and
  merges new diagnoses/services into the child's profile.
- `src/lib/claude/next-steps.ts` feeds the child's profile + roadmap history back to
  Claude to generate proactive, age/diagnosis-aware next steps.
- `src/lib/claude/iep-coach.ts` does a deeper read of IEP documents specifically:
  plain-English section explanations, flags on weak/non-compliant language, and a
  tailored list of questions for the next IEP meeting.

- `src/lib/claude/benefits.ts` asks Claude for a state's Medicaid waivers, Regional
  Center services, SSI, ABLE accounts, grants, tax credits, and respite funding as
  structured JSON, grouped by a fixed category enum so the UI can group cards
  consistently.
- `src/lib/claude/digest.ts` turns a user's roadmap data + a trending Village post
  into the digest *content* (JSON, not HTML) — `src/lib/email/template.ts` then
  renders that content into the actual inline-styled HTML email, so Claude never
  controls markup directly.
- `src/lib/claude/milestones.ts` looks at roadmap dates, evaluation history, and the
  child's age to surface grounded, date-aware alerts (IEP renewal windows, age-based
  transitions, stale evaluations) — it's instructed to return an empty array rather
  than invent a date it can't support from the data.

All Claude calls use `claude-sonnet-4-6` and expect raw JSON back — the wrappers
extract the first/last `{}`/`[]` from the response defensively.

## Sending the weekly digest

`/api/digest/send` is meant to be hit by an external scheduler (cron, a Supabase Edge
Function on a schedule, GitHub Actions, etc.) — it is **not** called from the browser.
It requires a matching secret header:

```bash
curl -X POST https://yourapp.com/api/digest/send \
  -H "x-digest-secret: $DIGEST_CRON_SECRET"
```

It uses the Supabase **service role** key to read every user with
`email_digest_enabled = true`, builds each digest, sends it via Mailgun's HTTP API
(`fetch` + Basic auth, no email SDK), and logs the result (`sent`/`failed`) to
`digest_logs`. To preview your own digest without sending anything, visit
`/api/digest/preview` while logged in — it returns the rendered HTML directly.

## Known limitations / next steps

- The Next.js dependency is pinned to the latest `14.2.x` patch. A few non-critical
  advisories (image optimization, RSC cache poisoning) only have fixes on Next 16,
  which is a breaking upgrade — not done here since the brief asked for Next 14.
- Directory search currently matches ZIP code exactly; a production version would
  want radius-based geo search (e.g. via PostGIS).
- IEP Coach analyses aren't persisted — each upload is a fresh Claude call. Worth
  storing in `documents`/a dedicated table if parents want history.
- "Upcoming appointments" in the digest and Roadmap timeline are derived from
  `roadmap_items.item_date` — there's no dedicated appointments/calendar table yet.
  If real scheduling becomes a feature, it deserves its own table rather than
  overloading roadmap items.
- The Benefits Finder doesn't cache results — every state search is a fresh Claude
  call. Given how slowly benefit programs change, caching by state for a day or two
  would cut cost without hurting freshness.
- Milestone alert generation is triggered manually (a "check for alerts" button) — a
  production version would want this to run on a schedule per user, similar to the
  digest job.
