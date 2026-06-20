import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BenefitProgram } from '@/lib/types';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const state = body.state as string;
  const benefit = body.benefit as BenefitProgram;

  if (!state || !benefit?.program_name || !benefit?.category) {
    return NextResponse.json({ error: 'state and benefit are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('saved_benefits')
    .insert({
      user_id: user.id,
      program_name: benefit.program_name,
      state,
      category: benefit.category,
      details: benefit,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ savedBenefit: data });
}
