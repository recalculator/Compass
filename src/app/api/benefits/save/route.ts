import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import type { BenefitProgram } from '@/lib/types';

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  // TODO: migrate to zod
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
