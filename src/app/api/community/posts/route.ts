import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import type { CommunityTopic } from '@/lib/types';

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  // TODO: migrate to zod
  const body = await request.json();
  const title = (body.title ?? '').trim();
  const postBody = (body.body ?? '').trim();
  const topic = (body.topic ?? 'general') as CommunityTopic;

  if (!title || !postBody) {
    return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('community_posts')
    .insert({ author_id: user.id, title, body: postBody, topic })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}
