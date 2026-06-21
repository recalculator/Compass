'use client';

import Link from 'next/link';
import { MessageCircle, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { CommunityTopic } from '@/lib/types';

const TOPIC_LABELS: Record<CommunityTopic, string> = {
  newly_diagnosed: 'Newly Diagnosed',
  iep_help: 'IEP Help',
  school: 'School',
  behavior: 'Behavior',
  therapies: 'Therapies',
  general: 'General',
};

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString();
}

type Post = {
  id: string;
  body: string;
  topic: string;
  created_at: string;
  author: { id: string; full_name: string } | null;
};

export function PostCard({ post, myId }: { post: Post; myId?: string }) {
  const authorName = post.author?.full_name ?? 'A parent';
  const initials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const isOwnPost = post.author?.id === myId;

  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        {!isOwnPost && post.author ? (
          <Link
            href={`/village/messages/${post.author.id}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-200 text-xs font-bold text-sage-700 hover:bg-sage-300"
          >
            {initials}
          </Link>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-200 text-xs font-bold text-sage-700">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {!isOwnPost && post.author ? (
              <Link
                href={`/village/messages/${post.author.id}`}
                className="text-sm font-semibold text-sage-900 hover:underline"
              >
                {authorName}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-sage-900">{authorName}</span>
            )}
            <span className="text-xs text-sage-400">{relativeTime(post.created_at)}</span>
            <Badge variant="sky">{TOPIC_LABELS[post.topic as CommunityTopic] ?? post.topic}</Badge>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-sage-700 line-clamp-5">{post.body}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-sage-100 pt-2">
        <Link
          href={`/village/${post.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-500 hover:text-sage-700"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Reply
        </Link>
        {!isOwnPost && post.author && (
          <Link
            href={`/village/messages/${post.author.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-500 hover:text-sage-700"
          >
            <Mail className="h-3.5 w-3.5" />
            Message
          </Link>
        )}
      </div>
    </div>
  );
}
