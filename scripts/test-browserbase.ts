/**
 * End-to-end test for the Browserbase specialist + benefits search.
 *
 * Prerequisites:
 *   1. Set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID in .env.local
 *   2. Run `npm run dev` in a separate terminal (needed for the API routes)
 *
 * Run:
 *   npx tsx scripts/test-browserbase.ts
 *
 * Note on dry-run / preview:
 *   Stagehand v3 does not have a built-in dry-run mode. What you will see in
 *   your terminal is a verbose log of each browser action the agent takes
 *   (thanks to verbose: 1 in the Stagehand config). You can watch it live in
 *   the Browserbase dashboard at https://browserbase.com — your project's
 *   Sessions tab shows a live screen recording of every step.
 *
 *   To stop before writing to the database, comment out the Supabase insert
 *   lines in src/lib/browserbase/specialists.ts and src/lib/browserbase/benefits.ts.
 */

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

async function testSpecialists() {
  console.log('\n=== findSpecialists("94720", "Occupational Therapy") ===');
  const res = await fetch(`${BASE}/api/search/specialists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zipCode: '94720', specialtyType: 'Occupational Therapy' }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Error:', data.error);
    return;
  }
  console.log(JSON.stringify(data.specialists, null, 2));
  console.log(`Found ${data.specialists?.length ?? 0} specialists.`);
}

async function testBenefits() {
  console.log('\n=== findBenefits("94720", "autism") ===');
  const res = await fetch(`${BASE}/api/search/benefits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zipCode: '94720', diagnosisTag: 'autism' }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Error:', data.error);
    return;
  }
  console.log(JSON.stringify(data.benefits, null, 2));
  console.log(`Found ${data.benefits?.length ?? 0} programs.`);
}

async function main() {
  console.log(`Hitting ${BASE} — make sure "npm run dev" is running.\n`);
  await testSpecialists();
  await testBenefits();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
