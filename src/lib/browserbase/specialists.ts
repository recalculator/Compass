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
  'developmental_pediatrician': 'developmental_pediatrician',
  pt: 'pt',
  'physical therapy': 'pt',
  'physical therapist': 'pt',
  psychology: 'psychology',
  psychologist: 'psychology',
  neurology: 'neurology',
  neurologist: 'neurology',
};

function normalizeSpecialtyType(input: string): string {
  if (!input || input === 'all') return 'all';
  return SPECIALTY_MAP[input.toLowerCase()] ?? 'other';
}

const SpecialistsSchema = z.object({
  specialists: z.array(
    z.object({
      name: z.string().describe('Full name of the provider or practice'),
      phone: z.string().optional().default('').describe('Phone number'),
      address: z.string().optional().default('').describe('Office address'),
      description: z.string().optional().default('').describe('Brief bio or specialty description from the listing'),
      profileUrl: z.string().optional().default('').describe('Full URL to their Psychology Today profile page, e.g. https://www.psychologytoday.com/us/therapists/...'),
    }),
  ),
});

export type SpecialistResult = {
  name: string;
  specialty: string;
  phone: string;
  address: string;
  description: string;
  profileUrl: string;
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

  const isAll = normalizedType === 'all';
  const limit = isAll ? 10 : 5;

  let cacheQuery = supabase
    .from('specialists')
    .select('name, specialty_type, phone, address, notes, website')
    .eq('zip_code', zipCode)
    .eq('source', 'browserbase')
    .gte('created_at', cutoff)
    .limit(limit);

  if (!isAll) cacheQuery = cacheQuery.eq('specialty_type', normalizedType);

  const { data: cached } = await cacheQuery;

  if (cached && cached.length > 0) {
    console.log(`[specialists] Cache hit for ${specialtyType || 'all'} / ${zipCode}`);
    return cached.map((s) => ({
      name: s.name as string,
      specialty: s.specialty_type as string,
      phone: (s.phone as string | null) ?? '',
      address: (s.address as string | null) ?? '',
      description: (s.notes as string | null) ?? '',
      profileUrl: (s.website as string | null) ?? '',
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
    // pino-pretty's worker-thread transport doesn't survive Vercel's
    // serverless bundling ("unable to determine transport target") — use
    // plain logging instead.
    disablePino: true,
  });

  try {
    await stagehand.init();

    console.log(
      `[Stagehand] Searching Psychology Today for "${specialtyType}" near ${zipCode}`,
    );

    const agent = stagehand.agent();
    await agent.execute({
      instruction: isAll
        ? `Go to https://www.psychologytoday.com/us/therapists. ` +
          `Enter zip code ${zipCode} in the location/near field. ` +
          `Do not apply any specialty filter — search broadly. ` +
          `Scroll down until at least 10 provider listings are visible on the page.`
        : `Go to https://www.psychologytoday.com/us/therapists. ` +
          `Search for ${specialtyType} providers near zip code ${zipCode}. ` +
          `Use the location filter to enter the zip code. ` +
          `Use the specialty/issue filter to narrow to ${specialtyType}. ` +
          `Scroll until at least 5 provider listings are visible.`,
      maxSteps: isAll ? 10 : 8,
    });

    console.log('[Stagehand] Extracting specialist listings...');
    const extractCount = isAll ? 10 : 5;
    const data = await stagehand.extract(
      `Extract the top ${extractCount} specialist or therapist provider listings visible on the page. ` +
        'For each listing capture: full provider name, phone number, office address, a brief description or bio excerpt, and the full URL to their profile page.',
      SpecialistsSchema,
    );

    const results = data.specialists.slice(0, extractCount);

    if (results.length > 0) {
      await supabase.from('specialists').insert(
        results.map((s) => ({
          name: s.name,
          specialty_type: normalizedType,
          zip_code: zipCode,
          phone: s.phone || null,
          address: s.address || null,
          notes: s.description || null,
          website: s.profileUrl || null,
          source: 'browserbase',
        })),
      );
    }

    return results.map((s) => ({
      name: s.name,
      specialty: normalizedType,
      phone: s.phone ?? '',
      address: s.address ?? '',
      description: s.description ?? '',
      profileUrl: s.profileUrl ?? '',
    }));
  } finally {
    await stagehand.close();
  }
}
