'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { LiveSpecialistCard } from './LiveSpecialistCard';

type Status = 'idle' | 'loading' | 'done' | 'error';

type SpecialistResult = {
  name: string;
  specialty: string;
  phone: string;
  address: string;
  description: string;
  profileUrl: string;
};

const SPECIALTY_LABELS: Record<string, string> = {
  aba: 'ABA Therapy',
  speech: 'Speech Therapy',
  ot: 'Occupational Therapy',
  feeding: 'Feeding Therapy',
  developmental_pediatrician: 'Developmental Pediatrician',
  pt: 'Physical Therapy',
  psychology: 'Psychology',
  neurology: 'Neurology',
};

export function DirectoryLiveSearch({
  zip,
  specialtyType,
  savedMap = {},
}: {
  zip: string;
  specialtyType: string;
  savedMap?: Record<string, string>;
}) {
  const [status, setStatus] = useState<Status>('loading');
  const [results, setResults] = useState<SpecialistResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const label = specialtyType ? (SPECIALTY_LABELS[specialtyType] ?? specialtyType) : 'All specialties';

  useEffect(() => { search(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function search() {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/search/specialists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: zip, specialtyType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Search failed');
      setStatus('done');
      setResults(json.specialists ?? []);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-sage-100 bg-sage-50 p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-sage-800">
          {status === 'loading'
            ? `Searching for ${label} specialists near ${zip}…`
            : `${label} specialists near ${zip}`}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-sage-400" />}
          {status === 'done' && (
            <button onClick={search} className="text-xs text-sage-400 hover:underline">
              Refresh
            </button>
          )}
        </div>
      </div>

      {status === 'error' && (
        <p className="mt-3 rounded-lg bg-clay-50 px-3 py-2 text-xs text-clay-500">{error}</p>
      )}

      {status === 'done' && results.length === 0 && (
        <p className="mt-3 text-xs text-sage-400">No results found. Try a different ZIP or specialty.</p>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <LiveSpecialistCard
              key={i}
              result={r}
              initialSavedId={savedMap[r.name]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
