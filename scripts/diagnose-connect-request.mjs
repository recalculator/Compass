// One-off diagnostic: reproduces the exact external-call chain inside
// POST /api/connect/request, with full error objects and timing per step.
// Run: npx tsx scripts/diagnose-connect-request.mjs

import { readFileSync } from 'fs';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

// Diagnostic only — creates a draft opportunity to verify the request shape
// against the real Terac API, but never launches it (launching spends real
// money). Stop/delete the draft manually from the Terac dashboard when done.
const { createCallRoom } = await import('../src/lib/daily/client.ts');
const { createOpportunity } = await import('../src/lib/terac/client.ts');
const { buildScreeningQuestions } = await import('../src/lib/terac/screening.ts');

const fakeRequestId = 'diagnostic-' + Date.now();

async function timed(label, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    console.log(`[${label}] ${Date.now() - start}ms`, JSON.stringify(result));
    return result;
  } catch (err) {
    console.error(`[${label}] THREW after ${Date.now() - start}ms`, err);
    throw err;
  }
}

const roomResult = await timed('createCallRoom', () =>
  createCallRoom({ expertCallRequestId: fakeRequestId, expiresInMinutes: 120 })
);

if (!roomResult.ok) {
  console.error('createCallRoom failed, stopping:', roomResult.error);
  process.exit(1);
}

const opportunityParams = {
  title: 'Review an AI-generated intake summary',
  internal_title: `Compass annotation task — request ${fakeRequestId}`,
  description: 'diagnostic test topic',
  project_id: process.env.TERAC_PROJECT_ID,
  num_participants: 1,
  business_type: 'b2c',
  expected_days_to_complete: 5,
  screening_questions: buildScreeningQuestions(),
  tasks: [
    {
      sequence: 1,
      task_type: 'activity',
      review_type: 'manual_review',
      task_url: `${process.env.NEXT_PUBLIC_SITE_URL}/annotate/${fakeRequestId}`,
      duration_minutes: 30,
      title: 'Review an AI-generated intake summary',
      description: 'diagnostic test topic',
    },
  ],
};

const opportunityResult = await timed('createOpportunity', () => createOpportunity(opportunityParams));

if (!opportunityResult.ok) {
  console.error('createOpportunity failed, params were:', JSON.stringify(opportunityParams, null, 2));
  process.exit(1);
}

console.log(
  'DRAFT CREATED (not launched). id:',
  opportunityResult.data.id,
  'estimated cost:',
  `$${(opportunityResult.data.pricing.total_cost_cents / 100).toFixed(2)}`
);
console.log('Remember to stop/delete this draft from the Terac dashboard if you do not intend to launch it.');
