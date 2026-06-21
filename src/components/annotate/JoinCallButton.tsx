'use client';

import { useState } from 'react';
import { CallRoom } from '@/components/connect/CallRoom';

export function JoinCallButton({ roomUrl }: { roomUrl: string }) {
  const [joined, setJoined] = useState(false);

  if (joined) {
    return <CallRoom roomUrl={roomUrl} />;
  }

  return (
    <button type="button" onClick={() => setJoined(true)} className="btn-primary">
      Join the live call
    </button>
  );
}
