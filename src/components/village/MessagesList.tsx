'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Search, Loader2 } from 'lucide-react';

type Conversation = {
  userId: string;
  name: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

type UserResult = { id: string; full_name: string };

function NewMessageSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setSearching(true);
    const handle = setTimeout(() => {
      fetch(`/api/community/users?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then(({ users }) => setResults(users ?? []))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="mb-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search, or scroll to see everyone registered…"
          className="input-field pl-9"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-sage-400" />
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-2 max-h-80 space-y-1.5 overflow-y-auto">
          {results.map((u) => (
            <Link
              key={u.id}
              href={`/village/messages/${u.id}`}
              className="card flex items-center gap-3 py-3 hover:shadow-none"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-200 text-xs font-bold text-sage-700">
                {u.full_name[0]?.toUpperCase() ?? 'P'}
              </div>
              <span className="text-sm font-medium text-sage-900">{u.full_name}</span>
            </Link>
          ))}
        </div>
      )}

      {!searching && results.length === 0 && (
        <p className="mt-2 text-xs text-sage-400">
          {query.trim() ? `No one found matching "${query}".` : 'No other parents registered yet.'}
        </p>
      )}
    </div>
  );
}

export function MessagesList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/community/messages')
      .then((r) => r.json())
      .then(({ messages, myId }) => {
        if (!messages) return;
        const map = new Map<string, Conversation>();
        for (const msg of messages as {
          id: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
          sender: { id: string; full_name: string } | null;
          recipient: { id: string; full_name: string } | null;
        }[]) {
          const otherId = msg.sender_id === myId ? msg.recipient_id : msg.sender_id;
          const otherUser = msg.sender_id === myId ? msg.recipient : msg.sender;
          if (!map.has(otherId)) {
            map.set(otherId, {
              userId: otherId,
              name: otherUser?.full_name ?? 'A parent',
              lastMessage: msg.body,
              lastAt: msg.created_at,
              unread: msg.recipient_id === myId && !msg.read_at ? 1 : 0,
            });
          } else {
            const existing = map.get(otherId)!;
            if (msg.recipient_id === myId && !msg.read_at) {
              map.set(otherId, { ...existing, unread: existing.unread + 1 });
            }
          }
        }
        setConversations(Array.from(map.values()));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <NewMessageSearch />
        <p className="py-10 text-center text-sm text-sage-400">Loading messages…</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div>
        <NewMessageSearch />
        <div className="py-10 text-center">
          <Mail className="mx-auto h-8 w-8 text-sage-300" />
          <p className="mt-3 text-sm text-sage-500">No messages yet.</p>
          <p className="mt-1 text-xs text-sage-400">
            Search for a parent above, or message someone from a post in the Feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NewMessageSearch />
      <div className="space-y-2">
      {conversations.map((conv) => (
        <Link
          key={conv.userId}
          href={`/village/messages/${conv.userId}`}
          className="card flex items-center gap-3 hover:shadow-none"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-200 text-sm font-bold text-sage-700">
            {conv.name[0]?.toUpperCase() ?? 'P'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-sage-900">{conv.name}</span>
              <span className="text-xs text-sage-400">{relativeTime(conv.lastAt)}</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-sage-500">{conv.lastMessage}</p>
          </div>
          {conv.unread > 0 && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-600 text-[10px] font-bold text-white">
              {conv.unread}
            </span>
          )}
        </Link>
      ))}
      </div>
    </div>
  );
}
