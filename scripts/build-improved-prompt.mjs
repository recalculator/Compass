// Builds a v2_improved summary prompt from real human corrections in the
// `annotations` table (few-shot), falling back to written guidelines
// synthesized from common AI-summary failure patterns if no corrections
// exist yet. Writes scripts/generated/prompt-versions.json for run-eval.mjs.
// Run: npx tsx scripts/build-improved-prompt.mjs

import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const V1_BASELINE = `Summarize this intake conversation between an AI comfort companion and a parent of a child with special needs. Write 3-5 sentences a research reviewer (a general member of the public, not a clinician) can quickly read. Do not include a diagnosis or clinical recommendation.`;

const FALLBACK_GUIDELINES = `Summarize this intake conversation between an AI comfort companion and a parent of a child with special needs. Write 3-5 sentences a general-population reader (not a clinician) can quickly understand.

Follow these guidelines, based on common reviewer corrections to past summaries:
- Name the specific situation the parent described (e.g. "morning meltdowns before school," not "the parent is concerned about their child").
- Always state what the parent has already tried, even if the answer is "nothing yet" — this is the single most commonly missing detail.
- Use the parent's own words and concrete details (ages, timeframes, who else is involved) instead of vague clinical-sounding language.
- End with one clear sentence stating what the parent seems to need help with next (e.g. "a script for the IEP meeting," "next steps after diagnosis").
- Do not include a diagnosis or clinical recommendation.`;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: annotations, error } = await supabase
  .from('annotations')
  .select('corrected_summary, call_notes(ai_generated_summary)')
  .not('corrected_summary', 'is', null);

if (error) {
  console.error('Failed to query annotations:', error.message);
  process.exit(1);
}

let v2Improved;
let source;
const exampleCount = annotations?.length ?? 0;

if (exampleCount > 0) {
  const examples = annotations
    .slice(0, 5)
    .map(
      (a, i) =>
        `Example ${i + 1}:\nOriginal: ${a.call_notes.ai_generated_summary}\nReviewer-preferred: ${a.corrected_summary}`
    )
    .join('\n\n');
  v2Improved = `${V1_BASELINE}\n\nHere are examples of how human reviewers preferred past summaries to be written:\n\n${examples}`;
  source = 'annotations';
} else {
  v2Improved = FALLBACK_GUIDELINES;
  source = 'guidelines';
}

mkdirSync(new URL('../scripts/generated', import.meta.url), { recursive: true });
writeFileSync(
  new URL('../scripts/generated/prompt-versions.json', import.meta.url),
  JSON.stringify({ v1_baseline: V1_BASELINE, v2_improved: v2Improved, source, exampleCount }, null, 2)
);

console.log(`Built v2_improved from source="${source}" (${exampleCount} real correction(s) found).`);
if (source === 'guidelines') {
  console.log(
    'No annotations with corrected_summary exist yet — used synthesized guidelines instead. Rerun this script once real annotation data lands to get a genuinely data-derived v2.'
  );
}
