import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateBenefits } from '@/lib/claude/benefits';
import { US_STATES } from '@/lib/us-states';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const state = body.state as string;

  if (!state || !US_STATES.includes(state as (typeof US_STATES)[number])) {
    return NextResponse.json({ error: 'Please select a valid US state.' }, { status: 400 });
  }

  try {
    const benefits = await generateBenefits({ state });
    return NextResponse.json({ benefits });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Could not generate benefits: ${message}` }, { status: 500 });
  }
}
