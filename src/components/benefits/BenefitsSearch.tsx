'use client';

import { useState, useEffect } from 'react';
import { Loader2, Bookmark, BookmarkCheck, HandCoins } from 'lucide-react';

type BenefitResult = {
  programName: string;
  description: string;
  contactInfo: string;
  savedId?: string;
};

type Status = 'loading' | 'done' | 'error';

export function BenefitsSearch({
  locationState,
  zipCode,
  diagnoses,
  childAge,
  currentServices,
}: {
  locationState: string;
  zipCode?: string;
  diagnoses: string[];
  childAge?: number;
  currentServices?: string[];
}) {
  const cacheKey = `benefits-search:${locationState}:${diagnoses.join('|')}:${childAge ?? ''}:${(currentServices ?? []).join('|')}`;

  const [status, setStatus] = useState<Status>('loading');
  const [benefits, setBenefits] = useState<BenefitResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const diagnosisLabel = diagnoses.length === 1
    ? diagnoses[0]
    : `${diagnoses.slice(0, -1).join(', ')} and ${diagnoses[diagnoses.length - 1]}`;

  async function search() {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/search/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: locationState, zipCode, diagnoses, childAge, currentServices }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Search failed');
      const results: BenefitResult[] = json.benefits ?? [];
      setBenefits(results);
      setStatus('done');
      localStorage.setItem(cacheKey, JSON.stringify(results));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setBenefits(JSON.parse(cached));
      setStatus('done');
      return;
    }
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  useEffect(() => {
    if (status === 'done') localStorage.setItem(cacheKey, JSON.stringify(benefits));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benefits]);

  return (
    <div className="mt-6 card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-sage-900">
            {status === 'loading'
              ? `Finding programs in ${locationState}…`
              : `Programs in ${locationState}`}
          </h2>
          <p className="mt-0.5 text-sm text-sage-500">
            State programs, Medicaid waivers, and disability services for {diagnosisLabel}.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-sage-400" />}
          {status === 'done' && (
            <button onClick={search} className="text-xs text-sage-400 hover:underline">Refresh</button>
          )}
        </div>
      </div>

      {status === 'error' && (
        <div className="mt-4 rounded-lg bg-clay-50 px-3 py-2 space-y-1">
          <p className="text-sm text-clay-500">{error}</p>
          <button onClick={search} className="text-xs text-clay-400 hover:underline">Try again</button>
        </div>
      )}

      {status === 'done' && benefits.length === 0 && (
        <p className="mt-4 text-sm text-sage-400">No programs found in {locationState}. Try refreshing.</p>
      )}

      {benefits.length > 0 && (
        <div className="mt-4 space-y-3">
          {benefits.map((b, i) => (
            <BenefitCard
              key={i}
              benefit={b}
              state={locationState}
              onSaved={(id) => setBenefits((prev) => prev.map((x, j) => j === i ? { ...x, savedId: id } : x))}
              onUnsaved={() => setBenefits((prev) => prev.map((x, j) => j === i ? { ...x, savedId: undefined } : x))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function BenefitCard({
  benefit,
  state,
  onSaved,
  onUnsaved,
}: {
  benefit: BenefitResult;
  state: string;
  onSaved: (id: string) => void;
  onUnsaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function toggleSave() {
    if (saving) return;
    if (benefit.savedId) {
      const id = benefit.savedId;
      onUnsaved();
      await fetch(`/api/saved/benefits?id=${id}`, { method: 'DELETE' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/saved/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programName: benefit.programName,
          description: benefit.description,
          contactInfo: benefit.contactInfo,
          state,
        }),
      });
      const json = await res.json();
      if (res.ok) onSaved(json.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl2 border border-sage-100 bg-white p-4 shadow-softer transition hover:shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl2 bg-clay-100 text-clay-500">
          <HandCoins className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-sage-900">{benefit.programName}</p>
            <button
              type="button"
              onClick={toggleSave}
              className="shrink-0 rounded-lg p-1 text-sage-400 hover:text-sage-600"
              aria-label={benefit.savedId ? 'Unsave' : 'Save'}
            >
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : benefit.savedId
                ? <BookmarkCheck className="h-3.5 w-3.5 text-sage-600" />
                : <Bookmark className="h-3.5 w-3.5" />}
            </button>
          </div>
          {benefit.description && <p className="mt-1 text-xs text-sage-600">{benefit.description}</p>}
          {benefit.contactInfo && <p className="mt-1.5 text-xs text-sage-500">{benefit.contactInfo}</p>}
        </div>
      </div>
    </div>
  );
}
