# Compass

Compass is a navigator app for parents of autistic and special-needs
children. Getting a diagnosis is the easy part — the hard part is
everything after: figuring out what an IEP actually means, finding a
therapist who takes your insurance, learning what your state will
actually pay for, and not feeling alone while you do it. Compass puts all
of that in one place and uses AI to do the research a parent would
otherwise spend hours doing themselves.

This README covers what's actually built and working today, including
what was built specifically for the Terac challenge.

## Key Features

### Roadmap
Upload an IEP, evaluation, or therapy note (PDF or image) and Claude
extracts diagnoses, current services, goals, recommendations, and
important dates directly from the document. Those extracted items build a
timeline, and a separate Claude call generates 3–6 concrete "next steps"
(with urgency: now / soon / upcoming) based on the child's profile and
extraction history. This is the entry point for a parent who just got a
new document and doesn't know what to do with it.

### IEP Coach
Upload an IEP and get a plain-English, section-by-section breakdown:
what each part means, which parts are worth raising concerns about,
and a list of questions to bring to the next IEP meeting. Stateless —
nothing is persisted, it's a one-time analysis tool.

### Directory (Specialist Search)
Search for ABA, speech, OT, PT, psychology, or developmental-pediatrics
providers by ZIP code. Live results come from a Browserbase/Stagehand
agent that searches Psychology Today and extracts real listings (name,
phone, address, description, profile link), cached for 7 days per
ZIP+specialty. Results can be saved for later, and each one can get an
on-demand Claude-generated summary.

### Benefit Finder
Same Browserbase/Stagehand approach, pointed at findhelp.org, searching
for Medicaid waivers, SSI, Regional Center / state DD-agency programs,
and other disability-specific assistance — targeted using the child's
diagnosis, age bracket, and current services so results lean toward
specific, relevant programs rather than generic disability listings.
Results are cached for 7 days and can be saved.

### Village
A public community feed — parents post under topics (newly diagnosed,
IEP help, school, behavior, therapies, general) and reply in threaded
comments. Every post and comment passes through a Claude moderation
check before publishing. Deliberately feed-only: no private messaging
between parents.

### Poke (text assistant)
During onboarding (or later in Settings), a parent can save their phone
number and connect to a pre-built Poke recipe, letting them text
Compass-related questions via iMessage/SMS without opening the app. The
phone number is the only thing Compass itself stores and manages — the
text-handling logic lives in Poke's hosted recipe.

### Live-Connect (mic-first AI intake)
This is the feature built specifically around the Terac challenge — see
the next section for the full breakdown of how it works and what it
measures.

## The Terac Challenge: How Compass Uses It

The core idea: instead of routing a parent to a real human specialist (a
licensed clinician) for an emotionally difficult moment, Compass routes
them to an **AI comfort companion** first, and uses **Terac's
general-population annotator marketplace** to evaluate and improve the
AI's output with real human judgment — without needing licensed
clinicians in the loop at all.

### The flow

1. A parent presses a single mic button on `/connect`. No form, no
   waiting room.
2. A private Daily.co video room is created immediately for that
   request (in case anyone wants to join later).
3. A Vapi voice agent talks to the parent in-browser — a "comfort
   companion," not a clinician — and listens to whatever they want to
   talk through.
4. When the call ends, Vapi generates a summary and posts it to
   Compass's webhook.
5. Compass creates and launches a **Terac opportunity**: a task asking a
   general-population annotator to read the AI-generated summary and
   rate it.
6. Compass polls Terac for a claimed submission. Once someone claims the
   task, it's auto-approved and the request status flips to
   `scheduled`. The parent gets a link to join the Daily call room if
   they want to talk live to whoever picked up the task; the annotator
   gets the same link from their task page.

### What the annotator actually does

The Terac participant lands on a public Compass page
(`/annotate/{requestId}` — no login required, since they have no Compass
account) and:

- Reads the AI-generated summary of the parent's call.
- Rates its **clarity** on a 1–5 scale.
- Optionally writes a **corrected/improved version** of the summary.
- Optionally leaves free-text notes.

That submission is stored in an `annotations` table, tied back to the
Terac submission ID. This is the human-data-collection half of the
challenge: real people, not the model itself, judging and correcting AI
output.

### The before/after evaluation methodology

The annotation data feeds a second pipeline designed to measure whether
human feedback actually improves the AI's summaries — via a **blind A/B
comparison**, also run through Terac, so the evaluation itself is human
judgment, not a self-graded metric.

1. `scripts/build-improved-prompt.mjs` — pulls real corrected summaries
   out of the `annotations` table and uses them as few-shot examples to
   build a `v2_improved` prompt (falls back to hand-written guidelines
   from common failure patterns if no corrections exist yet).
2. `scripts/run-eval.mjs` — runs 8 fixed, held-out test scenarios
   (realistic intake-call transcripts) through both `v1_baseline` and
   `v2_improved` prompts via Claude, producing paired summaries.
