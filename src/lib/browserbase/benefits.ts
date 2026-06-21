import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { withRetry } from './retry';

const CACHE_DAYS = 7;

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'Washington DC',
};

const BenefitsSchema = z.object({
  programs: z.array(
    z.object({
      programName: z.string().describe('Specific, real name of the assistance program (not a generic category)'),
      description: z.string().optional().default('').describe('What the program actually pays for or provides — concrete services/dollar amounts, not a generic disability blurb'),
      eligibility: z.string().optional().default('').describe('Who specifically qualifies: diagnosis, age range, income/residency requirements'),
      contactInfo: z.string().optional().default('').describe('Phone, website, or address'),
    }),
  ),
});

export type BenefitResult = {
  programName: string;
  description: string;
  contactInfo: string;
};

function normalizeDiagnosisTag(diagnoses: string[], childAge?: number, currentServices?: string[]): string {
  const ageBucket = childAge === undefined ? '' : childAge < 3 ? 'under3' : childAge < 18 ? 'minor' : 'adult';
  return [
    diagnoses.map((d) => d.toLowerCase().replace(/[^a-z0-9]+/g, '_')).sort().join('|'),
    ageBucket,
    (currentServices ?? []).map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_')).sort().join('|'),
  ].join('::');
}

export async function findBenefits(
  supabase: SupabaseClient,
  state: string,
  diagnoses: string[],
  options: { zipCode?: string; childAge?: number; currentServices?: string[] } = {},
): Promise<BenefitResult[]> {
  const { zipCode, childAge, currentServices } = options;
  const stateCode = state.toUpperCase();
  const diagnosisTag = normalizeDiagnosisTag(diagnoses, childAge, currentServices);
  const cutoff = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: cached } = await supabase
    .from('browserbase_benefits')
    .select('program_name, description, contact_info')
    .eq('state_code', stateCode)
    .eq('diagnosis_tag', diagnosisTag)
    .gte('created_at', cutoff)
    .limit(8);

  if (cached && cached.length > 0) {
    console.log(`[benefits] Cache hit for ${stateCode} / ${diagnosisTag}`);
    return cached.map((b) => ({
      programName: b.program_name as string,
      description: (b.description as string | null) ?? '',
      contactInfo: (b.contact_info as string | null) ?? '',
    }));
  }

  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  if (!apiKey || !projectId) throw new Error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID must be set');

  const stateName = STATE_NAMES[stateCode] ?? state;
  const diagnosisLabel = diagnoses.join(', ');
  const ageContext =
    childAge === undefined
      ? ''
      : childAge < 3
        ? ` who is ${childAge} years old (eligible for Early Intervention / Part C services, not just school-age special education)`
        : childAge < 18
          ? ` who is ${childAge} years old`
          : ` who is ${childAge} years old (adult/transition-age services, not pediatric-only programs)`;
  const servicesContext = currentServices?.length
    ? ` The child is already receiving: ${currentServices.join(', ')} — skip generic listings for services they already have and prioritize funding/gap programs instead.`
    : '';

  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey,
    projectId,
    model: 'anthropic/claude-sonnet-4-6',
    verbose: 1,
    // pino-pretty's worker-thread transport doesn't survive Vercel's
    // serverless bundling ("unable to determine transport target") — use
    // plain logging instead.
    disablePino: true,
  });

  try {
    await stagehand.init();

    console.log(`[Stagehand] Searching for "${diagnosisLabel}" benefits in ${stateName}`);

    const locationInput = zipCode ?? stateName;

    const agent = stagehand.agent();
    await withRetry(
      () =>
        agent.execute({
          instruction:
            `Go to https://www.findhelp.org. ` +
            `Type "${diagnosisLabel}" into the main search/needs box, and type "${locationInput}" into the location field ` +
            `(if "${locationInput}" isn't accepted, try "${stateName}" instead, or just the zip/city alone). ` +
            `Submit the search (click the search/"Find Programs" button, or press Enter). ` +
            `Wait for the results page to actually load with individual program listing cards — do not stop on the homepage ` +
            `or an empty results page. If no results appear, try removing words from the search term and search again. ` +
            `Once real program listings are visible, scroll to load at least 8 of them. ` +
            `Favor listings about disability support, Medicaid waivers, developmental disability services, ` +
            `early intervention, SSI, or therapeutic/financial assistance for families${ageContext} over plain food or housing aid.${servicesContext}`,
          maxSteps: 14,
        }),
      { label: 'benefits agent.execute' },
    );

    console.log('[Stagehand] Extracting benefit program listings...');
    const data = await withRetry(
      () =>
        stagehand.extract(
          `Extract the assistance/benefit program listings visible on the page, up to 8 of them. ` +
            `Only extract real, individual program listings (each with its own name and details) — ` +
            `if the page is just a search form, homepage, or empty results page with no individual program cards, ` +
            `return an empty "programs" array. Do not invent a placeholder entry describing the lack of results. ` +
            `For each real listing, capture: ` +
            `(1) the program's name; ` +
            `(2) a description of what it provides — be as concrete as the listing allows (specific services, dollar amounts, or hours), ` +
            `mentioning ${diagnosisLabel}${ageContext} where the listing supports it, but don't invent specifics the listing doesn't state; ` +
            `(3) eligibility — age range, income, or residency requirements mentioned in the listing, if any; ` +
            `(4) contact information (phone, website, or address).`,
          BenefitsSchema,
        ),
      { label: 'benefits extract' },
    );

    const results = data.programs
      .filter((b) => b.programName && !/no .*(program|result|listing)/i.test(b.programName))
      .slice(0, 8)
      .map((b) => ({
        programName: b.programName,
        description: [b.description, b.eligibility ? `Eligibility: ${b.eligibility}` : '']
          .filter(Boolean)
          .join(' '),
        contactInfo: b.contactInfo ?? '',
      }));

    if (results.length === 0) {
      throw new Error(
        `Couldn't find specific program listings for ${stateName} right now — please try again.`,
      );
    }

    await supabase.from('browserbase_benefits').insert(
      results.map((b) => ({
        state_code: stateCode,
        diagnosis_tag: diagnosisTag,
        program_name: b.programName,
        description: b.description || null,
        contact_info: b.contactInfo || null,
        source: 'browserbase',
      })),
    );

    return results;
  } finally {
    await stagehand.close();
  }
}
