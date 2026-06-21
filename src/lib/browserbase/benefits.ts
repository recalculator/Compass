import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

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
      programName: z.string().describe('Name of the assistance program'),
      description: z.string().optional().default('').describe('What the program provides'),
      contactInfo: z.string().optional().default('').describe('Phone, website, or address'),
    }),
  ),
});

export type BenefitResult = {
  programName: string;
  description: string;
  contactInfo: string;
};

function normalizeDiagnosisTag(diagnoses: string[]): string {
  return diagnoses
    .map((d) => d.toLowerCase().replace(/[^a-z0-9]+/g, '_'))
    .sort()
    .join('|');
}

export async function findBenefits(
  supabase: SupabaseClient,
  state: string,
  diagnoses: string[],
): Promise<BenefitResult[]> {
  const stateCode = state.toUpperCase();
  const diagnosisTag = normalizeDiagnosisTag(diagnoses);
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

  const stagehand = new Stagehand({ env: 'BROWSERBASE', apiKey, projectId, model: 'anthropic/claude-sonnet-4-6', verbose: 1 });

  try {
    await stagehand.init();

    console.log(`[Stagehand] Searching for "${diagnosisLabel}" benefits in ${stateName}`);

    const agent = stagehand.agent();
    await agent.execute({
      instruction:
        `Go to https://www.findhelp.org. ` +
        `Search for assistance programs in ${stateName}. ` +
        `Use the location field to enter "${stateName}" as the location. ` +
        `Then search for programs related to: ${diagnosisLabel}. ` +
        `Look for disability support programs, Medicaid waivers, state developmental disability services, ` +
        `early intervention programs, SSI, and any financial or therapeutic assistance for families. ` +
        `Scroll to find at least 8 program listings.`,
      maxSteps: 10,
    });

    console.log('[Stagehand] Extracting benefit program listings...');
    const data = await stagehand.extract(
      'Extract the top 8 assistance or benefit program listings visible on the page. ' +
        'For each, capture: program name, description of what it provides, and contact information (phone, website, or address).',
      BenefitsSchema,
    );

    const results = data.programs.slice(0, 8);

    if (results.length > 0) {
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
    }

    return results.map((b) => ({
      programName: b.programName,
      description: b.description ?? '',
      contactInfo: b.contactInfo ?? '',
    }));
  } finally {
    await stagehand.close();
  }
}
