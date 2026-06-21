'use client';

import { useState } from 'react';
import { Phone, MapPin, ChevronDown, ChevronUp, Loader2, CheckCircle2, AlertCircle, Sparkles, Bookmark, BookmarkCheck } from 'lucide-react';

type SpecialistResult = {
  name: string;
  specialty: string;
  phone: string;
  address: string;
  description: string;
  profileUrl: string;
};

type SummaryStatus = 'idle' | 'loading' | 'done' | 'error';
type BookingStatus = 'idle' | 'form' | 'booking' | 'done' | 'error';
type SaveStatus = 'idle' | 'saving' | 'saved';

export function LiveSpecialistCard({
  result,
  initialSavedId,
}: {
  result: SpecialistResult;
  initialSavedId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus>('idle');
  const [summary, setSummary] = useState('');

  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('idle');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>(initialSavedId ? 'saved' : 'idle');
  const [savedId, setSavedId] = useState<string | null>(initialSavedId ?? null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function loadSummary() {
    if (summaryStatus !== 'idle') return;
    setSummaryStatus('loading');
    try {
      const res = await fetch('/api/search/specialist-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.name,
          specialty: result.specialty,
          address: result.address,
          description: result.description,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load summary');
      setSummary(json.summary);
      setSummaryStatus('done');
    } catch {
      setSummaryStatus('error');
    }
  }

  function toggleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next) loadSummary();
  }

  async function toggleSave() {
    if (saveStatus === 'saving') return;
    setSaveError(null);
    if (saveStatus === 'saved' && savedId) {
      setSaveStatus('idle');
      const id = savedId;
      setSavedId(null);
      await fetch(`/api/saved/specialists?id=${id}`, { method: 'DELETE' });
      return;
    }
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/saved/specialists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.name,
          specialty: result.specialty || 'general',
          phone: result.phone,
          address: result.address,
          description: result.description,
          profileUrl: result.profileUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setSavedId(json.id);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('idle');
      setSaveError(err instanceof Error ? err.message : 'Could not save');
    }
  }

  async function submitBooking() {
    if (!phone.trim()) return;
    setBookingStatus('booking');
    setBookingError(null);
    const profileLink = result.profileUrl ||
      `https://www.psychologytoday.com/us/therapists?query=${encodeURIComponent(result.name)}`;
    try {
      const res = await fetch('/api/search/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialistName: result.name,
          profileUrl: profileLink,
          parentPhone: phone,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Booking failed');
      setBookingStatus('done');
    } catch (err) {
      setBookingStatus('error');
      setBookingError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="rounded-xl border border-sage-100 bg-white shadow-softer">
      {/* Main card row */}
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-sage-900">{result.name}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {result.phone && (
              <span className="inline-flex items-center gap-1 text-xs text-sage-500">
                <Phone className="h-3 w-3" />
                {result.phone}
              </span>
            )}
            {result.address && (
              <span className="inline-flex items-center gap-1 text-xs text-sage-500">
                <MapPin className="h-3 w-3" />
                {result.address}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Save */}
          <button
            type="button"
            onClick={toggleSave}
            className="rounded-lg p-1.5 text-sage-400 hover:bg-sage-50 hover:text-sage-600"
            aria-label={saveStatus === 'saved' ? 'Unsave' : 'Save'}
          >
            {saveStatus === 'saved'
              ? <BookmarkCheck className="h-4 w-4 text-sage-600" />
              : saveStatus === 'saving'
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Bookmark className="h-4 w-4" />}
          </button>

          {/* Book */}
          {bookingStatus === 'idle' && (
            <button onClick={() => setBookingStatus('form')} className="btn-primary text-xs">
              Book appointment
            </button>
          )}
          {bookingStatus === 'done' && (
            <span className="inline-flex items-center gap-1 text-xs text-sage-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sent
            </span>
          )}

          {/* Expand */}
          <button
            type="button"
            onClick={toggleExpand}
            className="rounded-lg p-1.5 text-sage-400 hover:bg-sage-50 hover:text-sage-600"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Booking form */}
      {bookingStatus === 'form' && (
        <div className="border-t border-sage-100 px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs font-medium text-sage-800">
            Our AI will submit an appointment request to {result.name} on your behalf.
          </p>
          <div>
            <label className="label-text text-xs">Your phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
              className="input-field mt-1 text-sm"
            />
          </div>
          <div>
            <label className="label-text text-xs">Notes for the provider (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Seeking initial consultation for my 5-year-old"
              className="input-field mt-1 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={submitBooking} disabled={!phone.trim()} className="btn-primary text-sm disabled:opacity-50">
              Confirm & send
            </button>
            <button onClick={() => setBookingStatus('idle')} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {bookingStatus === 'booking' && (
        <div className="border-t border-sage-100 px-4 py-3 flex items-center gap-2 text-sm text-sage-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Submitting appointment request…
        </div>
      )}

      {bookingStatus === 'error' && (
        <div className="border-t border-sage-100 px-4 py-3 space-y-1">
          <div className="flex items-start gap-2 text-xs text-clay-500">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {bookingError}
          </div>
          <button onClick={() => setBookingStatus('form')} className="text-xs text-sage-400 hover:underline">
            Try again
          </button>
        </div>
      )}

      {saveError && (
        <div className="border-t border-sage-100 px-4 py-2">
          <p className="text-xs text-clay-500">{saveError}</p>
        </div>
      )}

      {/* AI summary dropdown */}
      {expanded && (
        <div className="border-t border-sage-100 px-4 pb-4 pt-3">
          {summaryStatus === 'loading' && (
            <div className="flex items-center gap-2 text-xs text-sage-400">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Generating summary…
            </div>
          )}
          {summaryStatus === 'done' && (
            <div className="flex gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-400" />
              <p className="text-xs text-sage-600">{summary}</p>
            </div>
          )}
          {summaryStatus === 'error' && (
            <p className="text-xs text-sage-400">Could not generate summary.</p>
          )}
        </div>
      )}
    </div>
  );
}
