import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
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

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: post } = await supabase
    .from('community_posts')
    .select('*, author:users(full_name)')
    .eq('id', params.id)
    .maybeSingle();

  if (!post) notFound();

  const { data: comments } = await supabase
    .from('community_comments')
    .select('*, author:users(full_name)')
    .eq('post_id', params.id)
    .order('created_at', { ascending: true });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/village" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to the Village
      </Link>

      <div className="card mt-4">
        <div className="flex items-center gap-2">
          <Badge variant="sky">{TOPIC_LABELS[post.topic as CommunityTopic]}</Badge>
          <span className="text-xs text-sage-400">{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <h1 className="mt-2 text-xl font-bold text-sage-900">{post.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm text-sage-700">{post.body}</p>
        <p className="mt-3 text-xs text-sage-400">
          — {(post.author as { full_name: string } | null)?.full_name ?? 'A parent'}
        </p>
      </div>

      <div className="mt-6">
        <CommentThread postId={post.id} comments={comments ?? []} />
      </div>
    </div>
  );
}
