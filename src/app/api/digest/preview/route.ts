import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildDigestForUser } from '@/lib/digest/build';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('id', user.id)
    .single();

  try {
    const digest = await buildDigestForUser(supabase, userRow!);
    if (!digest) {
      return NextResponse.json({ error: 'No child profile found — finish onboarding first.' }, { status: 400 });
    }

    return new NextResponse(digest.html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Could not build digest preview: ${message}` }, { status: 500 });
  }
}
