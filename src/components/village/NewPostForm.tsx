'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CommunityTopic } from '@/lib/types';

const TOPIC_OPTIONS: { value: CommunityTopic; label: string }[] = [
  { value: 'newly_diagnosed', label: 'Newly Diagnosed' },
  { value: 'iep_help', label: 'IEP Help' },
  { value: 'school', label: 'School' },
  { value: 'behavior', label: 'Behavior' },
  { value: 'therapies', label: 'Therapies' },
  { value: 'general', label: 'General' },
];

export function NewPostForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [topic, setTopic] = useState<CommunityTopic>('general');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, topic }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not create post');
      setTitle('');
      setBody('');
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-full sm:w-auto">
        Share with the Village
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="label-text" htmlFor="topic">Topic</label>
        <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value as CommunityTopic)} className="input-field">
          {TOPIC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-text" htmlFor="title">Title</label>
        <input id="title" required className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's on your mind?" />
      </div>
      <div>
        <label className="label-text" htmlFor="body">Tell us more</label>
        <textarea id="body" required rows={4} className="input-field" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your story, question, or update…" />
      </div>

      {error && <p className="rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Posting…' : 'Post'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
