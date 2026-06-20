import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { NewPostForm } from '@/components/village/NewPostForm';
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
  searchParams: { topic?: string };
}) {
  const supabase = createClient();
  const topic = searchParams.topic as CommunityTopic | undefined;

  let query = supabase
    .from('community_posts')
    .select('*, author:users(full_name)')
    .order('created_at', { ascending: false });

  if (topic) query = query.eq('topic', topic);

  const { data: posts } = await query;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-sage-900">The Village</h1>
      <p className="mt-1 text-sm text-sage-600">
        A community of parents who get it. You&apos;re not doing this alone.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href="/village" className={!topic ? 'rounded-full bg-sage-600 px-3.5 py-1.5 text-xs font-semibold text-white' : 'rounded-full border border-sage-200 px-3.5 py-1.5 text-xs font-medium text-sage-600 hover:bg-sage-50'}>
          All
        </Link>
        {Object.entries(TOPIC_LABELS).map(([value, label]) => (
          <Link
            key={value}
            href={`/village?topic=${value}`}
            className={topic === value ? 'rounded-full bg-sage-600 px-3.5 py-1.5 text-xs font-semibold text-white' : 'rounded-full border border-sage-200 px-3.5 py-1.5 text-xs font-medium text-sage-600 hover:bg-sage-50'}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <NewPostForm />
      </div>

      <div className="mt-6 space-y-4">
        {(posts ?? []).map((post) => (
          <Link key={post.id} href={`/village/${post.id}`} className="card block transition hover:shadow-none">
            <div className="flex items-center gap-2">
              <Badge variant="sky">{TOPIC_LABELS[post.topic as CommunityTopic]}</Badge>
              <span className="text-xs text-sage-400">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            <h3 className="mt-2 font-semibold text-sage-900">{post.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-sage-600">{post.body}</p>
            <p className="mt-2 text-xs text-sage-400">
              — {(post.author as { full_name: string } | null)?.full_name ?? 'A parent'}
            </p>
          </Link>
        ))}

        {(posts ?? []).length === 0 && (
          <p className="py-10 text-center text-sm text-sage-500">
            No posts yet in this topic. Be the first to share.
          </p>
        )}
      </div>
    </div>
  );
}
