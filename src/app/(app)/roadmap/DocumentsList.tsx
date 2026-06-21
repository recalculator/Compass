'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, X, Loader2 } from 'lucide-react';

type Doc = {
  id: string;
  file_name: string;
  document_type: string;
  created_at: string;
  status: string;
};

const TYPE_LABELS: Record<string, string> = {
  iep: 'IEP',
  evaluation: 'Evaluation',
  therapy_note: 'Therapy Note',
  other: 'Other',
};

export function DocumentsList({ documents }: { documents: Doc[] }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [docs, setDocs] = useState(documents);

  async function remove(id: string) {
    setRemoving(id);
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setRemoving(null);
    router.refresh();
  }

  if (docs.length === 0) return null;

  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 rounded-xl border border-sage-100 bg-white px-4 py-3 shadow-softer"
        >
          <FileText className="h-4 w-4 shrink-0 text-sage-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sage-900">{doc.file_name}</p>
            <p className="text-xs text-sage-400">
              {TYPE_LABELS[doc.document_type] ?? doc.document_type}
              {doc.status === 'processing' && ' · Processing…'}
            </p>
          </div>
          <button
            onClick={() => remove(doc.id)}
            disabled={removing === doc.id}
            className="shrink-0 rounded-full p-1 text-sage-300 hover:bg-sage-50 hover:text-clay-400 disabled:opacity-50"
            aria-label="Remove document"
          >
            {removing === doc.id
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <X className="h-4 w-4" />}
          </button>
        </div>
      ))}
    </div>
  );
}
