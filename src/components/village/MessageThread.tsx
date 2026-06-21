'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

type DmMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function MessageThread({
  recipientId,
  recipientName,
  initialMessages,
  myId,
}: {
  recipientId: string;
  recipientName: string;
  initialMessages: DmMessage[];
  myId: string;
}) {
  const [messages, setMessages] = useState<DmMessage[]>(initialMessages);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, body: body.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not send message');
      setMessages((prev) => [...prev, json.message as DmMessage]);
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSending(false);
    }
  }

  function fmt(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-sage-400">
            No messages yet. Say hello to {recipientName}!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === myId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  isMe
                    ? 'rounded-tr-sm bg-sage-600 text-white'
                    : 'rounded-tl-sm bg-sage-100 text-sage-800'
                }`}
              >
                <p className="leading-relaxed">{msg.body}</p>
                <p className={`mt-1 text-right text-[10px] ${isMe ? 'text-sage-200' : 'text-sage-400'}`}>
                  {fmt(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mx-4 rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>
      )}

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-sage-100 px-4 py-3">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Message ${recipientName}…`}
          className="input-field flex-1 text-sm"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-600 text-white disabled:opacity-50 hover:bg-sage-700"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
