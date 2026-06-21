import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { findSpecialists } from '@/lib/browserbase/specialists';

const RequestSchema = z.object({
  zipCode: z.string().min(5).max(10),
  specialtyType: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'zipCode and specialtyType are required.' },
      { status: 400 },
    );
  }

  const { zipCode, specialtyType } = parsed.data;
  const supabase = createServiceRoleClient();

  try {
    const specialists = await findSpecialists(supabase, zipCode, specialtyType);
    return NextResponse.json({ specialists });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Specialist search failed: ${message}` },
      { status: 500 },
    );
  }
}
