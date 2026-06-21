// Tallies comparison_results against comparison_pairs' hidden v1/v2 labels
// and prints how often v2_improved was preferred over v1_baseline.
// Run: npx tsx scripts/report-results.mjs

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: pairs, error: pairsError } = await supabase.from('comparison_pairs').select('*');
if (pairsError) {
  console.error('Failed to query comparison_pairs:', pairsError.message);
  process.exit(1);
}

const { data: results, error: resultsError } = await supabase.from('comparison_results').select('*');
if (resultsError) {
  console.error('Failed to query comparison_results:', resultsError.message);
  process.exit(1);
}

const pairsById = new Map(pairs.map((p) => [p.id, p]));

let v1Wins = 0;
let v2Wins = 0;
let ties = 0;
let skipped = 0;

for (const result of results) {
  const pair = pairsById.get(result.pair_id);
  if (!pair) {
    skipped += 1;
    continue;
  }
  if (result.choice === 'tie') {
    ties += 1;
    continue;
  }
  const winningLabel = result.choice === 'a' ? pair.label_a : pair.label_b;
  if (winningLabel === 'v2_improved') v2Wins += 1;
  else v1Wins += 1;
}

const decisive = v1Wins + v2Wins;

console.log(`Total comparisons: ${results.length} (${skipped} skipped — no matching pair)`);
console.log(`v2_improved preferred in ${v2Wins} of ${decisive} decisive comparisons`);
console.log(`v1_baseline preferred in ${v1Wins} of ${decisive} decisive comparisons`);
console.log(`Ties: ${ties}`);
if (decisive > 0) {
  console.log(`v2 win rate: ${Math.round((v2Wins / decisive) * 100)}%`);
}
