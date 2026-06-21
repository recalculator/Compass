// Publishes scripts/generated/eval-pairs.json as a blind v1-vs-v2 comparison
// task: writes comparison_pairs rows (with v1/v2 randomly assigned to slot
// A/B, label hidden from the public /compare page) and creates a second,
// separate Terac opportunity — one task per pair — for general-population
// annotators to pick the clearer summary.
// Run: npx tsx scripts/collect-blind-eval.mjs

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const { createOpportunity, launchOpportunity } = await import('../src/lib/terac/client.ts');
const { buildScreeningQuestions } = await import('../src/lib/terac/screening.ts');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const pairs = JSON.parse(readFileSync(new URL('./generated/eval-pairs.json', import.meta.url), 'utf8'));

const rows = pairs.map((p) => {
  const v1First = Math.random() < 0.5;
  return {
    id: p.id,
    summary_a: v1First ? p.v1_summary : p.v2_summary,
    summary_b: v1First ? p.v2_summary : p.v1_summary,
    label_a: v1First ? 'v1_baseline' : 'v2_improved',
    label_b: v1First ? 'v2_improved' : 'v1_baseline',
  };
});

const { error: insertError } = await supabase.from('comparison_pairs').upsert(rows);
if (insertError) {
  console.error('Failed to write comparison_pairs:', insertError.message);
  process.exit(1);
}
console.log(`Wrote ${rows.length} comparison_pairs rows.`);

const opportunityParams = {
  title: 'Compare two AI-generated summaries',
  internal_title: 'Compass blind v1-vs-v2 prompt comparison',
  description: 'Read two short summaries of the same parent conversation and say which is clearer.',
  project_id: process.env.TERAC_PROJECT_ID,
  num_participants: 1,
  business_type: 'b2c',
  expected_days_to_complete: 5,
  screening_questions: buildScreeningQuestions(),
  tasks: rows.map((row, i) => ({
    sequence: i + 1,
    task_type: 'activity',
    review_type: 'manual_review',
    task_url: `${process.env.NEXT_PUBLIC_SITE_URL}/compare/${row.id}`,
    duration_minutes: 10,
    title: 'Compare two AI-generated summaries',
    description: 'Read two short summaries of the same parent conversation and say which is clearer.',
  })),
};

const opportunityResult = await createOpportunity(opportunityParams);
if (!opportunityResult.ok) {
  console.error('createOpportunity failed:', opportunityResult.error);
  process.exit(1);
}
console.log('Created opportunity:', opportunityResult.data.id);

const launchResult = await launchOpportunity(opportunityResult.data);
if (!launchResult.ok) {
  console.error('launchOpportunity failed:', launchResult.error);
  console.error('The opportunity was created in draft but not launched — launch it manually from the Terac dashboard once the issue clears.');
  process.exit(1);
}

console.log('Opportunity launched. Task URLs:');
for (const row of rows) {
  console.log(`  ${process.env.NEXT_PUBLIC_SITE_URL}/compare/${row.id}`);
}
