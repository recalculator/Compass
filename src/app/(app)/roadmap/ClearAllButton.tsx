'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

export function ClearAllButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClear() {
    const confirmed = window.confirm(
      'This will permanently delete all uploaded documents and clear your journey timeline. This cannot be undone.\n\nContinue?'
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch('/api/documents/clear', { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Clear failed');
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClear}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-sage-400 hover:text-clay-500 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      Clear all documents
    </button>
  );
}
