'use client';

import { useState } from 'react';

export function ShareCallLink({ roomUrl }: { roomUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sage-200 bg-sage-50 px-3 py-2 text-sm">
      <span className="text-sage-600">Share this link to let anyone else join this call:</span>
      <input
        readOnly
        value={roomUrl}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 rounded border border-sage-200 bg-white px-2 py-1 text-xs text-sage-700"
      />
      <button type="button" onClick={copy} className="btn-primary px-3 py-1 text-xs">
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}
