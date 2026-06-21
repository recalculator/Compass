import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

const CACHE_DAYS = 7;

const BenefitsSchema = z.object({
  programs: z.array(
    z.object({
      programName: z.string().describe('Name of the assistance program'),
      description: z
        .string()
        .optional()
        .default('')
        .describe('Brief description of what the program offers'),
      contactInfo: z
        .string()
        .optional()
        .default('')
        .describe('Phone, website, or address to reach the program'),
    }),
  ),
});

export type BenefitResult = {
  programName: string;
  description: string;
  contactInfo: string;
};

export async function findBenefits(
  supabase: SupabaseClient,
  zipCode: string,
  diagnosisTag: string,
): Promise<BenefitResult[]> {
  const normalizedTag = diagnosisTag.toLowerCase();
  const cutoff = new Date(
    Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: cached } = await supabase
    .from('browserbase_benefits')
    .select('program_name, description, contact_info')
    .eq('zip_code', zipCode)
    .eq('diagnosis_tag', normalizedTag)
    .gte('created_at', cutoff)
    .limit(5);

  if (cached && cached.length > 0) {
    console.log(`[benefits] Cache hit for ${diagnosisTag} / ${zipCode}`);
    return cached.map((b) => ({
      programName: b.program_name as string,
      description: (b.description as string | null) ?? '',
      contactInfo: (b.contact_info as string | null) ?? '',
    }));
  }

  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    throw new Error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID must be set');
  }

  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey,
    projectId,
    model: {
      modelName: 'anthropic/claude-sonnet-4-6',
      apiKey,
      baseURL: 'https://api.browserbase.com/v1/anthropic',
    },
    verbose: 1,
  });

  try {
    await stagehand.init();

    console.log(
      `[Stagehand] Searching findhelp.org for "${diagnosisTag}" benefits near ${zipCode}`,
    );

    const agent = stagehand.agent();
    await agent.execute({
      instruction:
        `Go to https://www.findhelp.org. ` +
        `Enter zip code ${zipCode} in the location search. ` +
        `Search for programs related to "${diagnosisTag}". ` +
        `Browse and scroll to find at least 5 assistance program listings.`,
      maxSteps: 15,
    });

    console.log('[Stagehand] Extracting benefit program listings...');
    const data = await stagehand.extract(
      'Extract the top 5 assistance or benefit program listings visible on the page. ' +
        'For each, capture: program name, description of what it provides, and contact information.',
      BenefitsSchema,
    );

    const results = data.programs.slice(0, 5);

    if (results.length > 0) {
      await supabase.from('browserbase_benefits').insert(
        results.map((b) => ({
          zip_code: zipCode,
          diagnosis_tag: normalizedTag,
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
