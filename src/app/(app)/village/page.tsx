import Link from 'next/link';
import { requireUser } from '@/lib/auth/requireUser';
import { redirect } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NewPostForm } from '@/components/village/NewPostForm';
import { PostCard } from '@/components/village/PostCard';
import { MessagesList } from '@/components/village/MessagesList';
import type { CommunityTopic } from '@/lib/types';

const TOPIC_LABELS: Record<CommunityTopic, string> = {
  newly_diagnosed: 'Newly Diagnosed',
  iep_help: 'IEP Help',
  school: 'School',
  behavior: 'Behavior',
  therapies: 'Therapies',
  general: 'General',
};

export default async function VillagePage({
  searchParams,
}: {
  searchParams: { topic?: string; tab?: string };
}) {
  const auth = await requireUser();
  if ('error' in auth) redirect('/login');
  const { user } = auth;

  const db = createServiceRoleClient();

  const { data: profile } = await db
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const tab = searchParams.tab === 'messages' ? 'messages' : 'feed';
  const topic = searchParams.topic as CommunityTopic | undefined;

  let posts: {
    id: string;
    body: string;
    topic: string;
    created_at: string;
    author: { id: string; full_name: string } | null;
  }[] = [];

  if (tab === 'feed') {
    let query = db
      .from('community_posts')
      .select('id, body, topic, created_at, author:users!author_id(id, full_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (topic) query = query.eq('topic', topic);

    const { data } = await query;
    posts = (data ?? []) as unknown as typeof posts;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-sage-900">The Village</h1>
        <p className="mt-1 text-sm text-sage-600">
          A community for parents who get it. You&apos;re not doing this alone.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-sage-50 p-1">
        <Link
          href="/village"
          className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition ${
            tab === 'feed'
              ? 'bg-white text-sage-900 shadow-sm'
              : 'text-sage-600 hover:text-sage-800'
          }`}
        >
          Feed
        </Link>
        <Link
          href="/village?tab=messages"
          className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition ${
            tab === 'messages'
              ? 'bg-white text-sage-900 shadow-sm'
              : 'text-sage-600 hover:text-sage-800'
          }`}
        >
          Messages
        </Link>
      </div>

      {tab === 'feed' && (
        <>
          {/* Topic filters */}
          <div className="mb-5 flex flex-wrap gap-2">
            <Link
              href="/village"
              className={
                !topic
                  ? 'rounded-full bg-sage-600 px-3.5 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-full border border-sage-200 px-3.5 py-1.5 text-xs font-medium text-sage-600 hover:bg-sage-50'
              }
            >
              All
            </Link>
            {Object.entries(TOPIC_LABELS).map(([value, label]) => (
              <Link
                key={value}
                href={`/village?topic=${value}`}
                className={
                  topic === value
                    ? 'rounded-full bg-sage-600 px-3.5 py-1.5 text-xs font-semibold text-white'
                    : 'rounded-full border border-sage-200 px-3.5 py-1.5 text-xs font-medium text-sage-600 hover:bg-sage-50'
                }
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Compose */}
          <div className="mb-6">
            <NewPostForm authorName={profile?.full_name ?? undefined} />
          </div>

          {/* Posts feed */}
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} myId={user.id} />
            ))}
            {posts.length === 0 && (
              <p className="py-10 text-center text-sm text-sage-500">
                No posts yet{topic ? ' in this topic' : ''}. Be the first to share.
              </p>
            )}
          </div>
        </>
      )}

      {tab === 'messages' && <MessagesList />}
    </div>
  );
}
