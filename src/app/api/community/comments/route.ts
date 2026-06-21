import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { moderateContent } from '@/lib/claude/moderate';

const Schema = z.object({
  post_id: z.string().uuid(),
  parent_comment_id: z.string().uuid().nullable().default(null),
  body: z.string().min(1).max(1000),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const raw = await request.json().catch(() => ({}));
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'post_id and body are required.' }, { status: 400 });
  }

  const { post_id, parent_comment_id, body } = parsed.data;

  const mod = await moderateContent(body);
  if (!mod.allowed) {
    return NextResponse.json(
      { error: mod.reason ?? 'This reply cannot be posted in the Village.' },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from('community_comments')
    .insert({ post_id, parent_comment_id, author_id: user.id, body })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}
