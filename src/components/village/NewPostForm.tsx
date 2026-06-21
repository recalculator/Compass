'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CommunityTopic } from '@/lib/types';

const TOPIC_OPTIONS: { value: CommunityTopic; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'newly_diagnosed', label: 'Newly Diagnosed' },
  { value: 'iep_help', label: 'IEP Help' },
  { value: 'school', label: 'School' },
  { value: 'behavior', label: 'Behavior' },
  { value: 'therapies', label: 'Therapies' },
];

export function NewPostForm({ authorName }: { authorName?: string }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [topic, setTopic] = useState<CommunityTopic>('general');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), topic }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not post');
      setBody('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-200 text-xs font-bold text-sage-700">
          {authorName ? authorName[0].toUpperCase() : 'P'}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="What's on your mind? Share with the Village…"
          className="input-field resize-none text-sm"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value as CommunityTopic)}
          className="rounded-lg border border-sage-200 px-2 py-1 text-xs text-sage-600 focus:outline-none focus:ring-1 focus:ring-sage-400"
        >
          {TOPIC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}
