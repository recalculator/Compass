import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { findBenefits } from '@/lib/browserbase/benefits';

export const maxDuration = 300;

const RequestSchema = z.object({
  state: z.string().min(2).max(2),
  diagnoses: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'state (2-letter code) and diagnoses (array) are required.' },
      { status: 400 },
    );
  }

  const { state, diagnoses } = parsed.data;

  try {
    const supabase = createServiceRoleClient();
    const benefits = await findBenefits(supabase, state, diagnoses);
    return NextResponse.json({ benefits });
  } catch (err) {
    console.error('[/api/search/benefits]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Benefits search failed: ${message}` },
      { status: 500 },
    );
  }
}
