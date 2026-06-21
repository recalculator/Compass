import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';

const choiceSchema = z.object({
  choice: z.enum(['a', 'b', 'tie']),
});

export async function POST(request: Request, { params }: { params: { pairId: string } }) {
  const body = await request.json();
  const parsed = choiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: pair } = await supabase
    .from('comparison_pairs')
    .select('id')
    .eq('id', params.pairId)
    .maybeSingle();

  if (!pair) {
    return NextResponse.json({ error: 'Comparison pair not found.' }, { status: 404 });
  }

  const { error } = await supabase.from('comparison_results').insert({
    pair_id: pair.id,
    choice: parsed.data.choice,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
