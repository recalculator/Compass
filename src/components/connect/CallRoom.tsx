'use client';

import { useEffect, useRef } from 'react';
import DailyIframe, { type DailyCall } from '@daily-co/daily-js';

export function CallRoom({ roomUrl }: { roomUrl: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const call = DailyIframe.createFrame(containerRef.current, {
      url: roomUrl,
      showLeaveButton: true,
      iframeStyle: { width: '100%', height: '100%', border: '0' },
    });
    callRef.current = call;
    call.join();

    return () => {
      call.leave();
      call.destroy();
    };
  }, [roomUrl]);

  return <div ref={containerRef} className="h-[70vh] w-full overflow-hidden rounded-lg" />;
}
