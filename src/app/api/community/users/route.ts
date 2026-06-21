import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { createServiceRoleClient } from '@/lib/supabase/server';

// GET ?q=<query> — search registered users by name to start a DM with.
// Uses the service-role client since the `users` table's RLS only allows
// reading your own row; this route is the one place a logged-in user is
// allowed to look up other users by name.
export async function GET(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();

  const db = createServiceRoleClient();
  let query = db.from('users').select('id, full_name').neq('id', user.id).limit(10);
  if (q) query = query.ilike('full_name', `%${q}%`);
  query = query.order('full_name', { ascending: true });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}
