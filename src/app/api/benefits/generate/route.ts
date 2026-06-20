import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { generateBenefits } from '@/lib/claude/benefits';
import { US_STATES } from '@/lib/us-states';

const generateSchema = z.object({
  state: z.enum(US_STATES, { message: 'Please select a valid US state.' }),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Please select a valid US state.' }, { status: 400 });
  }

  const { state } = parsed.data;

  try {
    const benefits = await generateBenefits({ state });
    return NextResponse.json({ benefits });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Could not generate benefits: ${message}` }, { status: 500 });
  }
}
