import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  // TODO: migrate to zod
  const body = await request.json();
  const postId = body.post_id as string;
  const parentCommentId = (body.parent_comment_id as string | null) ?? null;
  const commentBody = (body.body ?? '').trim();

  if (!postId || !commentBody) {
    return NextResponse.json({ error: 'post_id and body are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('community_comments')
    .insert({ post_id: postId, parent_comment_id: parentCommentId, author_id: user.id, body: commentBody })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: data });
}
