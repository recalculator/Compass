import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

const CACHE_DAYS = 7;

// Maps human-readable specialty names → DB enum values
const SPECIALTY_MAP: Record<string, string> = {
  aba: 'aba',
  'applied behavior analysis': 'aba',
  speech: 'speech',
  'speech therapy': 'speech',
  'speech-language pathology': 'speech',
  slp: 'speech',
  ot: 'ot',
  'occupational therapy': 'ot',
  'occupational therapist': 'ot',
  feeding: 'feeding',
  'feeding therapy': 'feeding',
  'developmental pediatrician': 'developmental_pediatrician',
  'developmental pediatrics': 'developmental_pediatrician',
  pt: 'pt',
  'physical therapy': 'pt',
  'physical therapist': 'pt',
  psychology: 'psychology',
  psychologist: 'psychology',
  neurology: 'neurology',
  neurologist: 'neurology',
};

function normalizeSpecialtyType(input: string): string {
  return SPECIALTY_MAP[input.toLowerCase()] ?? 'other';
}

const SpecialistsSchema = z.object({
  specialists: z.array(
    z.object({
      name: z.string().describe('Full name of the provider or practice'),
      phone: z.string().optional().default('').describe('Phone number'),
      address: z.string().optional().default('').describe('Office address'),
    }),
  ),
});

export type SpecialistResult = {
  name: string;
  specialty: string;
  phone: string;
  address: string;
};

export async function findSpecialists(
  supabase: SupabaseClient,
  zipCode: string,
  specialtyType: string,
): Promise<SpecialistResult[]> {
  const normalizedType = normalizeSpecialtyType(specialtyType);
  const cutoff = new Date(
    Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: cached } = await supabase
    .from('specialists')
    .select('name, specialty_type, phone, address')
    .eq('zip_code', zipCode)
    .eq('specialty_type', normalizedType)
    .eq('source', 'browserbase')
    .gte('created_at', cutoff)
    .limit(5);

  if (cached && cached.length > 0) {
    console.log(`[specialists] Cache hit for ${specialtyType} / ${zipCode}`);
    return cached.map((s) => ({
      name: s.name as string,
      specialty: s.specialty_type as string,
      phone: (s.phone as string | null) ?? '',
      address: (s.address as string | null) ?? '',
    }));
  }

  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    throw new Error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID must be set');
  }

  // Stagehand v3 API mode: when env='BROWSERBASE', all act/extract/agent calls
  // are proxied through api.stagehand.browserbase.com using the BB API key.
  // The BB key IS the Model Gateway — no separate ANTHROPIC_API_KEY needed.
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey,
    projectId,
    model: 'anthropic/claude-sonnet-4-6',
    verbose: 1,
  });

  try {
    await stagehand.init();

    console.log(
      `[Stagehand] Searching Psychology Today for "${specialtyType}" near ${zipCode}`,
    );

    const agent = stagehand.agent();
    await agent.execute({
      instruction:
        `Go to https://www.psychologytoday.com/us/therapists. ` +
        `Search for ${specialtyType} providers near zip code ${zipCode}. ` +
        `Use the location filter to enter the zip code. ` +
        `Use the specialty/issue filter to narrow to ${specialtyType}. ` +
        `Scroll until at least 5 provider listings are visible.`,
      maxSteps: 15,
    });

    console.log('[Stagehand] Extracting specialist listings...');
    const data = await stagehand.extract(
      'Extract the top 5 specialist or therapist provider listings visible on the page. ' +
        'For each listing capture: full provider name, phone number, and office address.',
      SpecialistsSchema,
    );

    const results = data.specialists.slice(0, 5);

    if (results.length > 0) {
      await supabase.from('specialists').insert(
        results.map((s) => ({
          name: s.name,
          specialty_type: normalizedType,
          zip_code: zipCode,
          phone: s.phone || null,
          address: s.address || null,
          source: 'browserbase',
        })),
      );
    }

    return results.map((s) => ({
      name: s.name,
      specialty: specialtyType,
      phone: s.phone ?? '',
      address: s.address ?? '',
    }));
  } finally {
    await stagehand.close();
  }
}
