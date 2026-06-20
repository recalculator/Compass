'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import type { RoadmapItem } from '@/lib/types';

export function NextSteps({ items }: { items: RoadmapItem[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/roadmap/next-steps', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not generate next steps');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-sage-900">What comes next</h3>
        <button onClick={generate} disabled={loading} className="btn-secondary text-xs">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {items.length > 0 ? 'Refresh' : 'Generate'}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>
      )}

      {items.length === 0 && !error ? (
        <p className="mt-3 text-sm text-sage-500">
          Compass can suggest proactive next steps based on your child&apos;s age,
          diagnosis, and services. Click generate to get started.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl2 border border-sage-200 bg-sage-50 p-3">
              <p className="text-sm font-semibold text-sage-900">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-sm text-sage-600">{item.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
