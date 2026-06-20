import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  // TODO: migrate to zod
  const body = await request.json();
  const id = body.id as string;
  const action = body.action as 'done' | 'snooze';

  if (!id || (action !== 'done' && action !== 'snooze')) {
    return NextResponse.json({ error: 'id and a valid action are required.' }, { status: 400 });
  }

  const update =
    action === 'done'
      ? { status: 'done' as const, snoozed_until: null }
      : {
          status: 'snoozed' as const,
          snoozed_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

  const { data, error } = await supabase
    .from('milestone_alerts')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alert: data });
}
