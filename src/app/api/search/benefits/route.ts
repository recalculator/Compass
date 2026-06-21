import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { findBenefits } from '@/lib/browserbase/benefits';

const RequestSchema = z.object({
  zipCode: z.string().min(5).max(10),
  diagnosisTag: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'zipCode and diagnosisTag are required.' },
      { status: 400 },
    );
  }

  const { zipCode, diagnosisTag } = parsed.data;
  const supabase = createServiceRoleClient();

  try {
    const benefits = await findBenefits(supabase, zipCode, diagnosisTag);
    return NextResponse.json({ benefits });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Benefits search failed: ${message}` },
      { status: 500 },
    );
  }
}
