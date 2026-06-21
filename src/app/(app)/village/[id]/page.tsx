import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth/requireUser';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { CommentThread } from '@/components/village/CommentThread';
import type { CommunityTopic } from '@/lib/types';

const TOPIC_LABELS: Record<CommunityTopic, string> = {
  newly_diagnosed: 'Newly Diagnosed',
  iep_help: 'IEP Help',
  school: 'School',
  behavior: 'Behavior',
  therapies: 'Therapies',
  general: 'General',
};

const TOPIC_VARIANTS: Record<CommunityTopic, 'sage' | 'sky' | 'clay' | 'gray'> = {
  newly_diagnosed: 'clay',
  iep_help: 'sky',
  school: 'sky',
  behavior: 'clay',
  therapies: 'sage',
  general: 'gray',
};

export default async function PostPage({ params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) redirect('/login');

  const db = createServiceRoleClient();

  const { data: post } = await db
    .from('community_posts')
    .select('id, title, body, topic, created_at, author_id, author:users!author_id(id, full_name)')
    .eq('id', params.id)
    .maybeSingle();

  if (!post) notFound();

  const { data: comments } = await db
    .from('community_comments')
    .select('*, author:users!author_id(full_name)')
    .eq('post_id', params.id)
    .order('created_at', { ascending: true });

  const author = (post.author as unknown) as { id: string; full_name: string } | null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/village" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to the Village
      </Link>

      <div className="card mt-4">
        <div className="flex items-center gap-2">
          <Badge variant={TOPIC_VARIANTS[post.topic as CommunityTopic] ?? 'gray'}>
            {TOPIC_LABELS[post.topic as CommunityTopic]}
          </Badge>
          <span className="text-xs text-sage-400">{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-sage-700">{post.body}</p>
        <p className="mt-3 text-xs text-sage-400">— {author?.full_name ?? 'A parent'}</p>
      </div>

      <div className="mt-6">
        <CommentThread postId={post.id} comments={comments ?? []} />
      </div>
    </div>
  );
}
