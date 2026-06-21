'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LiveSpecialistCard } from './LiveSpecialistCard';

const DIAGNOSIS_SPECIALTY_MAP: Record<string, string[]> = {
  'Autism Spectrum Disorder':    ['ABA Therapy', 'Occupational Therapy', 'Speech Therapy', 'Developmental Pediatrician'],
  'Speech/Language Delay':       ['Speech Therapy', 'Developmental Pediatrician'],
  'Developmental Delay':         ['Occupational Therapy', 'Speech Therapy', 'Physical Therapy'],
  'ADHD':                        ['Psychology', 'Occupational Therapy'],
  'Sensory Processing Disorder': ['Occupational Therapy', 'ABA Therapy'],
  'Down Syndrome':               ['Speech Therapy', 'Occupational Therapy', 'Physical Therapy'],
};

function specialtiesForDiagnoses(diagnoses: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const dx of diagnoses) {
    for (const specialty of DIAGNOSIS_SPECIALTY_MAP[dx] ?? []) {
      if (!seen.has(specialty)) { seen.add(specialty); result.push(specialty); }
    }
  }
  return result;
}

type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

type SpecialistResult = {
  name: string; specialty: string; phone: string;
  address: string; description: string; profileUrl: string;
};

type SpecialtyState = {
  label: string; status: SearchStatus; results: SpecialistResult[]; error: string | null;
};

const STORAGE_PREFIX = 'compass:liveSearch:';

export function LiveSearch({
  childName,
  diagnoses,
  zipCode,
  savedMap = {},
}: {
  childName: string;
  diagnoses: string[];
  zipCode: string;
  savedMap?: Record<string, string>;
}) {
  const specialtyLabels = specialtiesForDiagnoses(diagnoses);
  const storageKey = `${STORAGE_PREFIX}${zipCode}`;

  const [searches, setSearches] = useState<SpecialtyState[]>(() => {
    // Try to restore from localStorage on first render
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved: SpecialtyState[] = JSON.parse(raw);
        // Only restore if the labels match the current diagnoses
        if (saved.length === specialtyLabels.length && saved.every((s, i) => s.label === specialtyLabels[i])) {
          return saved.map((s) => ({ ...s, status: s.status === 'loading' ? 'idle' : s.status }));
        }
      }
    } catch { /* ignore */ }
    return specialtyLabels.map((label) => ({ label, status: 'idle', results: [], error: null }));
  });

  // Persist results whenever they change
  useEffect(() => {
    const hasResults = searches.some((s) => s.results.length > 0);
    if (hasResults) {
      localStorage.setItem(storageKey, JSON.stringify(searches));
    }
  }, [searches, storageKey]);

  function updateSearch(label: string, patch: Partial<SpecialtyState>) {
    setSearches((prev) => prev.map((s) => (s.label === label ? { ...s, ...patch } : s)));
  }

  async function searchSpecialists(label: string) {
    updateSearch(label, { status: 'loading', results: [], error: null });
    try {
      const res = await fetch('/api/search/specialists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, specialtyType: label }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Search failed');
      updateSearch(label, { status: 'done', results: json.specialists ?? [] });
    } catch (err) {
      updateSearch(label, { status: 'error', error: err instanceof Error ? err.message : 'Something went wrong' });
    }
  }

  if (specialtyLabels.length === 0 || !zipCode) return null;

  return (
    <div className="card mt-6">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-sage-500" />
        <h2 className="text-base font-semibold text-sage-900">
          Recommended for {childName}
        </h2>
      </div>
      <p className="mt-1 text-sm text-sage-500">
        Based on {childName}&apos;s profile. First search may take ~60 seconds.
      </p>

      <div className="mt-4 space-y-5">
        {searches.map((s) => (
          <div key={s.label}>
            <div className="flex items-center gap-3">
              <Badge variant="sky">{s.label}</Badge>
              {s.status === 'idle' && (
                <button onClick={() => searchSpecialists(s.label)} className="btn-secondary text-xs">
                  Search near {zipCode}
                </button>
              )}
              {s.status === 'loading' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-sage-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching Psychology Today…
                </span>
              )}
              {s.status === 'done' && (
                <button onClick={() => searchSpecialists(s.label)} className="text-xs text-sage-400 hover:underline">
                  Refresh
                </button>
              )}
            </div>

            {s.status === 'error' && (
              <p className="mt-2 rounded-lg bg-clay-50 px-3 py-2 text-xs text-clay-500">{s.error}</p>
            )}
            {s.status === 'done' && s.results.length === 0 && (
              <p className="mt-2 text-xs text-sage-400">No results found near {zipCode}.</p>
            )}
            {s.results.length > 0 && (
              <div className="mt-3 space-y-2">
                {s.results.map((r, i) => (
                  <LiveSpecialistCard key={i} result={r} initialSavedId={savedMap[r.name]} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
