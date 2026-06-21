'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import clsx from 'clsx';

const DIAGNOSIS_OPTIONS = [
  'Autism Spectrum Disorder',
  'Speech/Language Delay',
  'Developmental Delay',
  'ADHD',
  'Sensory Processing Disorder',
  'Down Syndrome',
  'Not yet diagnosed',
  'Other',
];

const SERVICE_OPTIONS = [
  'ABA Therapy',
  'Speech Therapy',
  'Occupational Therapy',
  'Physical Therapy',
  'Feeding Therapy',
  'Early Intervention',
  'Special Education / IEP',
  'None yet',
];

function toggleInArray(arr: string[], value: string) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function ChildProfileSettings({
  childId,
  initialName,
  initialBirthDate,
  initialDiagnosis,
  initialServices,
  initialZip,
  initialCity,
  initialState,
}: {
  childId: string;
  initialName: string;
  initialBirthDate: string | null;
  initialDiagnosis: string[];
  initialServices: string[];
  initialZip: string | null;
  initialCity: string | null;
  initialState: string | null;
}) {
  const supabase = createClient();

  const [childName, setChildName] = useState(initialName);
  const [birthDate, setBirthDate] = useState(initialBirthDate ?? '');
  const [diagnosis, setDiagnosis] = useState<string[]>(initialDiagnosis);
  const [services, setServices] = useState<string[]>(initialServices);
  const [zip, setZip] = useState(initialZip ?? '');
  const [city, setCity] = useState(initialCity ?? '');
  const [state, setState] = useState(initialState ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const { error: updateError } = await supabase
      .from('child_profiles')
      .update({
        child_name: childName.trim(),
        birth_date: birthDate || null,
        diagnosis,
        current_services: services,
        location_zip: zip || null,
        location_city: city || null,
        location_state: state || null,
      })
      .eq('id', childId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="card space-y-5">
      <h3 className="text-base font-semibold text-sage-900">Child profile</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-text" htmlFor="childName">Name</label>
          <input
            id="childName"
            className="input-field"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="e.g. Mia"
          />
        </div>
        <div>
          <label className="label-text" htmlFor="birthDate">Date of birth</label>
          <input
            id="birthDate"
            type="date"
            className="input-field"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label-text">Diagnosis</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {DIAGNOSIS_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => setDiagnosis(toggleInArray(diagnosis, opt))}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-sm transition',
                diagnosis.includes(opt)
                  ? 'border-sage-600 bg-sage-600 text-white'
                  : 'border-sage-200 bg-white text-sage-700 hover:bg-sage-50'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label-text">Current services</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SERVICE_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => setServices(toggleInArray(services, opt))}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-sm transition',
                services.includes(opt)
                  ? 'border-sage-600 bg-sage-600 text-white'
                  : 'border-sage-200 bg-white text-sage-700 hover:bg-sage-50'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label-text" htmlFor="zip">ZIP code</label>
          <input
            id="zip"
            className="input-field"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="94110"
          />
        </div>
        <div>
          <label className="label-text" htmlFor="city">City</label>
          <input
            id="city"
            className="input-field"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="San Francisco"
          />
        </div>
        <div>
          <label className="label-text" htmlFor="state">State</label>
          <input
            id="state"
            className="input-field"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="CA"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="rounded-xl bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
      </button>
    </div>
  );
}
