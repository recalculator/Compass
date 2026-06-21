import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { moderateContent } from '@/lib/claude/moderate';

const SendSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().min(1).max(2000),
});

// GET  — conversations list (distinct partners, last message)
export async function GET(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const { searchParams } = new URL(request.url);
  const withUserId = searchParams.get('userId');

  if (withUserId) {
    // Fetch full thread with one user
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*, sender:users!sender_id(id, full_name), recipient:users!recipient_id(id, full_name)')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${withUserId}),and(sender_id.eq.${withUserId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark unread messages as read
    await supabase
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('sender_id', withUserId)
      .is('read_at', null);

    return NextResponse.json({ messages: data ?? [] });
  }

  // List all messages to build conversation list client-side
  const { data, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, recipient_id, body, created_at, read_at, sender:users!sender_id(id, full_name), recipient:users!recipient_id(id, full_name)')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [], myId: user.id });
}

// POST — send a message
export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const raw = await request.json().catch(() => ({}));
  const parsed = SendSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'recipientId and body are required.' }, { status: 400 });
  }

  const { recipientId, body } = parsed.data;

  if (recipientId === user.id) {
    return NextResponse.json({ error: "You can't message yourself." }, { status: 400 });
  }

  const mod = await moderateContent(body);
  if (!mod.allowed) {
    return NextResponse.json(
      { error: mod.reason ?? 'This message cannot be sent.' },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: user.id, recipient_id: recipientId, body })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
