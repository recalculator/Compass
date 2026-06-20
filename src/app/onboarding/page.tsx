'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/ui/Logo';
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

const STEPS = ['Your child', 'Diagnosis', 'Current services', 'Location'] as const;

function toggleInArray(arr: string[], value: string) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [diagnosis, setDiagnosis] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [state, setStateVal] = useState('');

  const canAdvance =
    (step === 0 && childName.trim().length > 0) ||
    (step === 1 && diagnosis.length > 0) ||
    (step === 2 && services.length > 0) ||
    step === 3;

  async function handleFinish() {
    setSubmitting(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setError('You need to be logged in to continue.');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('child_profiles').insert({
      user_id: user.id,
      child_name: childName.trim(),
      birth_date: birthDate || null,
      diagnosis,
      current_services: services,
      location_zip: zip || null,
      location_city: city || null,
      location_state: state || null,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push('/roadmap');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sage-50 px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={clsx(
                  'h-1.5 w-full rounded-full',
                  i <= step ? 'bg-sage-600' : 'bg-sage-200'
                )}
              />
              <span
                className={clsx(
                  'text-xs',
                  i === step ? 'font-semibold text-sage-800' : 'text-sage-400'
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="card">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-sage-900">
                Tell us about your child
              </h2>
              <p className="text-sm text-sage-600">
                This helps Compass personalize everything — from the roadmap to next
                steps.
              </p>
              <div>
                <label className="label-text" htmlFor="childName">Child&apos;s name</label>
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
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-sage-900">
                What&apos;s {childName || 'your child'}&apos;s diagnosis?
              </h2>
              <p className="text-sm text-sage-600">Select all that apply.</p>
              <div className="flex flex-wrap gap-2">
                {DIAGNOSIS_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setDiagnosis(toggleInArray(diagnosis, opt))}
                    className={clsx(
                      'rounded-full border px-4 py-2 text-sm transition',
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
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-sage-900">
                What services are you currently using?
              </h2>
              <p className="text-sm text-sage-600">Select all that apply.</p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setServices(toggleInArray(services, opt))}
                    className={clsx(
                      'rounded-full border px-4 py-2 text-sm transition',
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
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-sage-900">Where are you located?</h2>
              <p className="text-sm text-sage-600">
                This helps us find specialists near you in the Directory.
              </p>
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
              <div className="grid grid-cols-2 gap-4">
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
                    onChange={(e) => setStateVal(e.target.value)}
                    placeholder="CA"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={clsx('btn-ghost', step === 0 && 'invisible')}
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStep((s) => s + 1)}
                className="btn-primary"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinish}
                className="btn-primary"
              >
                {submitting ? 'Saving…' : 'Build my roadmap'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
