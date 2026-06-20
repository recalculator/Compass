'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Check, Clock3, CalendarClock } from 'lucide-react';
import type { MilestoneAlert } from '@/lib/types';

export function ComingUp({ alerts }: { alerts: MilestoneAlert[] }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/milestones/generate', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not generate alerts');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  async function updateAlert(id: string, action: 'done' | 'snooze') {
    setUpdatingId(id);
    try {
      await fetch('/api/milestones/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      router.refresh();
    } finally {
      setUpdatingId(null);
    }
  }

  const sorted = [...alerts].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-sage-900">Coming up</h3>
        <button onClick={generate} disabled={generating} className="btn-secondary text-xs">
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {alerts.length > 0 ? 'Refresh' : 'Check for alerts'}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>
      )}

      {sorted.length === 0 && !error ? (
        <p className="mt-3 text-sm text-sage-500">
          Compass can scan your roadmap for upcoming IEP deadlines, evaluation windows,
          and age-based transitions. Click &ldquo;Check for alerts&rdquo; to see what&apos;s
          coming up.
        </p>
      ) : (
        <ol className="relative mt-4 space-y-5 border-l-2 border-sage-100 pl-6">
          {sorted.map((alert) => (
            <li key={alert.id} className="relative">
              <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-sage-100">
                <CalendarClock className="h-3.5 w-3.5 text-sage-600" />
              </span>

              {alert.due_date && (
                <span className="text-xs text-sage-400">
                  {new Date(alert.due_date).toLocaleDateString()}
                </span>
              )}
              <p className="mt-0.5 text-sm font-medium text-sage-900">{alert.alert_text}</p>

              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => updateAlert(alert.id, 'done')}
                  disabled={updatingId === alert.id}
                  className="inline-flex items-center gap-1 text-xs font-medium text-sage-600 hover:underline"
                >
                  <Check className="h-3.5 w-3.5" />
                  Mark done
                </button>
                <button
                  onClick={() => updateAlert(alert.id, 'snooze')}
                  disabled={updatingId === alert.id}
                  className="inline-flex items-center gap-1 text-xs font-medium text-sage-500 hover:underline"
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  Snooze 30 days
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
