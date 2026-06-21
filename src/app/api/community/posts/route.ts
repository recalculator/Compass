import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { moderateContent } from '@/lib/claude/moderate';
import type { CommunityTopic } from '@/lib/types';

const Schema = z.object({
  body: z.string().min(1).max(2000),
  topic: z.enum(['newly_diagnosed', 'iep_help', 'school', 'behavior', 'therapies', 'general']).default('general'),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const raw = await request.json().catch(() => ({}));
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Body is required.' }, { status: 400 });
  }

  const { body, topic } = parsed.data;

  const mod = await moderateContent(body);
  if (!mod.allowed) {
    return NextResponse.json(
      { error: mod.reason ?? 'This message cannot be posted in the Village.' },
      { status: 422 },
    );
  }

  const title = body.length > 80 ? body.slice(0, 80) + '…' : body;

  const { data, error } = await supabase
    .from('community_posts')
    .insert({ author_id: user.id, title, body, topic: topic as CommunityTopic })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
