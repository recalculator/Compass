'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json();
      if (res.ok) setMessages((prev) => [...prev, { role: 'assistant', content: json.reply }]);
      else setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Could not reach the server.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-sage-100 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-sage-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-semibold text-white">Compass Coach</p>
                <p className="text-[10px] text-sage-200">Ask me anything about your child's journey</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-sage-200 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-sage-500 text-center">Hi! I have your child's documents and profile loaded. Ask me anything.</p>
                {[
                  'What do my child\'s IEP goals mean?',
                  'What questions should I ask at the next meeting?',
                  'Explain the recommendations in plain English',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); }}
                    className="w-full rounded-xl border border-sage-100 bg-sage-50 px-3 py-2 text-left text-xs text-sage-700 hover:bg-sage-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm bg-sage-600 text-white'
                      : 'rounded-tl-sm bg-sage-50 text-sage-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm bg-sage-50 px-3.5 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-sage-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="flex items-center gap-2 border-t border-sage-100 px-3 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-xl border border-sage-200 bg-sage-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sage-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-600 text-white disabled:opacity-50 hover:bg-sage-700"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-600 text-white shadow-lg hover:bg-sage-700 transition"
        aria-label="Open coach"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
