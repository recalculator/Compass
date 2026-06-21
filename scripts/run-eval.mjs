// Runs the fixed held-out test scenarios through both prompt versions
// (v1_baseline, v2_improved) via Claude, producing paired summaries for
// blind human comparison. Run: npx tsx scripts/run-eval.mjs
//
// Requires scripts/generated/prompt-versions.json (run build-improved-prompt.mjs first)
// and a real ANTHROPIC_API_KEY in .env.local.

import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const scenarios = JSON.parse(readFileSync(new URL('./test-scenarios.json', import.meta.url), 'utf8'));
const prompts = JSON.parse(readFileSync(new URL('./generated/prompt-versions.json', import.meta.url), 'utf8'));

async function summarize(systemPrompt, transcript) {
  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: 'user', content: transcript }],
  });
  return res.content.find((b) => b.type === 'text')?.text.trim() ?? '';
}

const pairs = [];
for (const scenario of scenarios) {
  console.log(`Summarizing scenario: ${scenario.id}`);
  const [v1Summary, v2Summary] = await Promise.all([
    summarize(prompts.v1_baseline, scenario.transcript),
    summarize(prompts.v2_improved, scenario.transcript),
  ]);
  pairs.push({ id: scenario.id, transcript: scenario.transcript, v1_summary: v1Summary, v2_summary: v2Summary });
}

mkdirSync(new URL('./generated', import.meta.url), { recursive: true });
writeFileSync(new URL('./generated/eval-pairs.json', import.meta.url), JSON.stringify(pairs, null, 2));

console.log(`\nWrote ${pairs.length} pairs to scripts/generated/eval-pairs.json\n`);
for (const p of pairs) {
  console.log(`--- ${p.id} ---`);
  console.log(`v1: ${p.v1_summary}`);
  console.log(`v2: ${p.v2_summary}\n`);
}
