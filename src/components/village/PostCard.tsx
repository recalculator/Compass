'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
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

const TOPIC_VARIANTS: Record<CommunityTopic, 'sage' | 'sky' | 'clay' | 'gray'> = {
  newly_diagnosed: 'clay',
  iep_help: 'sky',
  school: 'sky',
  behavior: 'clay',
  therapies: 'sage',
  general: 'gray',
};

const AVATAR_TINTS = [
  'bg-sage-200 text-sage-700',
  'bg-sky-200 text-sky-700',
  'bg-clay-200 text-clay-500',
];

function avatarTint(name: string) {
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

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

export function PostCard({ post }: { post: Post; myId?: string }) {
  const authorName = post.author?.full_name ?? 'A parent';
  const initials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const topicVariant = TOPIC_VARIANTS[post.topic as CommunityTopic] ?? 'gray';

  return (
    <div className="card space-y-3 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarTint(authorName)}`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-sage-900">{authorName}</span>
            <span className="text-xs text-sage-400">{relativeTime(post.created_at)}</span>
            <Badge variant={topicVariant}>{TOPIC_LABELS[post.topic as CommunityTopic] ?? post.topic}</Badge>
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
      </div>
    </div>
  );
}
