'use client';

import { useState } from 'react';

export function AnnotationForm({ callNotesId, summary }: { callNotesId: string; summary: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [correctedSummary, setCorrectedSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!rating) {
      setError('Pick a clarity rating from 1 to 5.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/annotate/${callNotesId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clarityRating: rating,
        correctedSummary: correctedSummary.trim() || null,
        notes: notes.trim() || null,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? 'Could not submit your review.');
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="text-sm text-sage-700">
        Thank you — your review has been recorded. You&apos;re done with this task.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="label-text">AI-generated summary</p>
        <p className="mt-1 rounded-lg bg-sage-50 px-3 py-2 text-sm text-sage-700">{summary}</p>
      </div>

      <div>
        <p className="label-text">How clear and helpful was this summary?</p>
        <div className="mt-1 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={
                rating === n
                  ? 'h-9 w-9 rounded-full bg-sage-600 text-sm font-semibold text-white'
                  : 'h-9 w-9 rounded-full border border-sage-200 text-sm text-sage-700'
              }
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-sage-400">1 = very unclear, 5 = very clear</p>
      </div>

      <div>
        <label className="label-text" htmlFor="correctedSummary">
          Improve the summary (optional)
        </label>
        <textarea
          id="correctedSummary"
          className="input-field mt-1 min-h-[100px]"
          value={correctedSummary}
          onChange={(e) => setCorrectedSummary(e.target.value)}
          placeholder="Rewrite the summary if you think it could be clearer or more accurate."
        />
      </div>

      <div>
        <label className="label-text" htmlFor="notes">
          Anything else? (optional)
        </label>
        <textarea
          id="notes"
          className="input-field mt-1 min-h-[60px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>}

      <button type="button" disabled={submitting} onClick={handleSubmit} className="btn-primary">
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </div>
  );
}
