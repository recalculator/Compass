import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { findSpecialists } from '@/lib/browserbase/specialists';

// Keep the connection alive long enough for a full Browserbase session
export const maxDuration = 300;

const RequestSchema = z.object({
  zipCode: z.string().min(5).max(10),
  specialtyType: z.string().default(''),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'zipCode is required.' },
      { status: 400 },
    );
  }

  const { zipCode, specialtyType } = parsed.data;

  try {
    const supabase = createServiceRoleClient();
    const specialists = await findSpecialists(supabase, zipCode, specialtyType);
    return NextResponse.json({ specialists });
  } catch (err) {
    console.error('[/api/search/specialists]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Specialist search failed: ${message}` },
      { status: 500 },
    );
  }
}
