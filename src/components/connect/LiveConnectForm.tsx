'use client';

import { useEffect, useRef, useState } from 'react';
import { ComfortAgentWidget } from './ComfortAgentWidget';

type Stage = 'form' | 'waiting' | 'scheduled' | 'error';

type StatusResponse = {
  status: string;
  roomUrl: string | null;
  error?: string | null;
};

const POLL_INTERVAL_MS = 5000;

export function LiveConnectForm() {
  const [stage, setStage] = useState<Stage>('form');
  const [topic, setTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (stage !== 'waiting') return;

    const interval = setInterval(async () => {
      const id = requestIdRef.current;
      if (!id) return;

      const res = await fetch(`/api/connect/request/${id}/status`);
      if (!res.ok) return;

      const data: StatusResponse = await res.json();

      if (data.status === 'scheduled' && data.roomUrl) {
        setStage('scheduled');
      } else if (data.status === 'failed') {
        setError(data.error ?? 'Something went wrong while finding an expert.');
        setStage('error');
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [stage]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/connect/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    const data = await res.json();

    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? 'Could not start your request.');
      setStage('error');
      return;
    }

    requestIdRef.current = data.requestId;
    setRequestId(data.requestId);
    setStage('waiting');
  }

  if (stage === 'scheduled' && requestId) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-sage-900">You&apos;re connected!</h2>
        <p className="text-sm text-sage-600">A verified expert is ready for your call.</p>
        <a href={`/connect/${requestId}/call`} className="btn-primary inline-block">
          Join call
        </a>
      </div>
    );
  }

  if (stage === 'waiting') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-sage-900">Finding you an expert…</h2>
        <p className="text-sm text-sage-600">
          We&apos;re matching you with a verified healthcare provider now. This page will update
          automatically once someone is connected.
        </p>
        <ComfortAgentWidget concernSummary={topic} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label-text" htmlFor="topic">What do you need help with right now?</label>
        <textarea
          id="topic"
          className="input-field min-h-[120px]"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. My son had a meltdown at school today and I'm not sure how to talk to his teacher about it."
        />
      </div>

      {error && (
        <p className="rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>
      )}

      <button
        type="button"
        disabled={submitting || topic.trim().length === 0}
        onClick={handleSubmit}
        className="btn-primary"
      >
        {submitting ? 'Connecting…' : 'Connect me now'}
      </button>
    </div>
  );
}
