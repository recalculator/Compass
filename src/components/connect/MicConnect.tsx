'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { ComfortAgentWidget } from './ComfortAgentWidget';

type Stage = 'idle' | 'connecting' | 'oncall' | 'pending' | 'launched' | 'scheduled' | 'timed_out' | 'error';

type StatusResponse = {
  status: string;
  roomUrl: string | null;
  error?: string | null;
};

const POLL_INTERVAL_MS = 5000;

export function MicConnect() {
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (stage !== 'pending' && stage !== 'launched') return;

    const interval = setInterval(async () => {
      const id = requestIdRef.current;
      if (!id) return;

      const res = await fetch(`/api/connect/request/${id}/status`);
      if (!res.ok) return;

      const data: StatusResponse = await res.json();

      if (data.status === 'scheduled' && data.roomUrl) {
        setStage('scheduled');
      } else if (data.status === 'timed_out') {
        setStage('timed_out');
      } else if (data.status === 'failed') {
        setError(data.error ?? 'Something went wrong while finding someone.');
        setStage('error');
      } else if (data.status === 'launched') {
        setStage('launched');
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [stage]);

  async function startCall() {
    setStage('connecting');
    setError(null);

    const res = await fetch('/api/connect/request', { method: 'POST' });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Could not start your request.');
      setStage('error');
      return;
    }

    requestIdRef.current = data.requestId;
    setRequestId(data.requestId);
    setStage('oncall');
  }

  function handleCallEnd() {
    setStage('pending');
  }

  if (stage === 'idle' || stage === 'connecting') {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          {stage === 'connecting' && (
            <span className="absolute inset-0 animate-ping rounded-full bg-sage-400 opacity-40" />
          )}
          <button
            type="button"
            onClick={startCall}
            disabled={stage === 'connecting'}
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sage-600 to-sky-700 text-white shadow-lg transition hover:scale-105 hover:shadow-xl disabled:opacity-60"
            aria-label="Press to talk"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
              <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.08A7 7 0 0 0 19 11Z" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-sage-600">
          {stage === 'connecting' ? 'Connecting…' : 'Press to talk — no forms, just tell us what’s going on.'}
        </p>
        {error && <p className="rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>}
      </div>
    );
  }

  if (stage === 'oncall' && requestId) {
    return (
      <div className="space-y-3">
        <ComfortAgentWidget expertCallRequestId={requestId} onCallEnd={handleCallEnd} />
        <p className="text-center text-sm text-sage-600">
          Your call room is ready already, if you&apos;d rather wait there instead:{' '}
          <a href={`/connect/${requestId}/call`} className="font-medium text-sage-700 underline">
            Join the call room
          </a>
        </p>
      </div>
    );
  }

  if (stage === 'pending') {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-sage-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-sage-900">Thank you for sharing that</h2>
        <p className="text-sm text-sage-600">
          We&apos;re finishing up notes from your conversation and getting them ready for a reviewer.
          This usually takes under a minute.
        </p>
        {requestId && (
          <p className="text-sm text-sage-600">
            You can also hop into the call room now and wait there — we&apos;ll bring a reviewer in
            as soon as one&apos;s ready.{' '}
            <a href={`/connect/${requestId}/call`} className="font-medium text-sage-700 underline">
              Join the call room
            </a>
          </p>
        )}
      </div>
    );
  }

  if (stage === 'launched') {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-sage-900">Finding someone to look at this…</h2>
        <p className="text-sm text-sage-600">
          We&apos;re still here with you. This page will update automatically once someone has reviewed
          your conversation.
        </p>
        {requestId && (
          <p className="text-sm text-sage-600">
            You can hop into the call room now and wait there — we&apos;ll bring a reviewer in as
            soon as one&apos;s ready.{' '}
            <a href={`/connect/${requestId}/call`} className="font-medium text-sage-700 underline">
              Join the call room
            </a>
          </p>
        )}
      </div>
    );
  }

  if (stage === 'timed_out') {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-clay-100 text-clay-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-sage-900">We&apos;re having trouble finding someone right now</h2>
        <p className="text-sm text-sage-600">
          That&apos;s on us, not you — sometimes no one&apos;s available right away. You can keep
          waiting, or browse our specialist directory in the meantime.
        </p>
        <div className="flex justify-center gap-3">
          <button type="button" onClick={() => setStage('launched')} className="btn-primary">
            Keep waiting
          </button>
          <a href="/directory" className="rounded-lg border border-sage-200 px-4 py-2 text-sm text-sage-700">
            Browse directory
          </a>
        </div>
        {requestId && (
          <p className="text-sm text-sage-600">
            You can also{' '}
            <a href={`/connect/${requestId}/call`} className="font-medium text-sage-700 underline">
              wait in the call room
            </a>{' '}
            in case someone joins.
          </p>
        )}
      </div>
    );
  }

  if (stage === 'scheduled' && requestId) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-sage-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-sage-900">Thank you</h2>
        <p className="text-sm text-sage-600">
          Someone from our research review pool has read through your conversation. They&apos;re a
          Compass volunteer reviewer, not a verified clinician — for live help from a verified
          specialist, browse our directory instead. You can also join a quick call with the
          reviewer if you&apos;d like:
        </p>
        <a href={`/connect/${requestId}/call`} className="btn-primary inline-block">
          Join call
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-center">
      {error && <p className="rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>}
      <button type="button" onClick={() => setStage('idle')} className="btn-primary">
        Try again
      </button>
    </div>
  );
}
