'use client';

import { useState } from 'react';
import { Loader2, Search, Bookmark, BookmarkCheck, ExternalLink, ShieldAlert } from 'lucide-react';
import { US_STATES } from '@/lib/us-states';
import type { BenefitCategory, BenefitProgram } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

const CATEGORY_LABELS: Record<BenefitCategory, string> = {
  medicaid_waiver: 'Medicaid Waiver Programs',
  regional_center: 'Regional Center Services',
  ssi: 'SSI Eligibility',
  able_account: 'ABLE Accounts',
  state_grant: 'State Grants for Therapy & Equipment',
  tax_credit: 'Tax Credits & Deductions',
  respite_care: 'Respite Care Funding',
};

const CATEGORY_ORDER: BenefitCategory[] = [
  'medicaid_waiver',
  'regional_center',
  'ssi',
  'able_account',
  'state_grant',
  'tax_credit',
  'respite_care',
];

function BenefitCard({ benefit, state }: { benefit: BenefitProgram; state: string }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/benefits/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, benefit }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h4 className="font-semibold text-sage-900">{benefit.program_name}</h4>

      <div className="mt-3 space-y-2 text-sm text-sage-700">
        <p><span className="font-medium text-sage-800">Covers:</span> {benefit.covers}</p>
        <p><span className="font-medium text-sage-800">Who qualifies:</span> {benefit.qualifies}</p>
        <p><span className="font-medium text-sage-800">How to apply:</span> {benefit.how_to_apply}</p>
        {benefit.wait_time && (
          <p><span className="font-medium text-sage-800">Typical wait:</span> {benefit.wait_time}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {benefit.link ? (
          <a
            href={benefit.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Official source
          </a>
        ) : (
          <span className="text-xs text-sage-400">No link available — search your state&apos;s agency site</span>
        )}

        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="btn-secondary shrink-0 text-xs"
        >
          {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save to my profile'}
        </button>
      </div>
    </div>
  );
}

export function BenefitsClient() {
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [benefits, setBenefits] = useState<BenefitProgram[] | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!state) return;
    setLoading(true);
    setError(null);
    setBenefits(null);

    try {
      const res = await fetch('/api/benefits/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not generate benefits');
      setBenefits(json.benefits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const grouped = (benefits ?? []).reduce<Record<string, BenefitProgram[]>>((acc, b) => {
    (acc[b.category] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="card flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label-text" htmlFor="state">State</label>
          <select
            id="state"
            className="input-field"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="">Select your state…</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={!state || loading} className="btn-primary shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Searching…' : 'Find benefits'}
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>
      )}

      {benefits && (
        <div className="flex items-start gap-2 rounded-xl2 border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This list is informational and generated by AI — programs, eligibility, and
            links change often. Always verify details with your state Medicaid office,
            Regional Center, or the official agency before applying.
          </p>
        </div>
      )}

      {benefits &&
        CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
          <div key={cat}>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-base font-semibold text-sage-900">{CATEGORY_LABELS[cat]}</h3>
              <Badge variant="sage">{grouped[cat].length}</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {grouped[cat].map((benefit, i) => (
                <BenefitCard key={`${cat}-${i}`} benefit={benefit} state={state} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
