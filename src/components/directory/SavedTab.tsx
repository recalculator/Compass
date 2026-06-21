'use client';

import { useState } from 'react';
import { Bookmark, HeartHandshake, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import { LiveSpecialistCard } from './LiveSpecialistCard';

type SavedSpecialist = {
  id: string;
  name: string;
  specialty: string;
  phone: string | null;
  address: string | null;
  description: string | null;
  profile_url: string | null;
  saved_at: string;
};

type SavedBenefit = {
  id: string;
  program_name: string;
  state: string;
  details: { description?: string; contactInfo?: string } | null;
  saved_at: string;
};

export function SavedTab({
  specialists: initialSpecialists,
  benefits: initialBenefits,
}: {
  specialists: SavedSpecialist[];
  benefits: SavedBenefit[];
}) {
  const [specialists, setSpecialists] = useState(initialSpecialists);
  const [benefits, setBenefits] = useState(initialBenefits);
  const [expandedBenefit, setExpandedBenefit] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summaryLoading, setSummaryLoading] = useState<Record<string, boolean>>({});
  const [summaryErrors, setSummaryErrors] = useState<Record<string, string>>({});

  async function loadSummary(b: SavedBenefit) {
    if (summaries[b.id] || summaryLoading[b.id]) return;
    setSummaryLoading((prev) => ({ ...prev, [b.id]: true }));
    setSummaryErrors((prev) => ({ ...prev, [b.id]: '' }));
    try {
      const res = await fetch('/api/search/benefit-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programName: b.program_name,
          state: b.state,
          storedDescription: b.details?.description ?? '',
        }),
      });
      const json = await res.json();
      if (res.ok && json.summary) {
        setSummaries((prev) => ({ ...prev, [b.id]: json.summary }));
      } else {
        setSummaryErrors((prev) => ({ ...prev, [b.id]: json.error ?? 'Could not load description.' }));
      }
    } catch {
      setSummaryErrors((prev) => ({ ...prev, [b.id]: 'Could not load description.' }));
    } finally {
      setSummaryLoading((prev) => ({ ...prev, [b.id]: false }));
    }
  }

  function toggleBenefit(b: SavedBenefit) {
    const next = expandedBenefit === b.id ? null : b.id;
    setExpandedBenefit(next);
    if (next) loadSummary(b);
  }

  async function removeBenefit(id: string) {
    setBenefits((prev) => prev.filter((b) => b.id !== id));
    await fetch(`/api/saved/benefits?id=${id}`, { method: 'DELETE' });
  }

  const isEmpty = specialists.length === 0 && benefits.length === 0;

  if (isEmpty) {
    return (
      <div className="mt-10 text-center text-sm text-sage-400">
        Nothing saved yet. Use the bookmark icon on any specialist or benefit program to save it here.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {specialists.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="h-4 w-4 text-sage-500" />
            <h2 className="text-base font-semibold text-sage-900">Saved Specialists</h2>
          </div>
          <div className="space-y-3">
            {specialists.map((s) => (
              <LiveSpecialistCard
                key={s.id}
                initialSavedId={s.id}
                result={{
                  name: s.name,
                  specialty: s.specialty,
                  phone: s.phone ?? '',
                  address: s.address ?? '',
                  description: s.description ?? '',
                  profileUrl: s.profile_url ?? '',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {benefits.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HeartHandshake className="h-4 w-4 text-sage-500" />
            <h2 className="text-base font-semibold text-sage-900">Saved Benefits</h2>
          </div>
          <div className="space-y-3">
            {benefits.map((b) => {
              const isExpanded = expandedBenefit === b.id;
              return (
                <div key={b.id} className="overflow-hidden rounded-xl border border-sage-100 bg-sage-50">
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-sage-900">{b.program_name}</p>
                      <p className="text-xs text-sage-400">{b.state}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => toggleBenefit(b)}
                        className="rounded-lg p-1.5 text-sage-400 hover:bg-sage-100 hover:text-sage-600"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => removeBenefit(b.id)}
                        className="rounded-lg p-1.5 text-sage-300 hover:text-clay-400"
                        aria-label="Remove"
                      >
                        <Bookmark className="h-4 w-4 fill-sage-400 text-sage-400" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-sage-100 bg-white px-4 pb-4 pt-3">
                      {summaryLoading[b.id] && (
                        <div className="flex items-center gap-2 text-xs text-sage-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading description…
                        </div>
                      )}
                      {!summaryLoading[b.id] && summaries[b.id] && (
                        <div className="flex gap-2">
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-400" />
                          <p className="text-sm text-sage-700">{summaries[b.id]}</p>
                        </div>
                      )}
                      {!summaryLoading[b.id] && summaryErrors[b.id] && (
                        <p className="text-xs text-clay-500">{summaryErrors[b.id]}</p>
                      )}
                      {b.details?.contactInfo && (
                        <p className="mt-2 text-xs text-sage-500">{b.details.contactInfo}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
