'use client';

import { useState } from 'react';

export function ComparisonForm({
  pairId,
  summaryA,
  summaryB,
}: {
  pairId: string;
  summaryA: string;
  summaryB: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitChoice(choice: 'a' | 'b' | 'tie') {
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/compare/${pairId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? 'Could not submit your choice.');
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="text-sm text-sage-700">
        Thank you — your response has been recorded. You&apos;re done with this task.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="label-text">Summary A</p>
        <p className="mt-1 rounded-lg bg-sage-50 px-3 py-2 text-sm text-sage-700">{summaryA}</p>
      </div>

      <div>
        <p className="label-text">Summary B</p>
        <p className="mt-1 rounded-lg bg-sage-50 px-3 py-2 text-sm text-sage-700">{summaryB}</p>
      </div>

      {error && <p className="rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>}

      <div className="flex gap-2">
        <button type="button" disabled={submitting} onClick={() => submitChoice('a')} className="btn-primary">
          A is clearer
        </button>
        <button type="button" disabled={submitting} onClick={() => submitChoice('b')} className="btn-primary">
          B is clearer
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => submitChoice('tie')}
          className="rounded-lg border border-sage-200 px-4 py-2 text-sm text-sage-700"
        >
          About the same
        </button>
      </div>
    </div>
  );
}
