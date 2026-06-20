import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { buildDigestForUser } from '@/lib/digest/build';

export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

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
