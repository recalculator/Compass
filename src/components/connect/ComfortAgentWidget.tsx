'use client';

import { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';

export function ComfortAgentWidget({
  expertCallRequestId,
  onCallEnd,
}: {
  expertCallRequestId: string;
  onCallEnd: () => void;
}) {
  const vapiRef = useRef<Vapi | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const onCallEndRef = useRef(onCallEnd);
  onCallEndRef.current = onCallEnd;

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!publicKey || !assistantId) {
      setDegraded(true);
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on('error', () => setDegraded(true));
    vapi.on('speech-start', () => setSpeaking(true));
    vapi.on('speech-end', () => setSpeaking(false));
    vapi.on('call-end', () => onCallEndRef.current());

    vapi
      .start(assistantId, { metadata: { expertCallRequestId } })
      .catch(() => setDegraded(true));

    return () => {
      vapi.stop();
    };
  }, [expertCallRequestId]);

  function endCall() {
    vapiRef.current?.stop();
  }

  if (degraded) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-sage-600">
          We couldn&apos;t start the conversation. Please try again in a moment.
        </p>
        <button type="button" onClick={() => onCallEndRef.current()} className="btn-primary">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative flex h-24 w-24 items-center justify-center">
        {speaking && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-300 opacity-60" />
        )}
        <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-sage-500 text-white">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
            <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.08A7 7 0 0 0 19 11Z" />
          </svg>
        </span>
      </div>
      <p className="text-sm font-medium text-sage-900">You&apos;re talking with Compass Companion</p>
      <p className="text-sm text-sage-600">{speaking ? 'Listening…' : 'Go ahead, take your time.'}</p>
      <button type="button" onClick={endCall} className="rounded-lg border border-sage-200 px-4 py-2 text-sm text-sage-700">
        I&apos;m done — find me someone
      </button>
    </div>
  );
}