3. `scripts/collect-blind-eval.mjs` — randomly assigns each pair's two
   summaries to slots A/B (the v1/v2 label is hidden), writes them to a
   `comparison_pairs` table, and launches a **second, separate Terac
   opportunity** — one task per pair, at `/compare/{pairId}` — asking
   general-population annotators which summary is clearer, with no idea
   which one came from which prompt version.
4. `scripts/report-results.mjs` — tallies `comparison_results` against
   the hidden labels and prints how often `v2_improved` was preferred
   over `v1_baseline`.

**Honesty about current status:** the annotation pipeline (steps 1–6 of
the live-connect flow above) is live and wired end-to-end through real
calls. The four-script before/after pipeline is fully built and ready to
run, but has not been executed for this submission — `scripts/generated/`
doesn't exist yet, meaning no real win-rate number is being reported.
Running it requires existing annotation data (real corrected summaries)
and spends real Terac opportunity credits. The infrastructure is real;
the numbers, if quoted anywhere else, are not.

### Why general-population annotators, not clinicians

Per the Terac challenge's design, annotators are general members of the
public, not screened for any clinical credential. Compass's screening
question is deliberately minimal (an optional free-text "anything you'd
like us to know before starting" field) — there's no profession-based
filter. This is a hackathon-rules constraint, not a production design
choice: a real deployment of this idea would need either licensed
reviewers or a much more careful consent/safety framework before any
annotator is shown details from an emotionally vulnerable parent's call.

## Tech Stack

**Framework**
- Next.js 14 (App Router), React 18, TypeScript
- Tailwind CSS

**Database & Auth**
- Supabase (Postgres, Auth, Row-Level Security, Storage)

**AI / LLM**
- Anthropic Claude (`claude-sonnet-4-6`) — document extraction, IEP
  analysis, next-steps generation, specialist/benefit summaries,
  community moderation, and the live-connect eval scripts

**Browser automation**
- Browserbase + Stagehand — live web search/extraction against
  Psychology Today (specialists) and findhelp.org (benefits)

**Live-connect stack**
- Vapi — in-browser voice AI agent (the "comfort companion")
- Daily.co — video call rooms, created per request
- Terac REST API (`https://terac.com/api/external/v2`) — opportunity
  creation, launch, submission polling/approval. Note: a `.mcp.json`
  pointing at Terac's MCP server exists in the repo as an artifact of
  early exploration, but the final, working integration is a plain REST
  client (`src/lib/terac/client.ts`) — MCP was not used in the shipped
  architecture.

**Other integrations**
- Mailgun (HTTP API) — weekly digest emails
- Poke — text-assistant recipe (phone-number handoff only; the
  conversational logic lives outside this repo)

## Architecture

```
Parent presses mic (/connect)
        │
        ▼
POST /api/connect/request ──► creates expert_call_requests row (pending)
        │                     creates Daily room + token (src/lib/daily)
        ▼
Vapi voice agent runs in-browser (ComfortAgentWidget.tsx)
        │  parent talks, call ends
        ▼
POST /api/vapi/webhook
        │  stores call_notes.ai_generated_summary
        │  creates + launches a Terac opportunity (src/lib/terac/client.ts)
        │  task_url → /annotate/{requestId}
        │  status: pending → launched
        ▼
Browser polls GET /api/connect/request/[id]/status every 5s
        │  checks Terac submissions; once claimed, auto-approves
        │  status: launched → scheduled (or → timed_out after 10 min)
        ▼
Annotator opens /annotate/{requestId} (public, no auth)
        │  rates clarity (1–5), optionally corrects the summary, adds notes
        ▼
POST /api/annotate/{callNotesId} ──► stores annotations row
        │
        ▼
Parent + annotator can both join the same Daily room via room_url
```

```
Eval pipeline (separate, offline, run via scripts/)
        │
build-improved-prompt.mjs ──► v2_improved prompt, from real annotations
        ▼
run-eval.mjs ──► runs 8 held-out scenarios through v1 + v2 via Claude
        ▼
collect-blind-eval.mjs ──► publishes blind A/B pairs as a second Terac
        │                   opportunity at /compare/{pairId}
        ▼
report-results.mjs ──► tallies which version annotators preferred
```

Every other feature (Roadmap, Directory, Benefits, IEP Coach, Village)
follows the same simple pattern: a Next.js page/component calls an
internal API route, which calls either Claude directly or a
Browserbase/Stagehand agent, and reads/writes Supabase.

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- A Supabase project
- API keys for: Anthropic, Browserbase, Daily.co, Vapi, Terac, Mailgun
  (Mailgun is only required for the weekly digest email feature)

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Supabase
Create a project at [supabase.com](https://supabase.com), then run every
migration in `supabase/migrations/` **in filename order** against it
(via the Supabase SQL editor, or the Supabase CLI if you have one set
up):

```
0001_init.sql
0002_features.sql
0003_browserbase.sql
0004_phone_numbers.sql
0005_benefits_state.sql
0006_saved_specialists.sql
0007_direct_messages.sql
0010_specialist_provenance.sql
0011_expert_call_requests.sql
0012_inapp_call.sql
0013_annotation_layer.sql
0014_blind_eval.sql
0015_claim_timeout.sql
```
(Note the gap between 0007 and 0010 — there is no 0008 or 0009; that's
expected, not a missing file.)

From your Supabase project's API settings, grab the project URL, anon
key, and service role key.

### 4. Get the rest of your credentials
- **Anthropic** — create an API key at
  [console.anthropic.com](https://console.anthropic.com).
- **Browserbase** — create a project and API key at
  [browserbase.com](https://browserbase.com). Used to power the live
  specialist and benefits search (billed through Browserbase, not a
  separate Anthropic key).
- **Daily.co** — create an API key at
  [dashboard.daily.co](https://dashboard.daily.co). No other dashboard
  setup needed — rooms and tokens are created per-request by the app.
- **Vapi** — create an account at [vapi.ai](https://vapi.ai) and get
  your private API key (`VAPI_API_KEY`) and public key
  (`NEXT_PUBLIC_VAPI_PUBLIC_KEY`).
- **Terac** — get your API key and project ID from your Terac hackathon
  dashboard.
- **Mailgun** — only needed if you want the weekly digest emails to
  actually send; otherwise leave the placeholder values.

### 5. Configure environment variables
Copy `.env.example` to `.env.local` and fill in every value:

```bash
cp .env.example .env.local
```

All variables Compass actually reads are documented inline in
`.env.example` (Supabase, Anthropic, Mailgun/digest, Terac, Daily.co,
Vapi, Browserbase).

### 6. One-time setup script: create the Vapi assistant
The comfort-companion assistant has to be minted once via the Vapi API
before `NEXT_PUBLIC_VAPI_ASSISTANT_ID` exists:

```bash
VAPI_API_KEY=your-key node scripts/create-vapi-assistant.mjs
```

This prints an assistant ID — paste it into `.env.local` as
`NEXT_PUBLIC_VAPI_ASSISTANT_ID`. If you need to change the assistant's
behavior later without recreating it, use
`node scripts/update-vapi-assistant.mjs` instead (it patches in place and
wires up `serverUrl` so Vapi's end-of-call webhook reaches
`/api/vapi/webhook`).

### 7. Run the app
```bash
npm run dev
```
Visit `http://localhost:3000`.

### 8. (Optional) Run the before/after eval pipeline
Requires real annotation data already in your `annotations` table (i.e.
real live-connect calls have happened and at least one annotator has
submitted a correction) and a real `ANTHROPIC_API_KEY` / Supabase
service role key in `.env.local`:

```bash
npx tsx scripts/build-improved-prompt.mjs   # writes scripts/generated/prompt-versions.json
npx tsx scripts/run-eval.mjs                # writes scripts/generated/eval-pairs.json
npx tsx scripts/collect-blind-eval.mjs       # publishes a blind Terac opportunity
npx tsx scripts/report-results.mjs           # prints the v1 vs v2 win rate
```
Each script must be run in order — each one consumes the previous
script's output file. `collect-blind-eval.mjs` spends real Terac
opportunity credits.

## Known Limitations

- **General-population annotators only.** Per the Terac challenge's
  design, there's no clinical screening on who reviews a parent's call
  summary — just an optional free-text field. This is a constraint of
  the hackathon's annotator pool, not a production safety decision; a
  real deployment would need a much more deliberate consent and
  reviewer-vetting design before showing anyone details from an
  emotionally difficult conversation.
- **The before/after eval pipeline has not been run for this
  submission.** The four scripts described above are real and
  functional, but `scripts/generated/` is empty — there is no win-rate
  number to report yet. Running it for real requires existing annotation
  data and spends Terac credits.
- **Live-connect has several points of external dependency** (Daily.co,
  Vapi, Terac, all chained together) — if any one of Daily room
  creation, the Vapi webhook delivery, or Terac's opportunity
  creation/launch fails, the request is marked `failed` and surfaced to
  the parent, but the feature is only as reliable as the slowest/least
  available of those three services on a given day.
- **Terac launches are hard-capped at $20 per opportunity** as a safety
  rail in `src/lib/terac/client.ts` — if real-world pricing ever exceeds
  that, the launch is refused rather than silently overspending, and the
  request is marked `failed`.
- **Poke's actual text-handling logic is outside this repo.** Compass
  only collects and stores the parent's phone number; the conversational
  behavior lives in Poke's hosted recipe.
- **IEP Coach and most directory/benefit lookups have no persistence
  requirement by design** — they're meant to be quick, stateless tools,
  not records systems.

## Team / Branch Structure

The Poke text-assistant feature (phone number collection in onboarding
and settings) was built independently by a teammate and merged in
alongside the Terac/live-connect work, which was developed on its own
feature branch in parallel. Both landed on `main` together; the
migration numbering reflects that interleaving (e.g. `0004_phone_numbers`
sits between earlier general-feature migrations and the later
Terac-specific ones added once the live-connect branch merged).
