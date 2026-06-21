'use client';

import { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';

export function ComfortAgentWidget({ concernSummary }: { concernSummary: string }) {
  const vapiRef = useRef<Vapi | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [speaking, setSpeaking] = useState(false);

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

    vapi.start(assistantId, { variableValues: { concernSummary } }).catch(() => setDegraded(true));

    return () => {
      vapi.stop();
    };
  }, [concernSummary]);

  if (degraded) {
    return (
      <p className="text-sm text-sage-600">
        We&apos;re still finding the right person for you. Hang tight.
      </p>
    );
  }

  return (
    <div className="rounded-lg bg-sage-50 px-4 py-3 text-sm text-sage-700">
      {speaking ? 'Listening…' : "A calming companion is here with you while we find your expert."}
    </div>
  );
}
